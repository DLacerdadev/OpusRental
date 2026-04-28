import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { 
  insertUserSchema, 
  insertTrailerSchema, 
  type InsertTrailer,
  insertShareSchema, 
  financialRecords,
  payments, 
  insertGpsDeviceSchema,
  insertRentalClientSchema,
  insertRentalContractSchema,
  insertInvoiceSchema,
  insertInvoiceItemSchema,
  insertChecklistSchema,
  insertMaintenanceScheduleSchema,
  insertBrokerDispatchSchema,
  auditLogs,
  users
} from "@shared/schema";
import { PDFService, fetchLogoAsDataUrl } from "./services/pdf.service";
import { buildPaymentMethods } from "./services/payment-methods.service";
import { EmailService } from "./services/email.service";
import { verifyInvoiceToken, buildPublicPaymentUrl } from "./services/invoice-token.service";
import { ExportService } from "./services/export.service";
import { ImportService } from "./services/import.service";
import { MonitoringService } from "./services/monitoring.service";
import { NotificationService } from "./services/notification.service";
import {
  validateInvoicePayment,
  invoiceAmountToCents,
  ACCEPTABLE_INVOICE_STATUSES_FOR_PAYMENT,
} from "./services/payment-validation.service";
import { z } from "zod";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { isAuthenticated, isManager, isAdmin, requireRole, authorize, checkOwnership, logAccess } from "./middleware/auth";
import { tenantMiddleware, requireTenant } from "./tenant-middleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db, pool } from "./db";
import { sql, eq, and } from "drizzle-orm";
import { GpsAdapterFactory, type GpsProvider } from "./services/gps/factory";
import multer from "multer";
import { ObjectStorageService, ObjectNotFoundError } from "./replit_integrations/object_storage/objectStorage";
import { insertTrailerDocumentSchema, trailerDocuments } from "@shared/schema";

// Warn if SESSION_SECRET is not set in production
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.error("[SECURITY] SESSION_SECRET environment variable is not set. Sessions are insecure in production.");
  process.exit(1);
}

const PgSession = ConnectPgSimple(session);

// Initialize Stripe with secret key (optional for development)
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2025-10-29.clover",
    })
  : null;

// Helper to check if Stripe is configured
const isStripeConfigured = () => stripe !== null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https://api.stripe.com", "wss:", "ws:"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["https://js.stripe.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Rate limiting
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 requests per window
    message: "Too many login attempts, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
  });

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  });

  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per window for admin routes
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Session middleware — PostgreSQL store (sessions survive server restarts)
  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "opus-rental-capital-secret-key-dev",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Tenant context middleware - detect tenant from domain/header/session
  app.use(tenantMiddleware);

  // Access logging
  app.use(logAccess());

  // Public health check endpoint — no authentication required
  app.get("/api/health", async (_req, res) => {
    const startedAt = new Date().toISOString();
    try {
      // Ping the database
      await pool.query("SELECT 1");
      res.json({
        status: "ok",
        timestamp: startedAt,
        services: {
          database: "connected",
          sessionStore: "postgresql",
          scheduler: "active",
        },
        environment: process.env.NODE_ENV || "development",
        version: "1.0.0",
      });
    } catch (err) {
      res.status(503).json({
        status: "degraded",
        timestamp: startedAt,
        services: {
          database: "disconnected",
          sessionStore: "postgresql",
          scheduler: "unknown",
        },
        error: "Database connectivity issue",
      });
    }
  });

  // Auth routes
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Normalize email to lowercase for consistent comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = await storage.getUserByEmail(normalizedEmail, req.tenantId!);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Login failed" });
        }

        req.session.userId = user.id;
        req.session.tenantId = user.tenantId;
        req.session.user = {
          id: user.id,
          email: user.email,
          role: user.role as "investor" | "manager" | "admin",
        };
        
        req.session.save(async (err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Login failed" });
          }

          await storage.createAuditLog({
        tenantId: req.tenantId!,
            userId: user.id,
            action: "login",
            entityType: "user",
            entityId: user.id,
            details: { email: user.email, role: user.role },
            ipAddress: req.ip,
          });

          const { password: _, ...userWithoutPassword } = user;
          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const { firstName, lastName, email, username, password, country, phone } = req.body;

      // Normalize email to lowercase for consistent storage and comparison
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail, req.tenantId!);
      if (existingUser) {
        return res.status(400).json({ message: "emailExists" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username, req.tenantId!);
      if (existingUsername) {
        return res.status(400).json({ message: "usernameExists" });
      }

      // Create new investor user (password will be hashed in createUser)
      const newUser = await storage.createUser({
        tenantId: req.tenantId!,
        firstName,
        lastName,
        email: normalizedEmail,
        username,
        password,
        role: "investor",
        country: country || "US",
        phone: phone || null,
      });

      // Log the registration
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: newUser.id,
        action: "register",
        entityType: "user",
        entityId: newUser.id,
        details: { email: newUser.email, role: newUser.role },
        ipAddress: req.ip,
      });

      // Auto-login after registration
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ message: "Registration succeeded but login failed" });
        }

        req.session.userId = newUser.id;
        req.session.tenantId = newUser.tenantId;
        req.session.user = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role as "investor" | "manager" | "admin",
        };

        req.session.save((err) => {
          if (err) {
            console.error("Session save error:", err);
            return res.status(500).json({ message: "Registration succeeded but login failed" });
          }

          const { password: _, ...userWithoutPassword } = newUser;
          res.json(userWithoutPassword);
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!, req.tenantId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get current tenant information (branding, logo, colors)
  // Returns only public branding fields, no sensitive data
  app.get("/api/tenant", async (req, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Sanitize response — public branding only. Billing data (PIX/bank)
      // lives behind the authenticated /api/tenant/billing endpoint.
      const publicTenantData = {
        id: req.tenant.id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        logoUrl: req.tenant.logoUrl,
        primaryColor: req.tenant.primaryColor,
        secondaryColor: req.tenant.secondaryColor,
        status: req.tenant.status,
      };

      res.json(publicTenantData);
    } catch (error) {
      console.error("Get tenant error:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // Read tenant billing configuration (Manager / Admin only) — kept off the
  // public /api/tenant payload to avoid leaking PIX / bank details.
  app.get("/api/tenant/billing", authorize(), isManager, async (req, res) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }
      res.json({
        pixKey: req.tenant.pixKey ?? null,
        pixBeneficiary: req.tenant.pixBeneficiary ?? null,
        bankName: req.tenant.bankName ?? null,
        bankAgency: req.tenant.bankAgency ?? null,
        bankAccount: req.tenant.bankAccount ?? null,
        bankAccountHolder: req.tenant.bankAccountHolder ?? null,
        bankAccountType: req.tenant.bankAccountType ?? null,
        billingEmail: req.tenant.billingEmail ?? null,
        logoUrl: req.tenant.logoUrl ?? null,
        salesTaxRate: req.tenant.salesTaxRate ?? "0",
      });
    } catch (error) {
      console.error("Get tenant billing error:", error);
      res.status(500).json({ message: "Failed to fetch tenant billing config" });
    }
  });

  // Update tenant branding + billing (Manager / Admin only)
  app.put("/api/tenant", authorize(), isManager, async (req, res) => {
    try {
      const optionalString = z.string().trim().max(200).optional().nullable()
        .transform((v) => (v === undefined ? undefined : v === null || v === "" ? null : v));

      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        logoUrl: z.string().url().optional().nullable(),
        // White-label billing email used as From address for invoice emails.
        // Accepts a valid email or null to clear the override.
        billingEmail: z
          .union([z.string().email(), z.literal(""), z.null()])
          .optional()
          .transform((v) => (v === undefined ? undefined : !v ? null : v)),
        // Per-tenant payment configuration (Template 3)
        pixKey: optionalString,
        pixBeneficiary: optionalString,
        bankName: optionalString,
        bankAgency: optionalString,
        bankAccount: optionalString,
        bankAccountHolder: optionalString,
        bankAccountType: z.enum(["checking", "savings"]).optional().nullable()
          .transform((v) => (v === undefined ? undefined : v ?? null)),
        // Default sales tax percentage (0–100, up to 2 decimals). Stored as
        // a string in the DB to match Drizzle's decimal type. Empty string
        // is treated as 0 so the form can clear the field.
        salesTaxRate: z
          .union([z.string(), z.number()])
          .optional()
          .transform((v, ctx) => {
            if (v === undefined) return undefined;
            const n = typeof v === "number" ? v : parseFloat(v === "" ? "0" : v);
            if (!Number.isFinite(n) || n < 0 || n > 100) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "salesTaxRate must be between 0 and 100",
              });
              return z.NEVER;
            }
            return n.toFixed(2);
          }),
      });

      const data = updateSchema.parse(req.body);
      const updatedTenant = await storage.updateTenant(req.tenantId!, data);

      if (!updatedTenant) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      // Audit logging for tenant branding changes
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update_tenant_branding",
        entityType: "tenant",
        entityId: req.tenantId!,
        details: { 
          changes: data,
          updatedBy: req.session.user?.email 
        },
        ipAddress: req.ip,
      });

      // Return the full sanitized tenant payload. This response is only sent
      // to authenticated managers/admins (route is guarded by isManager), so
      // it is safe to include billing fields for the Settings UI to re-hydrate.
      const tenantData = {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        logoUrl: updatedTenant.logoUrl,
        primaryColor: updatedTenant.primaryColor,
        secondaryColor: updatedTenant.secondaryColor,
        status: updatedTenant.status,
        billingEmail: updatedTenant.billingEmail ?? null,
        pixKey: updatedTenant.pixKey ?? null,
        pixBeneficiary: updatedTenant.pixBeneficiary ?? null,
        bankName: updatedTenant.bankName ?? null,
        bankAgency: updatedTenant.bankAgency ?? null,
        bankAccount: updatedTenant.bankAccount ?? null,
        bankAccountHolder: updatedTenant.bankAccountHolder ?? null,
        bankAccountType: updatedTenant.bankAccountType ?? null,
        salesTaxRate: updatedTenant.salesTaxRate ?? "0",
      };

      res.json(tenantData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid tenant data", errors: error.errors });
      }
      console.error("Update tenant error:", error);
      res.status(500).json({ message: "Failed to update tenant" });
    }
  });

  // Investors list (Manager/Admin only)
  app.get("/api/investors", authorize(), async (req, res) => {
    try {
      const investors = await storage.getAllInvestors(req.tenantId!);
      const investorsWithoutPasswords = investors.map(({ password, ...investor }) => investor);
      res.json(investorsWithoutPasswords);
    } catch (error) {
      console.error("Get investors error:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  // ============ Admin User Management (Admin only) ============
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await storage.getAllUsers(req.tenantId!);
      const sanitized = allUsers.map(({ password, ...u }) => u);
      res.json(sanitized);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const createSchema = z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        email: z.string().email(),
        username: z.string().min(3),
        password: z.string().min(6),
        role: z.enum(["investor", "manager", "admin"]),
        country: z.string().optional(),
        phone: z.string().optional().nullable(),
      });

      const data = createSchema.parse(req.body);
      const normalizedEmail = data.email.toLowerCase().trim();

      const existingEmail = await storage.getUserByEmail(normalizedEmail, req.tenantId!);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      const existingUsername = await storage.getUserByUsername(data.username, req.tenantId!);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const newUser = await storage.createUser({
        tenantId: req.tenantId!,
        firstName: data.firstName,
        lastName: data.lastName,
        email: normalizedEmail,
        username: data.username,
        password: data.password,
        role: data.role,
        country: data.country || "US",
        phone: data.phone || null,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "admin_create_user",
        entityType: "user",
        entityId: newUser.id,
        details: { email: newUser.email, role: newUser.role, createdBy: req.session.user?.email },
        ipAddress: req.ip,
      });

      const { password: _, ...sanitized } = newUser;
      res.status(201).json(sanitized);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Admin create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const updateSchema = z.object({
        firstName: z.string().min(1).optional(),
        lastName: z.string().min(1).optional(),
        email: z.string().email().optional(),
        username: z.string().min(3).optional(),
        role: z.enum(["investor", "manager", "admin"]).optional(),
        country: z.string().optional(),
        phone: z.string().optional().nullable(),
      });

      const data = updateSchema.parse(req.body);
      const targetUser = await storage.getUser(req.params.id, req.tenantId!);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Prevent admin from changing their own role (avoid lockout / self-escalation)
      if (targetUser.id === req.session.userId && data.role !== undefined && data.role !== targetUser.role) {
        return res.status(400).json({ message: "You cannot change your own role" });
      }

      // Check email/username uniqueness if changing
      if (data.email) {
        const normalizedEmail = data.email.toLowerCase().trim();
        if (normalizedEmail !== targetUser.email) {
          const existing = await storage.getUserByEmail(normalizedEmail, req.tenantId!);
          if (existing && existing.id !== targetUser.id) {
            return res.status(400).json({ message: "Email already exists" });
          }
        }
        data.email = normalizedEmail;
      }
      if (data.username && data.username !== targetUser.username) {
        const existing = await storage.getUserByUsername(data.username, req.tenantId!);
        if (existing && existing.id !== targetUser.id) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }

      const updated = await storage.updateUser(req.params.id, data, req.tenantId!);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "admin_update_user",
        entityType: "user",
        entityId: updated.id,
        details: { changes: data, updatedBy: req.session.user?.email },
        ipAddress: req.ip,
      });

      const { password: _, ...sanitized } = updated;
      res.json(sanitized);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      console.error("Admin update user error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.post("/api/admin/users/:id/reset-password", isAdmin, async (req, res) => {
    try {
      const schema = z.object({ password: z.string().min(6) });
      const { password } = schema.parse(req.body);

      const targetUser = await storage.getUser(req.params.id, req.tenantId!);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const updated = await storage.resetUserPassword(req.params.id, password, req.tenantId!);
      if (!updated) {
        return res.status(404).json({ message: "User not found" });
      }

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "admin_reset_password",
        entityType: "user",
        entityId: updated.id,
        details: { targetEmail: updated.email, resetBy: req.session.user?.email },
        ipAddress: req.ip,
      });

      res.json({ message: "Password reset successfully" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid password", errors: error.errors });
      }
      console.error("Admin reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      // Prevent admin from deleting themselves
      if (req.params.id === req.session.userId) {
        return res.status(400).json({ message: "You cannot delete your own account" });
      }

      const targetUser = await storage.getUser(req.params.id, req.tenantId!);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const deleted = await storage.deleteUser(req.params.id, req.tenantId!);
      if (!deleted) {
        return res.status(400).json({ message: "Cannot delete user (may have related records like shares, payments, etc.)" });
      }

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "admin_delete_user",
        entityType: "user",
        entityId: req.params.id,
        details: { deletedEmail: targetUser.email, deletedBy: req.session.user?.email },
        ipAddress: req.ip,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Admin delete user error:", error);
      // Foreign key constraint violation
      if (error?.code === "23503") {
        return res.status(400).json({
          message: "Cannot delete user — they have related records (shares, payments, etc.). Please remove related records first.",
        });
      }
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authorize(), async (req, res) => {
    try {
      const userRole = req.session.user?.role;
      
      // Managers and admins get company-wide statistics
      if (userRole === "manager" || userRole === "admin") {
        const stats = await storage.getCompanyStats(req.tenantId!);
        res.json(stats);
      } else {
        // Investors get personal statistics
        const stats = await storage.getDashboardStats(req.session.userId!, req.tenantId!);
        res.json(stats);
      }
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Advanced Analytics Routes
  app.get("/api/analytics/revenue-trend", authorize(), async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 12;
      const trend = await storage.getRevenueTrend(months, req.tenantId!);
      res.json(trend);
    } catch (error) {
      console.error("Revenue trend error:", error);
      res.status(500).json({ message: "Failed to fetch revenue trend" });
    }
  });

  app.get("/api/analytics/trailer-roi", authorize(), async (req, res) => {
    try {
      const roiData = await storage.getTrailerROI(req.tenantId!);
      res.json(roiData);
    } catch (error) {
      console.error("Trailer ROI error:", error);
      res.status(500).json({ message: "Failed to fetch trailer ROI" });
    }
  });

  app.get("/api/analytics/performance-comparison", authorize(), async (req, res) => {
    try {
      const comparison = await storage.getPerformanceComparison(req.tenantId!);
      res.json(comparison);
    } catch (error) {
      console.error("Performance comparison error:", error);
      res.status(500).json({ message: "Failed to fetch performance comparison" });
    }
  });

  app.get("/api/analytics/revenue-forecast", authorize(), async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const forecast = await storage.getRevenueForecast(months, req.tenantId!);
      res.json(forecast);
    } catch (error) {
      console.error("Revenue forecast error:", error);
      res.status(500).json({ message: "Failed to fetch revenue forecast" });
    }
  });

  // Notification routes
  app.get("/api/notifications", authorize(), async (req, res) => {
    try {
      const notifications = await storage.getNotifications(req.session.userId!, req.tenantId!);
      res.json(notifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", authorize(), async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationCount(req.session.userId!, req.tenantId!);
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", authorize(), async (req, res) => {
    try {
      const success = await storage.markNotificationAsRead(req.params.id, req.session.userId!, req.tenantId!);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.delete("/api/notifications/:id", authorize(), async (req, res) => {
    try {
      const success = await storage.deleteNotification(req.params.id, req.session.userId!, req.tenantId!);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Notification not found" });
      }
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", authorize(), async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioData(req.session.userId!, req.tenantId!);
      res.json(portfolio);
    } catch (error) {
      console.error("Portfolio error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // GPS Device routes (Manager/Admin only)
  // GPS Webhook endpoint (Public - requires HMAC/API key validation in production)
  app.post("/api/gps/webhook", apiLimiter, async (req, res) => {
    try {
      const { provider, trailerId, data } = req.body;

      if (!provider || !trailerId || !data) {
        return res.status(400).json({ message: "Missing required fields: provider, trailerId, data" });
      }

      const gpsProvider = provider as GpsProvider;
      const adapter = GpsAdapterFactory.getAdapter(gpsProvider);

      if (!adapter.validate(data)) {
        return res.status(400).json({ message: "Invalid GPS data format for provider" });
      }

      const normalized = adapter.normalize(data);

      const device = await storage.getGpsDeviceByTrailerId(trailerId, req.tenantId!);
      if (device) {
        await storage.updateGpsDevice(device.id, { lastPing: new Date() }, req.tenantId!);
      }

      await storage.createTrackingData({
        tenantId: req.tenantId!,
        trailerId,
        latitude: normalized.latitude.toString(),
        longitude: normalized.longitude.toString(),
        speed: normalized.speed?.toString(),
        status: normalized.status,
      });

      res.json({ message: "GPS data received successfully", normalized });
    } catch (error) {
      console.error("GPS webhook error:", error);
      res.status(500).json({ message: "Failed to process GPS data" });
    }
  });

  app.get("/api/gps/devices", authorize(), async (req, res) => {
    try {
      const devices = await storage.getAllGpsDevices(req.tenantId!);
      res.json(devices);
    } catch (error) {
      console.error("GPS devices error:", error);
      res.status(500).json({ message: "Failed to fetch GPS devices" });
    }
  });

  app.get("/api/gps/devices/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const device = await storage.getGpsDeviceByTrailerId(req.params.trailerId, req.tenantId!);
      if (!device) {
        return res.status(404).json({ message: "GPS device not found for this trailer" });
      }
      res.json(device);
    } catch (error) {
      console.error("GPS device error:", error);
      res.status(500).json({ message: "Failed to fetch GPS device" });
    }
  });

  app.post("/api/gps/devices", authorize(), async (req, res) => {
    try {
      const validation = insertGpsDeviceSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid GPS device data", 
          errors: validation.error.errors 
        });
      }

      const existing = await storage.getGpsDeviceByTrailerId(validation.data.trailerId, req.tenantId!);
      if (existing) {
        return res.status(400).json({ message: "GPS device already exists for this trailer" });
      }

      const device = await storage.createGpsDevice({ ...validation.data, tenantId: req.tenantId! });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "gps_device",
        entityId: device.id,
        details: { trailerId: device.trailerId, provider: device.provider },
        ipAddress: req.ip,
      });

      res.json(device);
    } catch (error) {
      console.error("Create GPS device error:", error);
      res.status(500).json({ message: "Failed to create GPS device" });
    }
  });

  app.put("/api/gps/devices/:id", authorize(), async (req, res) => {
    try {
      const device = await storage.updateGpsDevice(req.params.id, req.body, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "gps_device",
        entityId: device.id,
        details: req.body,
        ipAddress: req.ip,
      });

      res.json(device);
    } catch (error) {
      console.error("Update GPS device error:", error);
      res.status(500).json({ message: "Failed to update GPS device" });
    }
  });

  app.delete("/api/gps/devices/:id", authorize(), async (req, res) => {
    try {
      await storage.deleteGpsDevice(req.params.id, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "delete",
        entityType: "gps_device",
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip,
      });

      res.json({ message: "GPS device deleted successfully" });
    } catch (error) {
      console.error("Delete GPS device error:", error);
      res.status(500).json({ message: "Failed to delete GPS device" });
    }
  });

  app.post("/api/gps/simulate", authorize(), async (req, res) => {
    try {
      const { trailerId, latitude, longitude } = req.body;

      if (!trailerId || !latitude || !longitude) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await storage.createTrackingData({
        tenantId: req.tenantId!,
        trailerId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        speed: (Math.random() * 80).toFixed(2),
        status: "active",
      });

      const device = await storage.getGpsDeviceByTrailerId(trailerId, req.tenantId!);
      if (device) {
        await storage.updateGpsDevice(device.id, { lastPing: new Date() }, req.tenantId!);
      }

      res.json({ message: "Simulated GPS data created successfully" });
    } catch (error) {
      console.error("GPS simulate error:", error);
      res.status(500).json({ message: "Failed to simulate GPS data" });
    }
  });

  // Rental Client routes (Manager/Admin only)
  app.get("/api/rental-clients", authorize(), async (req, res) => {
    try {
      const clients = await storage.getAllRentalClients(req.tenantId!);
      res.json(clients);
    } catch (error) {
      console.error("Rental clients error:", error);
      res.status(500).json({ message: "Failed to fetch rental clients" });
    }
  });

  app.get("/api/rental-clients/:id", authorize(), async (req, res) => {
    try {
      const client = await storage.getRentalClient(req.params.id, req.tenantId!);
      if (!client) {
        return res.status(404).json({ message: "Rental client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Rental client error:", error);
      res.status(500).json({ message: "Failed to fetch rental client" });
    }
  });

  app.post("/api/rental-clients", authorize(), async (req, res) => {
    try {
      const validation = insertRentalClientSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid rental client data", 
          errors: validation.error.errors 
        });
      }

      const client = await storage.createRentalClient({ ...validation.data, tenantId: req.tenantId! });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "rental_client",
        entityId: client.id,
        details: { companyName: client.companyName, taxId: client.taxId },
        ipAddress: req.ip,
      });

      res.json(client);
    } catch (error) {
      console.error("Create rental client error:", error);
      res.status(500).json({ message: "Failed to create rental client" });
    }
  });

  app.put("/api/rental-clients/:id", authorize(), async (req, res) => {
    try {
      const client = await storage.updateRentalClient(req.params.id, req.body, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "rental_client",
        entityId: client.id,
        details: req.body,
        ipAddress: req.ip,
      });

      res.json(client);
    } catch (error) {
      console.error("Update rental client error:", error);
      res.status(500).json({ message: "Failed to update rental client" });
    }
  });

  app.delete("/api/rental-clients/:id", authorize(), async (req, res) => {
    try {
      await storage.deleteRentalClient(req.params.id, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "delete",
        entityType: "rental_client",
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip,
      });

      res.json({ message: "Rental client deleted successfully" });
    } catch (error) {
      console.error("Delete rental client error:", error);
      res.status(500).json({ message: "Failed to delete rental client" });
    }
  });

  // Rental Contracts routes (Manager/Admin only)
  app.get("/api/rental-contracts", authorize(), async (req, res) => {
    try {
      const contracts = await storage.getAllRentalContracts(req.tenantId!);
      res.json(contracts);
    } catch (error) {
      console.error("Rental contracts error:", error);
      res.status(500).json({ message: "Failed to fetch rental contracts" });
    }
  });

  app.get("/api/rental-contracts/:id", authorize(), async (req, res) => {
    try {
      const contract = await storage.getRentalContract(req.params.id, req.tenantId!);
      if (!contract) {
        return res.status(404).json({ message: "Rental contract not found" });
      }
      res.json(contract);
    } catch (error) {
      console.error("Rental contract error:", error);
      res.status(500).json({ message: "Failed to fetch rental contract" });
    }
  });

  app.get("/api/rental-contracts/client/:clientId", authorize(), async (req, res) => {
    try {
      const contracts = await storage.getContractsByClientId(req.params.clientId, req.tenantId!);
      res.json(contracts);
    } catch (error) {
      console.error("Client contracts error:", error);
      res.status(500).json({ message: "Failed to fetch client contracts" });
    }
  });

  app.get("/api/rental-contracts/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const contracts = await storage.getContractsByTrailerId(req.params.trailerId, req.tenantId!);
      res.json(contracts);
    } catch (error) {
      console.error("Trailer contracts error:", error);
      res.status(500).json({ message: "Failed to fetch trailer contracts" });
    }
  });

  app.post("/api/rental-contracts", authorize(), async (req, res) => {
    try {
      const validatedData = insertRentalContractSchema.parse(req.body);
      const contract = await storage.createRentalContract({ ...validatedData, tenantId: req.tenantId! });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "rental_contract",
        entityId: contract.id,
        details: validatedData,
        ipAddress: req.ip,
      });

      res.status(201).json(contract);
    } catch (error) {
      console.error("Create rental contract error:", error);
      res.status(500).json({ message: "Failed to create rental contract" });
    }
  });

  app.put("/api/rental-contracts/:id", authorize(), async (req, res) => {
    try {
      const validatedData = insertRentalContractSchema.partial().parse(req.body);
      const contract = await storage.updateRentalContract(req.params.id, validatedData, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "rental_contract",
        entityId: contract.id,
        details: validatedData,
        ipAddress: req.ip,
      });

      res.json(contract);
    } catch (error) {
      console.error("Update rental contract error:", error);
      res.status(500).json({ message: "Failed to update rental contract" });
    }
  });

  // On-demand single-contract invoice generation. Reuses the same routine
  // that the daily cron uses (InvoiceAutomationService.generateInvoiceForContract)
  // so date math, dueDate calculation, and duplicate handling stay in sync.
  // Returns 201 with the new invoice on success, 409 when the
  // (contractId, referenceMonth) pair already exists, and 422 when the
  // contract has no monthlyRate configured.
  app.post("/api/rental-contracts/:id/generate-invoice", authorize(), isManager, async (req, res) => {
    try {
      const contract = await storage.getRentalContract(req.params.id, req.tenantId!);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      if (contract.status !== "active") {
        return res.status(400).json({
          message: "Only active contracts can generate invoices",
          reason: "contract_not_active",
        });
      }

      const { InvoiceAutomationService } = await import("./services/invoice-automation.service");
      const result = await InvoiceAutomationService.generateInvoiceForContract(
        contract,
        new Date(),
      );

      if (result.ok) {
        await storage.createAuditLog({
          tenantId: req.tenantId!,
          userId: req.session.userId!,
          action: "generate_invoice_now",
          entityType: "rental_contract",
          entityId: contract.id,
          details: {
            contractNumber: contract.contractNumber,
            invoiceId: result.invoice.id,
            invoiceNumber: result.invoice.invoiceNumber,
            referenceMonth: result.invoice.referenceMonth,
            amount: result.invoice.amount,
          },
          ipAddress: req.ip,
        });
        return res.status(201).json(result.invoice);
      }

      if (result.skipped && result.reason === "duplicate") {
        return res.status(409).json({
          message: "An invoice for this contract and reference month already exists",
          reason: "duplicate",
        });
      }

      if (result.skipped && result.reason === "missing_rate") {
        return res.status(422).json({
          message: "Contract is missing a monthly rate",
          reason: "missing_rate",
        });
      }

      return res.status(500).json({
        message: "Failed to generate invoice",
        reason: "reason" in result ? result.reason : "unknown",
      });
    } catch (error) {
      console.error("Generate invoice now error:", error);
      res.status(500).json({ message: "Failed to generate invoice" });
    }
  });

  app.post("/api/rental-contracts/:id/terminate", authorize(), async (req, res) => {
    try {
      // Validate empty body with strict Zod schema
      const terminateSchema = z.object({}).strict();
      const validation = terminateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const contract = await storage.terminateContract(req.params.id, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "terminate",
        entityType: "rental_contract",
        entityId: contract.id,
        details: { status: "cancelled" },
        ipAddress: req.ip,
      });

      res.json(contract);
    } catch (error) {
      console.error("Terminate contract error:", error);
      res.status(500).json({ message: "Failed to terminate contract" });
    }
  });

  // Invoice routes (Manager/Admin only)
  app.get("/api/invoices", authorize(), async (req, res) => {
    try {
      const invoices = await storage.getAllInvoices(req.tenantId!);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/overdue", authorize(), async (req, res) => {
    try {
      const invoices = await storage.getOverdueInvoices(req.tenantId!);
      res.json(invoices);
    } catch (error) {
      console.error("Get overdue invoices error:", error);
      res.status(500).json({ message: "Failed to fetch overdue invoices" });
    }
  });

  app.get("/api/invoices/contract/:contractId", authorize(), async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByContractId(req.params.contractId, req.tenantId!);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices by contract error:", error);
      res.status(500).json({ message: "Failed to fetch invoices by contract" });
    }
  });

  app.get("/api/invoices/:id", authorize(), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", authorize(), async (req, res) => {
    try {
      // Invoice number is auto-generated server-side and tenantId comes from
      // the authenticated session, so we omit both from the client payload
      // schema. Any value sent by the client for these fields is ignored.
      const createInvoiceSchema = insertInvoiceSchema
        .omit({ tenantId: true, invoiceNumber: true });
      const validation = createInvoiceSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid payload",
          errors: validation.error.errors,
        });
      }

      // Always generate the invoice number server-side using the
      // deletion-safe sequencer (INV-000001 format), ignoring any value the
      // client sent. This keeps numbering consistent across both manual and
      // automated invoice creation.
      const invoiceNumber = await storage.getNextInvoiceNumber(req.tenantId!);

      // Resolve sales-tax breakdown. Manager-supplied values win; otherwise
      // derive subtotal from `amount` and tax from the tenant's default
      // salesTaxRate. The breakdown is then frozen on the invoice so future
      // tenant rate changes never retroactively alter past invoices.
      const incoming = validation.data;
      const incomingAmount = parseFloat(String(incoming.amount));
      const tenantForTax = await storage.getTenant(req.tenantId!).catch(() => null);
      const tenantDefaultRate = tenantForTax?.salesTaxRate
        ? parseFloat(tenantForTax.salesTaxRate.toString())
        : 0;

      const supplied = (v: unknown): v is string | number => v !== undefined && v !== null && v !== "";
      let subtotal: number;
      let salesTaxRate: number;
      let salesTaxAmount: number;
      let amount: number;

      if (supplied(incoming.salesTaxRate)) {
        salesTaxRate = parseFloat(String(incoming.salesTaxRate));
        if (!Number.isFinite(salesTaxRate) || salesTaxRate < 0) salesTaxRate = 0;
      } else {
        salesTaxRate = Number.isFinite(tenantDefaultRate) && tenantDefaultRate >= 0 ? tenantDefaultRate : 0;
      }

      if (supplied(incoming.subtotal)) {
        subtotal = parseFloat(String(incoming.subtotal));
        if (!Number.isFinite(subtotal) || subtotal < 0) subtotal = incomingAmount;
      } else {
        // No subtotal supplied — treat the typed `amount` as the subtotal,
        // and recompute the total to include sales tax.
        subtotal = Number.isFinite(incomingAmount) ? incomingAmount : 0;
      }

      salesTaxAmount = supplied(incoming.salesTaxAmount)
        ? parseFloat(String(incoming.salesTaxAmount))
        : Number((subtotal * (salesTaxRate / 100)).toFixed(2));
      if (!Number.isFinite(salesTaxAmount) || salesTaxAmount < 0) salesTaxAmount = 0;

      amount = Number((subtotal + salesTaxAmount).toFixed(2));

      const invoice = await storage.createInvoice({
        ...validation.data,
        amount: amount.toFixed(2),
        subtotal: subtotal.toFixed(2),
        salesTaxRate: salesTaxRate.toFixed(2),
        salesTaxAmount: salesTaxAmount.toFixed(2),
        invoiceNumber,
        tenantId: req.tenantId!,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "invoice",
        entityId: invoice.id,
        details: { ...validation.data, invoiceNumber },
        ipAddress: req.ip,
      });

      res.status(201).json(invoice);
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id/status", authorize(), async (req, res) => {
    try {
      const paidAmountSchema = z.union([
        z.number().finite().nonnegative(),
        z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, "paidAmount must be a non-negative number with up to 2 decimal places"),
      ]);

      const statusUpdateSchema = z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]),
        paidDate: z.string().optional(),
        paidAmount: paidAmountSchema.optional(),
        confirmAmountMismatch: z.boolean().optional(),
      }).strict();

      const validation = statusUpdateSchema.safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({
          message: "Invalid payload",
          errors: validation.error.errors,
        });
      }

      const { status, paidDate, paidAmount, confirmAmountMismatch } = validation.data;

      // Strict validation only applies when transitioning to "paid".
      if (status === "paid") {
        const existing = await storage.getInvoice(req.params.id, req.tenantId!);
        if (!existing) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        const receivedAmountCents =
          paidAmount !== undefined
            ? invoiceAmountToCents(paidAmount)
            : invoiceAmountToCents(existing.amount);

        // Refuse re-paying outright (covered by validator's invalid_status,
        // but kept as a distinct fast-path with its own audit log so the
        // finance/audit report can surface "double-pay attempts" cleanly).
        if (existing.status === "paid") {
          await storage.createAuditLog({
            tenantId: req.tenantId!,
            userId: req.session.userId!,
            action: "payment_rejected_status",
            entityType: "invoice",
            entityId: existing.id,
            details: {
              expectedAmountCents: invoiceAmountToCents(existing.amount),
              receivedAmountCents,
              invoiceStatus: existing.status,
              source: "manual",
              reason: "already_paid",
              invoiceNumber: existing.invoiceNumber,
              acceptableStatuses: Array.from(
                ACCEPTABLE_INVOICE_STATUSES_FOR_PAYMENT,
              ),
            },
            ipAddress: req.ip,
          });

          return res.status(400).json({
            message: "Invoice is already paid",
            code: "already_paid",
          });
        }

        const paymentValidation = validateInvoicePayment(
          existing,
          receivedAmountCents,
          "manual",
        );

        if (!paymentValidation.valid) {
          if (paymentValidation.reason === "invalid_status") {
            await storage.createAuditLog({
              tenantId: req.tenantId!,
              userId: req.session.userId!,
              action: "payment_rejected_status",
              entityType: "invoice",
              entityId: existing.id,
              details: {
                ...paymentValidation.details,
                reason: paymentValidation.reason,
                invoiceNumber: existing.invoiceNumber,
                acceptableStatuses: Array.from(
                  ACCEPTABLE_INVOICE_STATUSES_FOR_PAYMENT,
                ),
              },
              ipAddress: req.ip,
            });

            return res.status(400).json({
              message: `Invoice cannot be marked as paid from status "${existing.status}"`,
              code: "invalid_status_for_payment",
              details: paymentValidation.details,
            });
          }

          // amount_mismatch
          if (!confirmAmountMismatch) {
            await storage.createAuditLog({
              tenantId: req.tenantId!,
              userId: req.session.userId!,
              action: "payment_rejected_amount",
              entityType: "invoice",
              entityId: existing.id,
              details: {
                ...paymentValidation.details,
                reason: paymentValidation.reason,
                invoiceNumber: existing.invoiceNumber,
              },
              ipAddress: req.ip,
            });

            return res.status(400).json({
              message: "Paid amount does not match invoice amount",
              code: "amount_mismatch",
              details: paymentValidation.details,
            });
          }
        }

        const resolvedPaidDate = paidDate
          ? new Date(paidDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0];

        const invoice = await storage.updateInvoice(
          req.params.id,
          { status: "paid", paidDate: resolvedPaidDate },
          req.tenantId!,
        );

        const overrideUsed =
          !paymentValidation.valid && confirmAmountMismatch === true;

        await storage.createAuditLog({
          tenantId: req.tenantId!,
          userId: req.session.userId!,
          action: "payment_validated",
          entityType: "invoice",
          entityId: invoice.id,
          details: {
            expectedAmountCents: invoiceAmountToCents(existing.amount),
            receivedAmountCents,
            invoiceStatus: existing.status,
            source: "manual",
            invoiceNumber: existing.invoiceNumber,
            override: overrideUsed,
          },
          ipAddress: req.ip,
        });

        return res.json(invoice);
      }

      // Non-"paid" status updates retain the previous behavior.
      const paidDateValue = paidDate ? new Date(paidDate) : undefined;

      const invoice = await storage.updateInvoiceStatus(
        req.params.id,
        status,
        req.tenantId!,
        paidDateValue,
      );

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "invoice",
        entityId: invoice.id,
        details: { status, paidDate },
        ipAddress: req.ip,
      });

      res.json(invoice);
    } catch (error) {
      console.error("Update invoice status error:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.delete("/api/invoices/:id", authorize(), async (req, res) => {
    try {
      // Validate empty body with strict Zod schema
      const deleteSchema = z.object({}).strict();
      const validation = deleteSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      await storage.deleteInvoice(req.params.id, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "delete",
        entityType: "invoice",
        entityId: req.params.id,
        details: {},
        ipAddress: req.ip,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Delete invoice error:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  // ============ 2ª Via — invoice reissuance (same ID, new due date) ============
  app.post("/api/invoices/:id/reissue", isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === "paid") {
        return res.status(400).json({ message: "Invoice is already paid and cannot be reissued" });
      }
      if (invoice.status === "cancelled") {
        return res.status(400).json({ message: "Cancelled invoices cannot be reissued" });
      }

      // Calculate new due date: today + paymentDueDays from the contract
      const contract = await storage.getRentalContract(invoice.contractId, req.tenantId!);
      const dueDays = contract?.paymentDueDays || 15;
      const today = new Date();
      const newDueDate = new Date(today);
      newDueDate.setDate(newDueDate.getDate() + dueDays);
      const newDueDateStr = newDueDate.toISOString().split("T")[0];

      const reissued = await storage.reissueInvoice(req.params.id, newDueDateStr, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "reissue_invoice",
        entityType: "invoice",
        entityId: invoice.id,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          previousDueDate: invoice.dueDate,
          newDueDate: newDueDateStr,
          previousStatus: invoice.status,
          reissuedBy: req.session.user?.email,
        },
        ipAddress: req.ip,
      });

      // Notify the rental client via email about the new due date
      if (contract) {
        const client = await storage.getRentalClient(contract.clientId, req.tenantId!);
        if (client && client.email) {
          let emailStatus: "sent" | "failed" = "failed";
          let errorMessage: string | undefined;

          try {
            const trailerForPdf = await storage.getTrailer(contract.trailerId, req.tenantId!).catch(() => null);
            const lineItemsForPdf = await storage.getInvoiceItems(reissued.id, req.tenantId!).catch(() => []);
            const tenantLogoDataUrl = await fetchLogoAsDataUrl(req.tenant?.logoUrl ?? null);
            const attachments = trailerForPdf
              ? [{
                  filename: `Invoice-${reissued.invoiceNumber}.pdf`,
                  content: PDFService.generateInvoicePDF({
                    ...reissued,
                    contract: { ...contract, client, trailer: trailerForPdf },
                    tenant: req.tenant ?? null,
                    lineItems: lineItemsForPdf,
                    tenantLogoDataUrl,
                  }),
                  contentType: "application/pdf" as const,
                }]
              : undefined;
            await EmailService.sendInvoiceReissuedEmail(
              { invoice: reissued, contract, client, tenant: req.tenant ?? null, attachments },
              invoice.dueDate,
            );
            emailStatus = "sent";
          } catch (error) {
            emailStatus = "failed";
            errorMessage = error instanceof Error ? error.message : "Unknown error sending reissue email";
            console.error(
              JSON.stringify({
                level: "error",
                timestamp: new Date().toISOString(),
                service: "email",
                operation: "sendInvoiceReissuedEmail",
                tenantId: req.tenantId,
                detail: `${errorMessage} to=${client.email} invoiceNumber=${invoice.invoiceNumber}`,
              }),
            );
          }

          const newDueDateLocale = new Date(reissued.dueDate).toLocaleDateString();
          const emailLog = EmailService.createEmailLog(
            client.email,
            client.tradeName || client.companyName,
            `Invoice Reissued - ${invoice.invoiceNumber} - New Due Date ${newDueDateLocale}`,
            "invoice_reissued",
            "invoice",
            invoice.id,
            emailStatus,
            errorMessage,
          );
          await storage.createEmailLog(emailLog);
        }
      }

      res.json(reissued);
    } catch (error) {
      console.error("Reissue invoice error:", error);
      res.status(500).json({ message: "Failed to reissue invoice" });
    }
  });

  // Manual invoice generation
  app.post("/api/invoices/generate-monthly", authorize(), async (req, res) => {
    try {
      const bodySchema = z.object({
        contractIds: z.array(z.string().min(1)).min(1).max(500).optional(),
      });
      const parsed = bodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return res.status(400).json({
          message: "Invalid request body",
          errors: parsed.error.flatten(),
        });
      }
      const { contractIds } = parsed.data;

      // When the caller provides explicit contractIds, validate they all
      // belong to the requester's tenant before queuing generation. Any
      // unknown / cross-tenant ID is rejected with 403 and audited so a
      // misuse attempt is surfaced.
      if (contractIds && contractIds.length > 0) {
        const tenantContracts = await storage.getAllRentalContracts(req.tenantId!);
        const tenantContractIds = new Set(tenantContracts.map((c) => c.id));
        const offenders = contractIds.filter((id) => !tenantContractIds.has(id));
        if (offenders.length > 0) {
          await storage.createAuditLog({
            tenantId: req.tenantId!,
            userId: req.session.userId!,
            action: "manual_invoice_generation_denied",
            entityType: "invoice",
            entityId: null,
            details: { reason: "cross_tenant_contract_ids", offenders },
            ipAddress: req.ip,
          });
          return res.status(403).json({
            message: "One or more contracts do not belong to your tenant",
          });
        }
      }

      const { InvoiceAutomationService } = await import("./services/invoice-automation.service");
      const summary = await InvoiceAutomationService.generateInvoicesNow({
        tenantId: req.tenantId!,
        ...(contractIds ? { contractIds } : {}),
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "manual_invoice_generation",
        entityType: "invoice",
        entityId: null,
        details: {
          triggeredBy: "manual",
          ...(contractIds ? { contractIds } : {}),
          ...summary,
        },
        ipAddress: req.ip,
      });

      res.json({
        message: "Monthly invoices generated successfully",
        summary,
      });
    } catch (error) {
      console.error("Manual invoice generation error:", error);
      res.status(500).json({ message: "Failed to generate invoices" });
    }
  });

  // Manual overdue check
  app.post("/api/invoices/check-overdue", authorize(), async (req, res) => {
    try {
      const { InvoiceAutomationService } = await import("./services/invoice-automation.service");
      await InvoiceAutomationService.checkOverdueNow();
      
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "manual_overdue_check",
        entityType: "invoice",
        entityId: null,
        details: { triggeredBy: "manual" },
        ipAddress: req.ip,
      });

      res.json({ message: "Overdue check completed" });
    } catch (error) {
      console.error("Manual overdue check error:", error);
      res.status(500).json({ message: "Failed to check overdue invoices" });
    }
  });

  // Get email logs
  app.get("/api/email-logs", authorize(), async (req, res) => {
    try {
      const logs = await storage.getAllEmailLogs(req.tenantId!);
      res.json(logs);
    } catch (error) {
      console.error("Get email logs error:", error);
      res.status(500).json({ message: "Failed to get email logs" });
    }
  });

  // Checklist/Inspection routes (Manager/Admin only)
  app.get("/api/checklists/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const checklists = await storage.getChecklistsByTrailerId(req.params.trailerId, req.tenantId!);
      res.json(checklists);
    } catch (error) {
      console.error("Get checklists by trailer error:", error);
      res.status(500).json({ message: "Failed to fetch checklists by trailer" });
    }
  });

  app.get("/api/checklists/type/:type", authorize(), async (req, res) => {
    try {
      const checklists = await storage.getChecklistsByType(req.params.type, req.tenantId!);
      res.json(checklists);
    } catch (error) {
      console.error("Get checklists by type error:", error);
      res.status(500).json({ message: "Failed to fetch checklists by type" });
    }
  });

  app.get("/api/checklists/:id", authorize(), async (req, res) => {
    try {
      const checklist = await storage.getChecklist(req.params.id, req.tenantId!);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }
      res.json(checklist);
    } catch (error) {
      console.error("Get checklist error:", error);
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  app.post("/api/checklists", authorize(), async (req, res) => {
    try {
      const validation = insertChecklistSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      
      const checklist = await storage.createChecklist({ ...validation.data, tenantId: req.tenantId! });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "checklist",
        entityId: checklist.id,
        details: validation.data,
        ipAddress: req.ip,
      });

      res.status(201).json(checklist);
    } catch (error) {
      console.error("Create checklist error:", error);
      res.status(500).json({ message: "Failed to create checklist" });
    }
  });

  app.put("/api/checklists/:id", authorize(), async (req, res) => {
    try {
      const validation = insertChecklistSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const checklist = await storage.updateChecklist(req.params.id, validation.data, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "checklist",
        entityId: checklist.id,
        details: validation.data,
        ipAddress: req.ip,
      });

      res.json(checklist);
    } catch (error) {
      console.error("Update checklist error:", error);
      res.status(500).json({ message: "Failed to update checklist" });
    }
  });

  // Generate checklist/inspection PDF
  app.post("/api/checklists/:id/generate-pdf", authorize(), async (req, res) => {
    try {
      const checklist = await storage.getChecklist(req.params.id, req.tenantId!);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist not found" });
      }

      const trailer = await storage.getTrailer(checklist.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }

      const pdfBuffer = PDFService.generateInspectionReport(checklist, trailer);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "generate_pdf",
        entityType: "checklist",
        entityId: checklist.id,
        details: { type: "inspection_report" },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Inspection-${checklist.id.substring(0, 8)}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate checklist PDF error:", error);
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.post("/api/checklists/:id/complete", authorize(), async (req, res) => {
    try {
      const completeSchema = z.object({
        approved: z.boolean(),
        notes: z.string().optional(),
        rejectionReason: z.string().optional(),
      }).strict();

      const validation = completeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      // If rejected, require a rejection reason
      if (validation.data.approved === false && !validation.data.rejectionReason) {
        return res.status(400).json({ 
          message: "Rejection reason is required when rejecting a checklist" 
        });
      }

      const checklist = await storage.completeChecklist(
        req.params.id,
        validation.data.approved,
        req.session.userId!,
        validation.data.notes,
        validation.data.rejectionReason
      );

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: validation.data.approved ? "approve_checklist" : "reject_checklist",
        entityType: "checklist",
        entityId: checklist.id,
        details: validation.data,
        ipAddress: req.ip,
      });

      res.json(checklist);
    } catch (error) {
      console.error("Complete checklist error:", error);
      res.status(500).json({ message: "Failed to complete checklist" });
    }
  });

  // Maintenance Schedule routes (Manager/Admin only)
  app.get("/api/maintenance", authorize(), async (req, res) => {
    try {
      // Get all maintenance schedules
      const trailers = await storage.getAllTrailers(req.tenantId!);
      const allSchedules = await Promise.all(
        trailers.map(async (trailer) => {
          return await storage.getMaintenanceSchedulesByTrailerId(trailer.id, req.tenantId!);
        })
      );
      res.json(allSchedules.flat());
    } catch (error) {
      console.error("Get all maintenance schedules error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedules" });
    }
  });

  app.get("/api/maintenance/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const schedules = await storage.getMaintenanceSchedulesByTrailerId(req.params.trailerId, req.tenantId!);
      res.json(schedules);
    } catch (error) {
      console.error("Get maintenance schedules by trailer error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedules by trailer" });
    }
  });

  app.get("/api/maintenance/alerts", authorize(), async (req, res) => {
    try {
      const alerts = await storage.getMaintenanceAlerts(req.tenantId!);
      res.json(alerts);
    } catch (error) {
      console.error("Get maintenance alerts error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance alerts" });
    }
  });

  app.get("/api/maintenance/:id", authorize(), async (req, res) => {
    try {
      const schedule = await storage.getMaintenanceSchedule(req.params.id, req.tenantId!);
      if (!schedule) {
        return res.status(404).json({ message: "Maintenance schedule not found" });
      }
      res.json(schedule);
    } catch (error) {
      console.error("Get maintenance schedule error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedule" });
    }
  });

  app.post("/api/maintenance", authorize(), async (req, res) => {
    try {
      const validation = insertMaintenanceScheduleSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      // Calculate next maintenance date/km based on schedule type
      const data = validation.data;
      
      const now = new Date();

      if (data.scheduleType === "time_based" && data.intervalDays && data.lastMaintenanceDate) {
        const lastDate = new Date(data.lastMaintenanceDate);
        const nextDate = new Date(lastDate);
        nextDate.setDate(nextDate.getDate() + data.intervalDays);
        data.nextMaintenanceDate = nextDate.toISOString().split('T')[0];
        
        // Calculate status
        const daysUntil = Math.floor((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil < 7) {
          data.status = "urgent";
        } else {
          data.status = "scheduled";
        }
      } else if (data.scheduleType === "km_based" && data.intervalKm && data.lastMaintenanceKm) {
        const nextKm = parseFloat(data.lastMaintenanceKm) + parseFloat(data.intervalKm);
        data.nextMaintenanceKm = nextKm.toString();
        data.status = "scheduled";
      }

      const schedule = await storage.createMaintenanceSchedule({ ...data, tenantId: req.tenantId! });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create",
        entityType: "maintenance_schedule",
        entityId: schedule.id,
        details: data,
        ipAddress: req.ip,
      });

      res.status(201).json(schedule);
    } catch (error) {
      console.error("Create maintenance schedule error:", error);
      res.status(500).json({ message: "Failed to create maintenance schedule" });
    }
  });

  app.put("/api/maintenance/:id", authorize(), async (req, res) => {
    try {
      const validation = insertMaintenanceScheduleSchema.partial().safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      // Recalculate next maintenance if interval or last maintenance changed
      const data = validation.data;
      
      const existing = await storage.getMaintenanceSchedule(req.params.id, req.tenantId!);
      
      if (!existing) {
        return res.status(404).json({ message: "Maintenance schedule not found" });
      }
      
      if (existing) {
        const now = new Date();
        
        if (data.scheduleType === "time_based" || existing.scheduleType === "time_based") {
          const intervalDays = data.intervalDays || existing.intervalDays;
          const lastDate = data.lastMaintenanceDate ? new Date(data.lastMaintenanceDate) : existing.lastMaintenanceDate ? new Date(existing.lastMaintenanceDate) : null;
          
          if (intervalDays && lastDate) {
            const nextDate = new Date(lastDate);
            nextDate.setDate(nextDate.getDate() + intervalDays);
            data.nextMaintenanceDate = nextDate.toISOString().split('T')[0];
            
            // Only recalculate status if not already completed
            if (existing.status !== "completed" && data.status !== "completed") {
              const daysUntil = Math.floor((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
              if (daysUntil < 7) {
                data.status = "urgent";
              } else {
                data.status = "scheduled";
              }
            }
          }
        } else if (data.scheduleType === "km_based" || existing.scheduleType === "km_based") {
          const intervalKm = data.intervalKm || existing.intervalKm;
          const lastKm = data.lastMaintenanceKm || existing.lastMaintenanceKm;
          
          if (intervalKm && lastKm) {
            const nextKm = parseFloat(lastKm) + parseFloat(intervalKm);
            data.nextMaintenanceKm = nextKm.toString();
          }
        }
      }

      const schedule = await storage.updateMaintenanceSchedule(req.params.id, data, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "maintenance_schedule",
        entityId: schedule.id,
        details: data,
        ipAddress: req.ip,
      });

      res.json(schedule);
    } catch (error) {
      console.error("Update maintenance schedule error:", error);
      res.status(500).json({ message: "Failed to update maintenance schedule" });
    }
  });

  app.post("/api/maintenance/:id/complete", authorize(), async (req, res) => {
    try {
      const completeSchema = z.object({
        completionDate: z.string(),
        cost: z.string().optional(),
        notes: z.string().optional(),
      }).strict();

      const validation = completeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const schedule = await storage.completeMaintenance(
        req.params.id,
        new Date(validation.data.completionDate),
        validation.data.cost,
        validation.data.notes
      );

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "complete",
        entityType: "maintenance_schedule",
        entityId: schedule.id,
        details: validation.data,
        ipAddress: req.ip,
      });

      res.json(schedule);
    } catch (error) {
      console.error("Complete maintenance error:", error);
      res.status(500).json({ message: "Failed to complete maintenance" });
    }
  });

  // Trailer/Asset routes (Manager/Admin only)
  app.get("/api/trailers", authorize(), async (req, res) => {
    try {
      const trailers = await storage.getAllTrailers(req.tenantId!);
      res.json(trailers);
    } catch (error) {
      console.error("Trailers error:", error);
      res.status(500).json({ message: "Failed to fetch trailers" });
    }
  });

  app.get("/api/trailers/available", authorize(), async (req, res) => {
    try {
      const trailers = await storage.getAvailableTrailers(req.tenantId!);
      res.json(trailers);
    } catch (error) {
      console.error("Available trailers error:", error);
      res.status(500).json({ message: "Failed to fetch available trailers" });
    }
  });

  app.get("/api/trailers/:id", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailer(req.params.id, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }
      res.json(trailer);
    } catch (error) {
      console.error("Trailer error:", error);
      res.status(500).json({ message: "Failed to fetch trailer" });
    }
  });

  app.post("/api/trailers", authorize(), async (req, res) => {
    try {
      // Generate automatic trailer ID based on type
      const trailerType = req.body.trailerType || "Seco";
      const typeCode = trailerType === "Seco" ? "S" : trailerType === "Climatizado" ? "C" : "L";
      
      // Get all existing trailers to determine next sequential number
      const allTrailers = await storage.getAllTrailers(req.tenantId!);
      const existingIds = allTrailers.map((t: any) => t.trailerId);
      
      // Find the highest number for this type
      const typePrefix = `TR${typeCode}`;
      const sameTypeIds = existingIds.filter((id: string) => id.startsWith(typePrefix));
      
      let nextNumber = 1;
      if (sameTypeIds.length > 0) {
        const numbers = sameTypeIds.map((id: string) => {
          const numPart = id.replace(typePrefix, '');
          return parseInt(numPart) || 0;
        });
        nextNumber = Math.max(...numbers) + 1;
      }
      
      const generatedId = `${typePrefix}${String(nextNumber).padStart(3, '0')}`;
      
      // Clean up latitude/longitude - convert empty strings or invalid values to null
      const cleanedData = {
        ...req.body,
        trailerId: generatedId,
        latitude: req.body.latitude === "" || req.body.latitude === null ? null : req.body.latitude,
        longitude: req.body.longitude === "" || req.body.longitude === null ? null : req.body.longitude,
      };
      
      // Extract allocation type and investor ID
      const { allocationType, investorId, ...trailerData } = cleanedData;
      
      const validated = insertTrailerSchema.parse(trailerData);
      const trailer = await storage.createTrailer({ ...validated, tenantId: req.tenantId! });
      
      // If allocated to specific investor, create share automatically
      if (allocationType === "specific" && investorId) {
        await storage.createShare({ tenantId: req.tenantId!,
          userId: investorId,
          trailerId: trailer.id,
          purchaseValue: trailer.purchaseValue,
          purchaseDate: trailer.purchaseDate,
          status: "active",
          monthlyReturn: "2.00",
          totalReturns: "0.00",
        });
        
        // Update trailer status to active since share is sold
        await storage.updateTrailer(trailer.id, { status: "active" }, req.tenantId!);
      }
      
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_trailer",
        entityType: "trailer",
        entityId: trailer.id,
        details: { ...validated, allocationType, investorId },
        ipAddress: req.ip,
      });
      
      res.json(trailer);
    } catch (error: any) {
      console.error("Create trailer error:", error);
      
      // Handle Zod validation errors
      if (error.name === 'ZodError') {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ 
          message: "validationError", 
          errors: fieldErrors 
        });
      }
      
      // Handle database unique constraint violation (duplicate trailer ID)
      if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
        return res.status(400).json({ 
          message: "duplicateTrailerId", 
          errors: { trailerId: "duplicateTrailerId" } 
        });
      }
      
      res.status(500).json({ message: "errorDescription" });
    }
  });

  // PATCH /api/trailers/:id — partial update of a trailer. Same role policy as
  // POST. Accepts the same Zod schema in `.partial()` form so the new vehicle
  // identification fields (vin, year, make, body, weightLbs, titleNumber,
  // vehicleUse, titleDate, imageData) and any other allowed column can be
  // edited without recreating the asset.
  app.patch("/api/trailers/:id", authorize(), async (req, res) => {
    try {
      const existing = await storage.getTrailer(req.params.id, req.tenantId!);
      if (!existing) return res.status(404).json({ message: "Trailer not found" });

      // Strip server-managed/allocation-only fields before validating.
      const {
        id: _ignoreId,
        tenantId: _ignoreTenant,
        createdAt: _ignoreCreated,
        updatedAt: _ignoreUpdated,
        allocationType: _ignoreAlloc,
        investorId: _ignoreInv,
        ...incoming
      } = req.body || {};

      // Normalize empty strings → null/undefined for nullable columns so we
      // never persist "" where the database expects NULL.
      const cleaned: Record<string, any> = { ...incoming };
      for (const key of [
        "latitude",
        "longitude",
        "vin",
        "make",
        "body",
        "titleNumber",
        "vehicleUse",
        "titleDate",
        "imageData",
        "location",
        "expirationDate",
      ]) {
        if (cleaned[key] === "") cleaned[key] = null;
      }

      const validated: Partial<InsertTrailer> = insertTrailerSchema.partial().parse(cleaned);
      const updated = await storage.updateTrailer(req.params.id, validated, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update_trailer",
        entityType: "trailer",
        entityId: updated.id,
        details: { changedFields: Object.keys(validated) },
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error: any) {
      console.error("Update trailer error:", error);

      if (error.name === "ZodError") {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err: any) => {
          const field = err.path[0];
          fieldErrors[field] = err.message;
        });
        return res.status(400).json({ message: "validationError", errors: fieldErrors });
      }

      if (error.code === "23505" || error.message?.includes("duplicate key") || error.message?.includes("unique constraint")) {
        return res.status(400).json({
          message: "duplicateTrailerId",
          errors: { trailerId: "duplicateTrailerId" },
        });
      }

      res.status(500).json({ message: "errorDescription" });
    }
  });

  // GET /api/trailers/:id/audit-logs — chronological history of who changed
  // this trailer and what fields/details were affected. Used by the asset
  // details dialog "History" tab so managers/admins can audit edits without
  // leaving the page. Tenant isolation is enforced inside the storage query
  // (audit_logs.tenantId = req.tenantId), so cross-tenant trailer ids will
  // always return an empty list rather than leaking history rows.
  app.get("/api/trailers/:id/audit-logs", authorize(), async (req, res) => {
    try {
      // Clamp the limit between 1 and 500 so a malformed/negative ?limit
      // can't either return zero rows silently or blow up the response.
      const rawLimit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 100, 1), 500);
      const logs = await storage.getAuditLogsForEntity("trailer", req.params.id, req.tenantId!, limit);
      res.json(logs);
    } catch (error) {
      console.error("Get trailer audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch trailer audit logs" });
    }
  });

  // ----------------------------------------------------------------------
  // Trailer documents — file attachments per trailer (Object Storage)
  // ----------------------------------------------------------------------
  const objectStorageService = new ObjectStorageService();

  // Presigned upload URL for direct PUT to bucket
  app.post("/api/uploads/request-url", authorize(), async (req, res) => {
    try {
      const { name } = req.body || {};
      if (!name || typeof name !== "string") {
        return res.status(400).json({ message: "Missing required field: name" });
      }
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ message: "Failed to generate upload URL" });
    }
  });

  // List documents for a trailer
  app.get("/api/trailers/:id/documents", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailer(req.params.id, req.tenantId!);
      if (!trailer) return res.status(404).json({ message: "Trailer not found" });
      const docs = await storage.getTrailerDocuments(req.params.id, req.tenantId!);

      // Enrich each document with the uploader's displayable name. We
      // resolve user records once per unique uploader to keep this route
      // O(unique users) instead of O(documents).
      const uploaderIds = Array.from(
        new Set(docs.map((d) => d.uploadedBy).filter((id): id is string => !!id))
      );
      const uploaderMap: Record<string, { id: string; name: string; email: string | null }> = {};
      for (const uid of uploaderIds) {
        const u = await storage.getUser(uid, req.tenantId!);
        if (u) {
          const name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || u.email || "—";
          uploaderMap[uid] = { id: u.id, name, email: u.email ?? null };
        }
      }

      const enriched = docs.map((d) => ({
        ...d,
        uploader: d.uploadedBy ? (uploaderMap[d.uploadedBy] ?? null) : null,
      }));

      res.json(enriched);
    } catch (error) {
      console.error("Get trailer documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  // Persist a trailer document AFTER the client uploaded the file via presigned URL
  app.post("/api/trailers/:id/documents", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailer(req.params.id, req.tenantId!);
      if (!trailer) return res.status(404).json({ message: "Trailer not found" });

      const validated = insertTrailerDocumentSchema.parse({
        trailerId: req.params.id,
        documentCategory: req.body.documentCategory,
        fileName: req.body.fileName,
        fileUrl: req.body.fileUrl,
      });

      // Validate the category is one of the supported values.
      const allowed = ["title", "registration", "insurance", "inspection", "purchase_invoice", "other"];
      if (!allowed.includes(validated.documentCategory)) {
        return res.status(400).json({ message: "Invalid documentCategory" });
      }

      // Normalize raw bucket URLs (https://storage.googleapis.com/...) to
      // the internal "/objects/<id>" path so we never store presigned URLs.
      const normalizedUrl = objectStorageService.normalizeObjectEntityPath(validated.fileUrl);
      if (!normalizedUrl.startsWith("/objects/")) {
        return res.status(400).json({ message: "Invalid file URL" });
      }

      const created = await storage.createTrailerDocument({
        ...validated,
        fileUrl: normalizedUrl,
        tenantId: req.tenantId!,
        uploadedBy: req.session.userId ?? null,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_trailer_document",
        entityType: "trailer_document",
        entityId: created.id,
        details: { trailerId: req.params.id, category: validated.documentCategory, fileName: validated.fileName },
        ipAddress: req.ip,
      });

      res.json(created);
    } catch (error: any) {
      console.error("Create trailer document error:", error);
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save document" });
    }
  });

  // Reorder trailer documents — accepts an array of document ids in the
  // desired order and persists each one's `sortOrder`. Same role policy as
  // PATCH/POST so any user who can edit documents can reorder them.
  // NOTE: Must be registered BEFORE the `/:docId` PATCH route so Express
  // doesn't match `:docId = "reorder"`.
  app.patch("/api/trailers/:id/documents/reorder", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailer(req.params.id, req.tenantId!);
      if (!trailer) return res.status(404).json({ message: "Trailer not found" });

      const body = req.body ?? {};
      const orderedIds = body.orderedIds;
      if (
        !Array.isArray(orderedIds) ||
        orderedIds.length === 0 ||
        orderedIds.some((id) => typeof id !== "string" || id.length === 0)
      ) {
        return res
          .status(400)
          .json({ message: "orderedIds must be a non-empty array of strings" });
      }

      // Reject duplicate ids — they would otherwise silently collapse
      // into a single update and leave the surrounding docs at sortOrder 0.
      if (new Set(orderedIds).size !== orderedIds.length) {
        return res.status(400).json({ message: "orderedIds must be unique" });
      }

      // Require the caller to include EVERY document for the trailer in the
      // payload — partial reorders would leave the omitted rows mixed in at
      // their old sortOrder values and produce visually ambiguous output.
      const allDocs = await storage.getTrailerDocuments(req.params.id, req.tenantId!);
      if (orderedIds.length !== allDocs.length) {
        return res.status(400).json({
          message: "orderedIds must contain every document for this trailer",
        });
      }

      let updated;
      try {
        updated = await storage.reorderTrailerDocuments(
          req.params.id,
          req.tenantId!,
          orderedIds,
        );
      } catch (err: any) {
        return res.status(400).json({ message: err?.message ?? "Failed to reorder documents" });
      }

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "reorder_trailer_documents",
        entityType: "trailer_document",
        entityId: req.params.id,
        details: { trailerId: req.params.id, count: orderedIds.length },
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error) {
      console.error("Reorder trailer documents error:", error);
      res.status(500).json({ message: "Failed to reorder documents" });
    }
  });

  // PATCH a trailer document — currently used to recategorize a document
  // without re-uploading the file. Same role policy as POST.
  app.patch("/api/trailers/:id/documents/:docId", authorize(), async (req, res) => {
    try {
      const doc = await storage.getTrailerDocument(req.params.docId, req.tenantId!);
      if (!doc || doc.trailerId !== req.params.id) {
        return res.status(404).json({ message: "Document not found" });
      }

      const allowed = ["title", "registration", "insurance", "inspection", "purchase_invoice", "other"];
      const updates: Record<string, any> = {};

      if (typeof req.body?.documentCategory === "string") {
        if (!allowed.includes(req.body.documentCategory)) {
          return res.status(400).json({ message: "Invalid documentCategory" });
        }
        updates.documentCategory = req.body.documentCategory;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No supported fields to update" });
      }

      const updated = await storage.updateTrailerDocument(req.params.docId, updates, req.tenantId!);
      if (!updated) return res.status(404).json({ message: "Document not found" });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update_trailer_document",
        entityType: "trailer_document",
        entityId: updated.id,
        details: { trailerId: req.params.id, changedFields: Object.keys(updates) },
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error) {
      console.error("Update trailer document error:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });

  // Delete a trailer document (and best-effort delete the underlying object)
  app.delete("/api/trailers/:id/documents/:docId", authorize(), async (req, res) => {
    try {
      const doc = await storage.getTrailerDocument(req.params.docId, req.tenantId!);
      if (!doc || doc.trailerId !== req.params.id) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Best-effort: delete the underlying object — never block deletion of
      // the metadata row if the underlying object is already gone.
      try {
        const file = await objectStorageService.getObjectEntityFile(doc.fileUrl);
        await file.delete();
      } catch (err) {
        if (!(err instanceof ObjectNotFoundError)) {
          console.warn("Object delete warning:", err);
        }
      }

      const ok = await storage.deleteTrailerDocument(req.params.docId, req.tenantId!);
      if (!ok) return res.status(404).json({ message: "Document not found" });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "delete_trailer_document",
        entityType: "trailer_document",
        entityId: req.params.docId,
        details: { trailerId: req.params.id },
        ipAddress: req.ip,
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Delete trailer document error:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Stream/download an object (private bucket). Restricted to manager/admin
  // (same role set as Assets) AND tenant-scoped by ensuring some
  // trailer_document row in the caller's tenant references the object path.
  app.get("/objects/:objectPath(*)", isAuthenticated, isManager, async (req, res) => {
    try {
      const tenantId = req.tenantId;
      if (!tenantId) return res.status(401).json({ message: "Unauthorized" });

      // Look up the document row by file URL — this enforces tenant scoping.
      const [doc] = await db
        .select()
        .from(trailerDocuments)
        .where(
          and(
            eq(trailerDocuments.fileUrl, req.path),
            eq(trailerDocuments.tenantId, tenantId),
          ),
        )
        .limit(1);

      if (!doc) {
        return res.status(404).json({ message: "Object not found" });
      }

      const file = await objectStorageService.getObjectEntityFile(req.path);
      await objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.status(404).json({ message: "Object not found" });
      }
      return res.status(500).json({ message: "Failed to serve object" });
    }
  });

  // Tracking routes (Manager/Admin only)
  app.get("/api/tracking", authorize(), async (req, res) => {
    try {
      const tracking = await storage.getAllLatestTracking(req.tenantId!);
      res.json(tracking);
    } catch (error) {
      console.error("Tracking error:", error);
      res.status(500).json({ message: "Failed to fetch tracking data" });
    }
  });

  app.get("/api/tracking/:trailerId/history", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailerByTrailerId(req.params.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }
      const history = await storage.getTrackingHistory(trailer.id, req.tenantId!);
      res.json(history);
    } catch (error) {
      console.error("Tracking history error:", error);
      res.status(500).json({ message: "Failed to fetch tracking history" });
    }
  });

  // Financial routes (Manager/Admin only)
  app.get("/api/financial/records", authorize(), async (req, res) => {
    try {
      const records = await db.select()
        .from(financialRecords)
        .orderBy(sql`month desc`)
        .limit(12);
      res.json(records);
    } catch (error) {
      console.error("Financial records error:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.get("/api/financial/current", authorize(), async (req, res) => {
    try {
      const now = new Date();
      const month = `${now.toLocaleString('en-US', { month: 'long' })}/${now.getFullYear()}`;
      
      const allShares = await storage.getAllShares(req.tenantId!);
      const activeShares = allShares.filter(s => s.status === "active");
      
      const totalRevenue = activeShares.reduce((sum, share) => {
        const value = parseFloat(share.purchaseValue || "0");
        const returnRate = parseFloat(share.monthlyReturn || "0");
        return sum + (value * returnRate / 100);
      }, 0);

      const investorPayouts = totalRevenue * 0.75; // 75% to investors
      const companyMargin = totalRevenue * 0.25; // 25% company margin
      
      res.json({
        month,
        totalRevenue,
        investorPayouts,
        operationalCosts: 0,
        companyMargin,
        totalCapital: activeShares.reduce((sum, s) => sum + parseFloat(s.purchaseValue || "0"), 0),
        activeShares: activeShares.length,
      });
    } catch (error) {
      console.error("Current financial error:", error);
      res.status(500).json({ message: "Failed to fetch current financials" });
    }
  });

  app.post("/api/financial/generate/:month", authorize(), async (req, res) => {
    try {
      const { month } = req.params;
      
      if (!month || !/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ 
          message: "Formato de mês inválido. Use YYYY-MM (ex: 2025-10)" 
        });
      }

      const { generateMonth } = await import("./services/finance.service");
      const result = await generateMonth(month, req.tenantId);
      
      res.json({
        success: true,
        message: `Pagamentos gerados para ${month}`,
        data: result,
      });
    } catch (error: any) {
      console.error("Generate month error:", error);
      res.status(500).json({ 
        message: error.message || "Erro ao gerar pagamentos mensais" 
      });
    }
  });

  // Compliance routes
  app.get("/api/documents", authorize(), async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUserId(req.session.userId!, req.tenantId!);
      res.json(documents);
    } catch (error) {
      console.error("Documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/audit-logs", authorize(), adminLimiter, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(req.tenantId!, 50);
      res.json(logs);
    } catch (error) {
      console.error("Audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Shares routes
  app.get("/api/shares/all", authorize(), async (req, res) => {
    try {
      const sharesWithDetails = await storage.getAllSharesWithDetails(req.tenantId!);
      res.json(sharesWithDetails);
    } catch (error) {
      console.error("All shares error:", error);
      res.status(500).json({ message: "Failed to fetch all shares" });
    }
  });

  app.get("/api/shares", authorize(), async (req, res) => {
    try {
      const shares = await storage.getSharesByUserId(req.session.userId!, req.tenantId!);
      res.json(shares);
    } catch (error) {
      console.error("Shares error:", error);
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  app.get("/api/shares/:id", authorize(), checkOwnership(), async (req, res) => {
    try {
      const share = await storage.getShare(req.params.id, req.tenantId!);
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }
      res.json(share);
    } catch (error) {
      console.error("Share error:", error);
      res.status(500).json({ message: "Failed to fetch share" });
    }
  });

  app.post("/api/shares", authorize(), async (req, res) => {
    try {
      // Check if trailer exists
      const trailer = await storage.getTrailer(req.body.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }
      
      // Check if trailer is expired (not available for purchase)
      if (trailer.status === "expired") {
        return res.status(400).json({ message: "Trailer is expired and not available for purchase" });
      }
      
      // Check available shares for this trailer
      const existingShares = await storage.getSharesByTrailerId(req.body.trailerId, req.tenantId!);
      const totalShares = parseInt(trailer.totalShares?.toString() || "1");
      const availableShares = totalShares - existingShares.length;
      
      if (availableShares <= 0) {
        return res.status(400).json({ message: "No shares available for this trailer" });
      }
      
      // Create share data directly from request and session
      const shareData: any = {
        userId: req.session.userId!,
        trailerId: req.body.trailerId,
        purchaseValue: req.body.purchaseValue,
        purchaseDate: req.body.purchaseDate,
        status: req.body.status || "active",
        monthlyReturn: req.body.monthlyReturn || "2.00",
        totalReturns: "0.00",
      };
      
      const share = await storage.createShare(shareData);
      
      // Update trailer status to active if all shares are sold
      if (existingShares.length + 1 >= totalShares) {
        await storage.updateTrailer(req.body.trailerId, { status: "active" }, req.tenantId!);
      }
      
      // Create audit log
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "purchase_share",
        entityType: "share",
        entityId: share.id,
        details: { trailerId: req.body.trailerId, purchaseValue: req.body.purchaseValue },
        ipAddress: req.ip,
      });
      
      res.json(share);
    } catch (error) {
      console.error("Create share error:", error);
      res.status(500).json({ message: "Failed to create share" });
    }
  });

  // Payments routes
  app.get("/api/payments", authorize(), async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUserId(req.session.userId!, req.tenantId!);
      res.json(payments);
    } catch (error) {
      console.error("Payments error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:shareId", authorize(), checkOwnership(), async (req, res) => {
    try {
      const payments = await storage.getPaymentsByShareId(req.params.shareId, req.tenantId!);
      res.json(payments);
    } catch (error) {
      console.error("Payments by share error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Broker Dispatch routes
  app.get("/api/broker-dispatches", authorize(), isManager, async (req, res) => {
    try {
      const dispatches = await storage.getAllBrokerDispatches(req.tenantId!);
      
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "list_broker_dispatches",
        entityType: "broker_dispatch",
        entityId: null,
        details: { count: dispatches.length },
        ipAddress: req.ip,
      });
      
      res.json(dispatches);
    } catch (error) {
      console.error("Broker dispatches error:", error);
      res.status(500).json({ message: "Failed to fetch broker dispatches" });
    }
  });

  app.get("/api/broker-dispatches/:id", authorize(), isManager, async (req, res) => {
    try {
      const dispatch = await storage.getBrokerDispatchById(req.params.id, req.tenantId!);
      if (!dispatch) {
        return res.status(404).json({ message: "Broker dispatch not found" });
      }
      res.json(dispatch);
    } catch (error) {
      console.error("Broker dispatch by id error:", error);
      res.status(500).json({ message: "Failed to fetch broker dispatch" });
    }
  });

  app.get("/api/broker-dispatches/trailer/:trailerId", authorize(), isManager, async (req, res) => {
    try {
      const dispatches = await storage.getBrokerDispatchesByTrailer(req.params.trailerId, req.tenantId!);
      res.json(dispatches);
    } catch (error) {
      console.error("Broker dispatches by trailer error:", error);
      res.status(500).json({ message: "Failed to fetch broker dispatches" });
    }
  });

  app.post("/api/broker-dispatches", authorize(), isManager, async (req, res) => {
    try {
      const validation = insertBrokerDispatchSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      // Generate dispatch number
      const allDispatches = await storage.getAllBrokerDispatches(req.tenantId!);
      const dispatchNumber = `DISPATCH-${String(allDispatches.length + 1).padStart(3, '0')}`;

      const dispatch = await storage.createBrokerDispatch({
        ...validation.data,
        dispatchNumber,
        createdBy: req.session.userId!,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_broker_dispatch",
        entityType: "broker_dispatch",
        entityId: dispatch.id,
        details: { dispatchNumber, trailerId: dispatch.trailerId },
        ipAddress: req.ip,
      });

      res.json(dispatch);
    } catch (error) {
      console.error("Create broker dispatch error:", error);
      res.status(500).json({ message: "Failed to create broker dispatch" });
    }
  });

  app.put("/api/broker-dispatches/:id", authorize(), isManager, async (req, res) => {
    try {
      const validation = insertBrokerDispatchSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: validation.error.errors 
        });
      }

      // Check if dispatch exists
      const existing = await storage.getBrokerDispatchById(req.params.id, req.tenantId!);
      if (!existing) {
        return res.status(404).json({ message: "Broker dispatch not found" });
      }

      const dispatch = await storage.updateBrokerDispatch(req.params.id, validation.data, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update_broker_dispatch",
        entityType: "broker_dispatch",
        entityId: dispatch.id,
        details: { updates: validation.data },
        ipAddress: req.ip,
      });

      res.json(dispatch);
    } catch (error) {
      console.error("Update broker dispatch error:", error);
      res.status(500).json({ message: "Failed to update broker dispatch" });
    }
  });

  app.post("/api/broker-dispatches/:id/generate-pdf", authorize(), isManager, async (req, res) => {
    try {
      const dispatch = await storage.getBrokerDispatchById(req.params.id, req.tenantId!);
      if (!dispatch) {
        return res.status(404).json({ message: "Broker dispatch not found" });
      }

      const trailer = await storage.getTrailer(dispatch.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }

      const pdfBuffer = PDFService.generateDispatchPDF({
        ...dispatch,
        trailer
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "generate_dispatch_pdf",
        entityType: "broker_dispatch",
        entityId: dispatch.id,
        details: { dispatchNumber: dispatch.dispatchNumber },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=dispatch-${dispatch.dispatchNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate dispatch PDF error:", error);
      res.status(500).json({ message: "Failed to generate dispatch PDF" });
    }
  });

  app.post("/api/rental-contracts/:id/generate-pdf", authorize(), isManager, async (req, res) => {
    try {
      const contract = await storage.getRentalContract(req.params.id, req.tenantId!);
      if (!contract) {
        return res.status(404).json({ message: "Rental contract not found" });
      }

      const client = await storage.getRentalClient(contract.clientId, req.tenantId!);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const trailer = await storage.getTrailer(contract.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }

      const pdfBuffer = PDFService.generateContractPDF({
        ...contract,
        client,
        trailer
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "generate_contract_pdf",
        entityType: "rental_contract",
        entityId: contract.id,
        details: { contractNumber: contract.contractNumber },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=contract-${contract.contractNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate contract PDF error:", error);
      res.status(500).json({ message: "Failed to generate contract PDF" });
    }
  });

  // Returns the structured invoice payload used by the preview UI. We mirror
  // the same authorization model as the PDF generation route below
  // (authorize() + isManager) since this exposes the same business data.
  app.get("/api/invoices/:id/data", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const contract = await storage.getRentalContract(invoice.contractId, req.tenantId!);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const client = await storage.getRentalClient(contract.clientId, req.tenantId!);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const trailer = await storage.getTrailer(contract.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }

      const lineItems = await storage.getInvoiceItems(invoice.id, req.tenantId!);

      const invoiceData = PDFService.buildInvoiceData({
        ...invoice,
        contract: {
          ...contract,
          client,
          trailer,
        },
        tenant: req.tenant ?? null,
        lineItems,
      });

      res.json(invoiceData);
    } catch (error) {
      console.error("Get invoice data error:", error);
      res.status(500).json({ message: "Failed to fetch invoice data" });
    }
  });

  // Invoice Line Items — managers can list, add, edit, delete the per-row
  // breakdown of an invoice (one trailer, add-ons, insurance, etc.). When
  // present these rows replace the legacy single "Locação Mensal" line in
  // the PDF and the Preview dialog.
  app.get("/api/invoices/:id/items", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      const items = await storage.getInvoiceItems(invoice.id, req.tenantId!);
      res.json(items);
    } catch (error) {
      console.error("Get invoice items error:", error);
      res.status(500).json({ message: "Failed to fetch invoice items" });
    }
  });

  app.post("/api/invoices/:id/items", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Force tenantId + invoiceId from the URL/session so the client cannot
      // smuggle a foreign-tenant or foreign-invoice value through the body.
      const validated = insertInvoiceItemSchema.parse({
        ...req.body,
        tenantId: req.tenantId!,
        invoiceId: invoice.id,
      });

      const created = await storage.createInvoiceItem(validated);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_invoice_item",
        entityType: "invoice_item",
        entityId: created.id,
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          description: created.description,
          amount: created.amount,
        },
        ipAddress: req.ip,
      });

      res.status(201).json(created);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid invoice item", errors: error.errors });
      }
      console.error("Create invoice item error:", error);
      res.status(500).json({ message: "Failed to create invoice item" });
    }
  });

  app.put("/api/invoices/:id/items/:itemId", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const existing = await storage.getInvoiceItem(req.params.itemId, req.tenantId!);
      if (!existing || existing.invoiceId !== invoice.id) {
        return res.status(404).json({ message: "Invoice item not found" });
      }

      // Only allow mutable display fields to be updated; tenantId and
      // invoiceId stay pinned to whatever the row was created with.
      const updateSchema = insertInvoiceItemSchema
        .pick({ description: true, rate: true, quantity: true, amount: true, sortOrder: true })
        .partial();
      const updates = updateSchema.parse(req.body);

      const updated = await storage.updateInvoiceItem(req.params.itemId, updates, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update_invoice_item",
        entityType: "invoice_item",
        entityId: updated.id,
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          changes: updates,
        },
        ipAddress: req.ip,
      });

      res.json(updated);
    } catch (error: any) {
      if (error?.name === "ZodError") {
        return res.status(400).json({ message: "Invalid invoice item", errors: error.errors });
      }
      console.error("Update invoice item error:", error);
      res.status(500).json({ message: "Failed to update invoice item" });
    }
  });

  app.delete("/api/invoices/:id/items/:itemId", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const existing = await storage.getInvoiceItem(req.params.itemId, req.tenantId!);
      if (!existing || existing.invoiceId !== invoice.id) {
        return res.status(404).json({ message: "Invoice item not found" });
      }

      await storage.deleteInvoiceItem(req.params.itemId, req.tenantId!);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "delete_invoice_item",
        entityType: "invoice_item",
        entityId: existing.id,
        details: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          description: existing.description,
        },
        ipAddress: req.ip,
      });

      res.status(204).send();
    } catch (error) {
      console.error("Delete invoice item error:", error);
      res.status(500).json({ message: "Failed to delete invoice item" });
    }
  });

  // Returns the per-tenant payment methods for a single invoice. Used by the
  // "Pay" dialog on the invoices page to render PIX / bank / card tabs.
  // Mirrors the same authorization model as the data + PDF routes.
  app.get("/api/invoices/:id/payment-methods", authorize(), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const methods = buildPaymentMethods(req.tenant ?? null, {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "payment_instructions_generated",
        entityType: "invoice",
        entityId: invoice.id,
        details: {
          invoiceNumber: invoice.invoiceNumber,
          methods: methods.map((m) => m.type),
        },
        ipAddress: req.ip,
      });

      res.json({ methods });
    } catch (error) {
      console.error("Get invoice payment methods error:", error);
      res.status(500).json({ message: "Failed to fetch payment methods" });
    }
  });

  app.post("/api/invoices/:id/generate-pdf", authorize(), isManager, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const contract = await storage.getRentalContract(invoice.contractId, req.tenantId!);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const client = await storage.getRentalClient(contract.clientId, req.tenantId!);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }

      const trailer = await storage.getTrailer(contract.trailerId, req.tenantId!);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }

      const lineItems = await storage.getInvoiceItems(invoice.id, req.tenantId!);
      const tenantLogoDataUrl = await fetchLogoAsDataUrl(req.tenant?.logoUrl ?? null);

      const pdfBuffer = PDFService.generateInvoicePDF({
        ...invoice,
        contract: {
          ...contract,
          client,
          trailer
        },
        tenant: req.tenant ?? null,
        lineItems,
        tenantLogoDataUrl,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "generate_invoice_pdf",
        entityType: "invoice",
        entityId: invoice.id,
        details: { invoiceNumber: invoice.invoiceNumber },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.invoiceNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate invoice PDF error:", error);
      res.status(500).json({ message: "Failed to generate invoice PDF" });
    }
  });

  app.post("/api/financial/report/:month/generate-pdf", authorize(), isManager, async (req, res) => {
    try {
      const { month } = req.params;
      
      const monthRegex = /^\d{4}-\d{2}$/;
      if (!monthRegex.test(month)) {
        return res.status(400).json({ message: "Invalid month format. Use YYYY-MM" });
      }

      const financialRecord = await storage.getFinancialRecordByMonth(month, req.tenantId!);
      if (!financialRecord) {
        return res.status(404).json({ message: "Financial record not found for this month" });
      }

      const allPayments = await db.select().from(payments).execute();
      const filteredPayments = allPayments.filter((p: any) => p.referenceMonth === month);
      const investors = await storage.getAllInvestors();
      const trailers = await storage.getAllTrailers(req.tenantId!);

      const paymentsByInvestor = filteredPayments.reduce((acc: Record<string, { investor: string; shares: number; amount: number }>, payment: any) => {
        if (!acc[payment.userId]) {
          const investor = investors.find((i: any) => i.id === payment.userId);
          acc[payment.userId] = {
            investor: investor ? `${investor.firstName} ${investor.lastName}` : 'Unknown',
            shares: 0,
            amount: 0
          };
        }
        acc[payment.userId].shares += 1;
        acc[payment.userId].amount += parseFloat(payment.amount.toString());
        return acc;
      }, {});

      const reportData = {
        month,
        totalRevenue: parseFloat(financialRecord.totalRevenue.toString()),
        investorPayouts: parseFloat(financialRecord.investorPayouts.toString()),
        operationalCosts: parseFloat(financialRecord.operationalCosts.toString()),
        companyMargin: parseFloat(financialRecord.companyMargin.toString()),
        activeTrailers: trailers.filter((t: any) => t.status === 'active').length,
        totalInvestors: Object.keys(paymentsByInvestor).length,
        payments: Object.values(paymentsByInvestor) as Array<{ investor: string; shares: number; amount: number }>
      };

      const pdfBuffer = PDFService.generateFinancialReportPDF(reportData);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "generate_financial_report_pdf",
        entityType: "financial_record",
        entityId: financialRecord.id,
        details: { month },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${month}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Generate financial report PDF error:", error);
      res.status(500).json({ message: "Failed to generate financial report PDF" });
    }
  });

  // ===========================
  // Export/Import Endpoints
  // ===========================

  const upload = multer({ storage: multer.memoryStorage() });

  // Export trailers to Excel
  app.get("/api/export/trailers", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const buffer = await ExportService.exportTrailers();

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "export_trailers",
        entityType: "trailer",
        entityId: null,
        details: { format: "xlsx" },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=trailers-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Export trailers error:", error);
      res.status(500).json({ message: "Failed to export trailers" });
    }
  });

  // Export invoices to Excel
  app.get("/api/export/invoices", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const buffer = await ExportService.exportInvoices(
        startDate as string | undefined, 
        endDate as string | undefined
      );

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "export_invoices",
        entityType: "invoice",
        entityId: null,
        details: { format: "xlsx", startDate, endDate },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=invoices-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Export invoices error:", error);
      res.status(500).json({ message: "Failed to export invoices" });
    }
  });

  // Export shares to Excel
  app.get("/api/export/shares", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const buffer = await ExportService.exportShares();

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "export_shares",
        entityType: "share",
        entityId: null,
        details: { format: "xlsx" },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=investment-shares-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Export shares error:", error);
      res.status(500).json({ message: "Failed to export shares" });
    }
  });

  // Export rental clients to Excel
  app.get("/api/export/clients", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const buffer = await ExportService.exportRentalClients();

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "export_clients",
        entityType: "rental_client",
        entityId: null,
        details: { format: "xlsx" },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=rental-clients-${Date.now()}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Export clients error:", error);
      res.status(500).json({ message: "Failed to export clients" });
    }
  });

  // Export financial report to Excel
  app.get("/api/export/financial-report", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

      const buffer = await ExportService.exportFinancialReport(year, month);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "export_financial_report",
        entityType: "financial_record",
        entityId: null,
        details: { format: "xlsx", year, month },
        ipAddress: req.ip,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=financial-report-${year}-${String(month).padStart(2, '0')}.xlsx`);
      res.send(buffer);
    } catch (error) {
      console.error("Export financial report error:", error);
      res.status(500).json({ message: "Failed to export financial report" });
    }
  });

  // Download trailer import template
  app.get("/api/import/templates/trailers", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const buffer = ImportService.generateTrailerTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=trailer-import-template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Generate trailer template error:", error);
      res.status(500).json({ message: "Failed to generate trailer template" });
    }
  });

  // Download client import template
  app.get("/api/import/templates/clients", adminLimiter, isAuthenticated, async (req, res) => {
    try {
      const buffer = ImportService.generateClientTemplate();

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=client-import-template.xlsx');
      res.send(buffer);
    } catch (error) {
      console.error("Generate client template error:", error);
      res.status(500).json({ message: "Failed to generate client template" });
    }
  });

  // Import trailers from Excel
  app.post("/api/import/trailers", adminLimiter, isAuthenticated, isManager, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await ImportService.importTrailers(req.file.buffer);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "import_trailers",
        entityType: "trailer",
        entityId: null,
        details: { 
          total: result.total, 
          imported: result.imported, 
          failed: result.failed 
        },
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error) {
      console.error("Import trailers error:", error);
      res.status(500).json({ message: "Failed to import trailers" });
    }
  });

  // Import rental clients from Excel
  app.post("/api/import/clients", adminLimiter, isAuthenticated, isManager, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const result = await ImportService.importRentalClients(req.file.buffer);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "import_clients",
        entityType: "rental_client",
        entityId: null,
        details: { 
          total: result.total, 
          imported: result.imported, 
          failed: result.failed 
        },
        ipAddress: req.ip,
      });

      res.json(result);
    } catch (error) {
      console.error("Import clients error:", error);
      res.status(500).json({ message: "Failed to import clients" });
    }
  });

  // ===========================
  // System Status Endpoint
  // ===========================

  app.get("/api/system/status", adminLimiter, isAuthenticated, isManager, async (req, res) => {
    try {
      const { getSchedulerState } = await import("./scheduler");
      const schedulerState = getSchedulerState();

      const now = new Date();
      const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

      const [
        activeTrailersResult,
        activeSharesResult,
        openInvoicesResult,
        paidThisMonthResult,
        totalUsersResult,
      ] = await Promise.all([
        pool.query(
          `SELECT COUNT(*) AS count FROM trailers WHERE tenant_id = $1 AND status = 'active'`,
          [req.tenantId]
        ),
        pool.query(
          `SELECT COUNT(*) AS count FROM shares WHERE tenant_id = $1 AND status = 'active'`,
          [req.tenantId]
        ),
        pool.query(
          `SELECT COUNT(*) AS count FROM invoices WHERE tenant_id = $1 AND status IN ('pending', 'overdue')`,
          [req.tenantId]
        ),
        pool.query(
          `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE tenant_id = $1 AND reference_month = $2`,
          [req.tenantId, currentMonth]
        ),
        pool.query(
          `SELECT COUNT(*) AS count FROM users WHERE tenant_id = $1 AND role = 'investor'`,
          [req.tenantId]
        ),
      ]);

      // Inspect tenant billing configuration so the Settings page can warn
      // managers when invoices will go out without PIX/bank info or branding.
      // We treat "configured" as: at least the brand name and logo are set
      // AND at least one payment method (PIX key or bank account) is filled.
      const t = req.tenant;
      const tenantBillingMissing: string[] = [];
      if (!t?.name?.trim()) tenantBillingMissing.push("name");
      if (!t?.logoUrl?.trim()) tenantBillingMissing.push("logoUrl");
      if (!t?.billingEmail?.trim()) tenantBillingMissing.push("billingEmail");
      const hasBank = !!(t?.bankName?.trim() && t?.bankAccount?.trim());
      if (!hasBank) tenantBillingMissing.push("paymentMethod");

      res.json({
        timestamp: now.toISOString(),
        currentMonth,
        assets: {
          activeTrailers: parseInt(activeTrailersResult.rows[0].count, 10),
          activeShares: parseInt(activeSharesResult.rows[0].count, 10),
          totalInvestors: parseInt(totalUsersResult.rows[0].count, 10),
        },
        financial: {
          openInvoices: parseInt(openInvoicesResult.rows[0].count, 10),
          paidThisMonth: parseFloat(paidThisMonthResult.rows[0].total),
          currentMonth,
        },
        scheduler: {
          isRunning: schedulerState.isRunning,
          lastPaymentRun: schedulerState.lastPaymentRun,
          lastOverdueCheck: schedulerState.lastOverdueCheck,
          lastMaintenanceCheck: schedulerState.lastMaintenanceCheck,
          lastGeofenceCheck: schedulerState.lastGeofenceCheck,
        },
        integrations: {
          stripe: !!process.env.STRIPE_SECRET_KEY,
          smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER),
          whatsapp: !!(process.env.TWILIO_ACCOUNT_SID || process.env.META_WHATSAPP_TOKEN),
          sessionStore: "postgresql",
        },
        tenantBilling: {
          configured: tenantBillingMissing.length === 0,
          missing: tenantBillingMissing,
        },
      });
    } catch (error) {
      console.error("System status error:", error);
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // ===========================
  // Monitoring & Logs Endpoints
  // ===========================

  // Get filtered audit logs
  app.get("/api/monitoring/logs", adminLimiter, isAuthenticated, isManager, async (req, res) => {
    try {
      const filter = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        userId: req.query.userId as string | undefined,
        action: req.query.action as string | undefined,
        entityType: req.query.entityType as string | undefined,
        ipAddress: req.query.ipAddress as string | undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };

      const result = await MonitoringService.getFilteredLogs(filter);

      res.json(result);
    } catch (error) {
      console.error("Get logs error:", error);
      res.status(500).json({ message: "Failed to retrieve logs" });
    }
  });

  // Detect suspicious activities
  app.get("/api/monitoring/suspicious", adminLimiter, isAuthenticated, isManager, async (req, res) => {
    try {
      const lookbackHours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const activities = await MonitoringService.detectSuspiciousActivities(lookbackHours);

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "view_suspicious_activities",
        entityType: "audit_log",
        entityId: null,
        details: { lookbackHours, foundActivities: activities.length },
        ipAddress: req.ip,
      });

      res.json({
        activities,
        lookbackHours,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Detect suspicious activities error:", error);
      res.status(500).json({ message: "Failed to detect suspicious activities" });
    }
  });

  // Get activity statistics
  app.get("/api/monitoring/statistics", adminLimiter, isAuthenticated, isManager, async (req, res) => {
    try {
      const hours = req.query.hours ? parseInt(req.query.hours as string) : 24;
      const stats = await MonitoringService.getActivityStatistics(hours);

      res.json(stats);
    } catch (error) {
      console.error("Get activity statistics error:", error);
      res.status(500).json({ message: "Failed to retrieve activity statistics" });
    }
  });

  // Get unique values for filters (for dropdown autocomplete)
  app.get("/api/monitoring/filter-options", adminLimiter, isAuthenticated, isManager, async (req, res) => {
    try {
      const distinctActions = await db.selectDistinct({ action: auditLogs.action }).from(auditLogs).limit(100);
      const distinctEntityTypes = await db.selectDistinct({ entityType: auditLogs.entityType }).from(auditLogs).limit(100);
      const distinctUsers = await db.select({ id: users.id, username: users.username, email: users.email }).from(users).limit(100);

      res.json({
        actions: distinctActions.map(a => a.action).filter(Boolean),
        entityTypes: distinctEntityTypes.map(e => e.entityType).filter(Boolean),
        users: distinctUsers,
      });
    } catch (error) {
      console.error("Get filter options error:", error);
      res.status(500).json({ message: "Failed to retrieve filter options" });
    }
  });

  // ===========================
  // Stripe Payment Endpoints
  // ===========================

  // Create payment intent for share purchase ($28,000 fixed)
  app.post("/api/stripe/create-share-payment", apiLimiter, isAuthenticated, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Payment processing is not configured. Please contact support." });
      }

      const { shareId, investorUserId } = req.body;

      if (!shareId || !investorUserId) {
        return res.status(400).json({ message: "Missing shareId or investorUserId" });
      }

      // Verify share exists and is available
      const share = await storage.getShare(shareId, req.tenantId!);
      if (!share) {
        return res.status(404).json({ message: "Share not found" });
      }

      if (share.status !== "available") {
        return res.status(400).json({ message: "Share is not available for purchase" });
      }

      // Create Stripe payment intent for $28,000
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: 2800000, // $28,000 in cents
        currency: "usd",
        metadata: {
          type: "share_purchase",
          shareId: shareId,
          investorUserId: investorUserId,
          trailerId: share.trailerId,
        },
        description: `Purchase of Share #${shareId} - Trailer Investment`,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_share_payment_intent",
        entityType: "share",
        entityId: shareId,
        details: { 
          paymentIntentId: paymentIntent.id,
          amount: 28000,
          investorUserId 
        },
        ipAddress: req.ip,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: 28000,
      });
    } catch (error: any) {
      console.error("Create share payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent: " + error.message });
    }
  });

  // Create payment intent for invoice payment (variable amount)
  app.post("/api/stripe/create-invoice-payment", apiLimiter, isAuthenticated, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Payment processing is not configured. Please contact support." });
      }

      const { invoiceId } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ message: "Missing invoiceId" });
      }

      // Get invoice details
      const invoice = await storage.getInvoice(invoiceId, req.tenantId!);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      if (invoice.status === "paid") {
        return res.status(400).json({ message: "Invoice is already paid" });
      }

      // Calculate amount in cents
      const amountInCents = Math.round(parseFloat(invoice.amount) * 100);

      // Create Stripe payment intent (USD)
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          type: "invoice_payment",
          invoiceId: invoiceId,
          contractId: invoice.contractId,
          tenantId: req.tenantId!,
        },
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      });

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "create_invoice_payment_intent",
        entityType: "invoice",
        entityId: invoiceId,
        details: { 
          paymentIntentId: paymentIntent.id,
          amount: invoice.amount,
          invoiceNumber: invoice.invoiceNumber 
        },
        ipAddress: req.ip,
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: parseFloat(invoice.amount),
        invoiceNumber: invoice.invoiceNumber,
      });
    } catch (error: any) {
      console.error("Create invoice payment intent error:", error);
      res.status(500).json({ message: "Failed to create payment intent: " + error.message });
    }
  });

  // Webhook to handle successful payments from Stripe
  app.post("/api/stripe/webhook", async (req, res) => {
    if (!isStripeConfigured()) {
      return res.status(503).send('Payment processing is not configured');
    }

    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).send('Missing Stripe signature');
    }

    let event: Stripe.Event;

    try {
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        // Stripe signature verification REQUIRES the original raw bytes — the
        // parsed JSON body would change ordering / whitespace and fail the
        // HMAC check. We capture the raw buffer in `index.ts` via the
        // express.json() verify hook and use it here.
        const rawBody = req.rawBody;
        if (!Buffer.isBuffer(rawBody)) {
          console.error("Webhook rejected: raw body unavailable for signature verification");
          return res.status(400).send("Raw body required for signature verification");
        }
        event = stripe!.webhooks.constructEvent(rawBody, sig, webhookSecret);
      } else if (process.env.NODE_ENV === "production") {
        console.error("Webhook rejected: STRIPE_WEBHOOK_SECRET not configured in production");
        return res.status(503).send("Webhook secret not configured");
      } else {
        console.warn("Stripe webhook accepted without signature verification (development only)");
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Idempotency at the event level: Stripe can re-deliver the same event
    // (network blip, retry from the dashboard, missed ack, two parallel
    // deliveries). The invoice ledger already prevents double-charging at
    // the financial layer, but re-running this handler would duplicate
    // audit log entries and manager notifications.
    //
    // Lease-based claim: in a single atomic upsert we either insert a fresh
    // `processing` row, steal a stale `processing` row whose owner crashed
    // (lease expired), or fail because someone else holds a fresh claim or
    // the event is already `completed`. This eliminates the check-then-mark
    // race AND keeps Stripe's retries useful when a process crashes mid-
    // handler — without ever running side-effects twice for the same id.
    //
    // The claim is REQUIRED to proceed: a DB error here returns 500 so
    // Stripe retries, rather than processing without a persisted claim.
    let claimed = false;
    try {
      const claim = await storage.claimStripeEvent(event.id);
      claimed = claim.claimed;
      if (!claim.claimed) {
        if (claim.existingStatus === "completed") {
          // Terminal: side-effects ran and were finalized. Acknowledge
          // with 200 so Stripe stops retrying.
          console.log(
            `ℹ️  Stripe event ${event.id} (${event.type}) já está completed — reentrega ignorada.`,
          );
          return res.json({ received: true, duplicate: true, status: "completed" });
        }
        // status === 'processing': either another worker is genuinely
        // mid-flight, OR a prior attempt's completion step failed. We
        // CANNOT acknowledge with 200 here, because that would make Stripe
        // stop retrying — leaving the row stuck in 'processing' if the
        // current worker also crashes. Returning a 4xx keeps Stripe's
        // retry chain alive: the next retry will either see 'completed'
        // (200), still see 'processing' within the lease (4xx, keep
        // retrying), or after the 5-min lease expires it will be allowed
        // to reclaim and reprocess (with the invoice ledger UNIQUE still
        // protecting against double-charging).
        console.warn(
          `⚠️  Stripe event ${event.id} (${event.type}) está em processing — recusando reentrega para forçar retry do Stripe.`,
        );
        return res.status(409).json({
          message: "Event currently processing; will be retried",
          status: "processing",
        });
      }
    } catch (claimError) {
      console.error(
        `❌ Failed to claim Stripe event ${event.id} for idempotency — refusing to process without a claim so Stripe will retry:`,
        claimError,
      );
      return res.status(500).json({ message: "Failed to record event for idempotency; please retry" });
    }

    // Handle the event
    try {
      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const metadata = paymentIntent.metadata;

          if (metadata.type === 'share_purchase') {
            // Update share status to sold and link to investor
            await storage.updateShare(metadata.shareId, {
              userId: metadata.investorUserId,
              status: "sold",
              purchaseDate: new Date().toISOString(),
            });

            // Create financial record for share purchase
            await storage.createFinancialRecord({ tenantId: req.tenantId!,
              month: new Date().toISOString().slice(0, 7),
              totalRevenue: (paymentIntent.amount / 100).toFixed(2),
              investorPayouts: "0",
              operationalCosts: "0",
              companyMargin: (paymentIntent.amount / 100).toFixed(2),
            });

            console.log(`✅ Share ${metadata.shareId} purchased by user ${metadata.investorUserId}`);

          } else if (metadata.type === 'invoice_payment') {
            // Strict payment validation (Template 5)
            const invoiceId = metadata.invoiceId;
            const tenantId = metadata.tenantId;

            if (!invoiceId || !tenantId) {
              console.error(
                `❌ invoice_payment webhook missing metadata: invoiceId=${invoiceId} tenantId=${tenantId} paymentIntent=${paymentIntent.id}`,
              );
              // Without tenantId we cannot scope an audit_log row.
              // Console error above is the only trace possible.
              break;
            }

            let invoice = await storage.getInvoice(invoiceId, tenantId);
            if (!invoice) {
              await storage.createAuditLog({
                tenantId,
                userId: null,
                action: "payment_rejected_status",
                entityType: "invoice",
                entityId: invoiceId,
                details: {
                  source: "stripe",
                  reason: "invoice_not_found",
                  paymentIntentId: paymentIntent.id,
                  receivedAmountCents: paymentIntent.amount,
                },
                ipAddress: req.ip,
              });
              console.error(
                `❌ invoice_payment webhook: invoice ${invoiceId} not found for tenant ${tenantId} (paymentIntent=${paymentIntent.id})`,
              );
              break;
            }

            // Idempotency: ledger is the source of truth for "this event
            // already produced a payment". Check it before validation so
            // re-deliveries skip the status gate and partial failures are
            // recovered.
            const existingLedger = await storage.getInvoicePaymentByStripePaymentIntent(
              paymentIntent.id,
            );

            let validation;
            if (existingLedger) {
              validation = {
                valid: true as const,
                details: {
                  expectedAmountCents: Math.round(parseFloat(invoice.amount) * 100),
                  receivedAmountCents: paymentIntent.amount,
                  invoiceStatus: invoice.status,
                  source: "stripe" as const,
                },
              };
              if (invoice.status === "paid") {
                console.log(
                  `ℹ️  Stripe paymentIntent ${paymentIntent.id} já processado integralmente — reentrega ignorada.`,
                );
                break;
              }
              console.warn(
                `⚠️  Recovering side-effects for paymentIntent ${paymentIntent.id} (ledger exists, invoice status=${invoice.status}).`,
              );
            } else {
              validation = validateInvoicePayment(
                invoice,
                paymentIntent.amount,
                "stripe",
              );

              if (!validation.valid) {
                const auditAction =
                  validation.reason === "amount_mismatch"
                    ? "payment_rejected_amount"
                    : "payment_rejected_status";

                await storage.createAuditLog({
                  tenantId,
                  userId: null,
                  action: auditAction,
                  entityType: "invoice",
                  entityId: invoice.id,
                  details: {
                    ...validation.details,
                    reason: validation.reason,
                    paymentIntentId: paymentIntent.id,
                    invoiceNumber: invoice.invoiceNumber,
                  },
                  ipAddress: req.ip,
                });

                console.error(
                  `❌ Stripe payment rejected for invoice ${invoice.invoiceNumber} (${invoice.id}): reason=${validation.reason} expected=${validation.details.expectedAmountCents}c received=${validation.details.receivedAmountCents}c status=${validation.details.invoiceStatus}`,
                );
                // Always 200 to Stripe so it does not retry indefinitely.
                break;
              }

              // Ledger insert first; on UNIQUE race, recover side-effects
              // if the racing winner did not finish them.
              try {
                await storage.createInvoicePayment({
                  tenantId,
                  invoiceId: invoice.id,
                  amount: (paymentIntent.amount / 100).toFixed(2),
                  paidAt: new Date(),
                  method: "stripe",
                  stripePaymentIntentId: paymentIntent.id,
                });
              } catch (ledgerError: any) {
                const isUniqueViolation =
                  ledgerError?.code === "23505" ||
                  /duplicate key value/i.test(ledgerError?.message ?? "");
                if (!isUniqueViolation) throw ledgerError;

                const refreshed = await storage.getInvoice(invoice.id, tenantId);
                if (!refreshed || refreshed.status === "paid") {
                  console.log(
                    `ℹ️  Concurrent webhook delivery already finalized ${paymentIntent.id} — exiting.`,
                  );
                  break;
                }
                console.warn(
                  `⚠️  Concurrent ledger insert detected for ${paymentIntent.id}; finishing side-effects (invoice still ${refreshed.status}).`,
                );
                invoice = refreshed;
              }
            }

            await storage.updateInvoice(
              invoice.id,
              {
                status: "paid",
                paidDate: new Date().toISOString().split("T")[0],
              },
              tenantId,
            );

            await storage.createAuditLog({
              tenantId,
              userId: null,
              action: "payment_validated",
              entityType: "invoice",
              entityId: invoice.id,
              details: {
                ...validation.details,
                paymentIntentId: paymentIntent.id,
                invoiceNumber: invoice.invoiceNumber,
                ...(existingLedger ? { recovery: true } : {}),
              },
              ipAddress: req.ip,
            });

            // Fan-out an in-app notification to every manager / admin of the
            // tenant so the team sees the paid status without having to refresh
            // the invoices list. Failures here must NOT break the webhook
            // response — Stripe will keep retrying if we error out and we'd
            // double-pay the invoice. Silent best-effort instead.
            try {
              const tenantUsers = await storage.getAllUsers(tenantId);
              const managers = tenantUsers.filter(
                (u) => u.role === "manager" || u.role === "admin",
              );
              if (managers.length > 0) {
                const notifier = new NotificationService();
                const amountUSD = (paymentIntent.amount / 100).toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                });
                await Promise.all(
                  managers.map((m) =>
                    notifier.createNotification({
                      userId: m.id,
                      title: "Invoice paid",
                      message: `Invoice ${invoice.invoiceNumber} was paid by credit card (${amountUSD}).`,
                      type: "system_alert",
                      severity: "info",
                      metadata: {
                        invoiceId: invoice.id,
                        invoiceNumber: invoice.invoiceNumber,
                        paymentIntentId: paymentIntent.id,
                        amountCents: paymentIntent.amount,
                        source: "stripe_webhook",
                      },
                    }),
                  ),
                );
              }
            } catch (notifyError) {
              console.error(
                `⚠️  Failed to send paid-invoice notifications for ${invoice.invoiceNumber}:`,
                notifyError,
              );
            }

            console.log(
              `✅ Invoice ${invoice.invoiceNumber} (${invoice.id}) paid via Stripe (paymentIntent=${paymentIntent.id})`,
            );
          }

          break;
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          console.error(`❌ Payment failed: ${paymentIntent.id}`);
          break;
        }

        default:
          console.log(`Unhandled Stripe event type: ${event.type}`);
      }

      // Mark the claim as completed so future re-deliveries short-circuit
      // forever (no lease window applies to `completed` rows). This is
      // FAIL-CLOSED: if completion fails after the storage retries, we
      // return 500 so Stripe retries the delivery. Within the lease window
      // the next delivery short-circuits as duplicate, so no double
      // side-effects happen until completion is finally recorded.
      try {
        await storage.completeStripeEvent(event.id);
      } catch (completeError) {
        console.error(
          `❌ Failed to mark Stripe event ${event.id} as completed after retries — returning 500 so Stripe will retry. Side-effects already ran; the lease prevents re-execution until the next attempt finally completes.`,
          completeError,
        );
        return res.status(500).json({ message: "Failed to finalize event idempotency record; please retry" });
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      // Release the claim so Stripe's retry can attempt the event again
      // immediately instead of waiting for the lease to expire.
      if (claimed) {
        try {
          await storage.releaseStripeEventClaim(event.id);
        } catch (releaseError) {
          console.error(
            `⚠️  Failed to release idempotency claim for ${event.id}:`,
            releaseError,
          );
        }
      }
      res.status(500).json({ message: "Webhook processing failed" });
    }
  });

  // Get payment status
  app.get("/api/stripe/payment-status/:paymentIntentId", apiLimiter, isAuthenticated, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Payment processing is not configured. Please contact support." });
      }

      const { paymentIntentId } = req.params;

      const paymentIntent = await stripe!.paymentIntents.retrieve(paymentIntentId);

      res.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata,
      });
    } catch (error: any) {
      console.error("Get payment status error:", error);
      res.status(500).json({ message: "Failed to retrieve payment status: " + error.message });
    }
  });

  // ===========================
  // WhatsApp Routes
  // ===========================

  app.get("/api/whatsapp/logs", authorize(), async (req, res) => {
    try {
      const limit = Math.min(parseInt(String(req.query.limit ?? "50"), 10) || 50, 200);
      const offset = Math.max(parseInt(String(req.query.offset ?? "0"), 10) || 0, 0);

      const { WhatsAppService } = await import("./services/whatsapp.service");
      const logs = await WhatsAppService.getAllLogs(req.tenantId!, limit, offset);
      res.json(logs);
    } catch (error) {
      console.error("WhatsApp logs error:", error);
      res.status(500).json({ message: "Failed to fetch WhatsApp logs" });
    }
  });

  app.post("/api/whatsapp/test", authorize(), async (req, res) => {
    try {
      const { phone, event } = req.body as { phone?: string; event?: string };

      if (!phone) {
        return res.status(400).json({ message: "phone is required" });
      }

      const { WhatsAppService, isWhatsAppEvent } = await import("./services/whatsapp.service");

      if (!event || !isWhatsAppEvent(event)) {
        return res.status(400).json({
          message: "event must be one of: payment_generated, invoice_issued, invoice_overdue, maintenance_due, geofence_alert",
        });
      }

      const result = await WhatsAppService.sendTestMessage(phone, event, req.tenantId!);

      res.json({
        status: result.status,
        messageId: result.messageId,
        provider: WhatsAppService.getProviderName(),
        error: result.error,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("WhatsApp test error:", message);
      res.status(500).json({ message: "Failed to send test message: " + message });
    }
  });

  // ============================================
  // PUBLIC PAYMENT ENDPOINTS (token-authenticated)
  // ============================================
  // These endpoints are reachable without a logged-in session. They rely on
  // a signed HMAC token (generated when the invoice email is sent) to scope
  // access to a single invoice.

  app.get("/api/public/invoices/:token", apiLimiter, async (req, res) => {
    try {
      const invoiceId = verifyInvoiceToken(req.params.token);
      if (!invoiceId) {
        return res.status(401).json({ message: "Invalid or expired link." });
      }

      const invoice = await storage.getInvoiceByIdPublic(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found." });
      }

      const tenantId = invoice.tenantId;
      const tenant = await storage.getTenant(tenantId);
      const contract = await storage.getRentalContract(invoice.contractId, tenantId);
      const client = contract ? await storage.getRentalClient(contract.clientId, tenantId) : null;
      const trailer = contract ? await storage.getTrailer(contract.trailerId, tenantId) : null;

      const paymentMethods = buildPaymentMethods(
        tenant ?? null,
        invoice,
        { publicPaymentUrl: buildPublicPaymentUrl(invoice.id) },
      );

      res.json({
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          dueDate: invoice.dueDate,
          status: invoice.status,
          referenceMonth: invoice.referenceMonth,
          notes: invoice.notes,
        },
        client: client
          ? {
              companyName: client.companyName,
              tradeName: client.tradeName,
              email: client.email,
            }
          : null,
        trailer: trailer
          ? {
              fleetNumber: trailer.trailerId,
              chassisNumber: trailer.vin ?? null,
            }
          : null,
        tenant: tenant
          ? {
              name: tenant.name,
              logoUrl: tenant.logoUrl ?? null,
              primaryColor: tenant.primaryColor ?? null,
            }
          : null,
        paymentMethods,
        stripeEnabled: isStripeConfigured(),
      });
    } catch (error) {
      console.error("Public invoice fetch error:", error);
      res.status(500).json({ message: "Failed to load invoice." });
    }
  });

  app.post("/api/public/invoices/:token/payment-intent", apiLimiter, async (req, res) => {
    try {
      if (!isStripeConfigured()) {
        return res.status(503).json({ message: "Card payments are unavailable at the moment." });
      }

      const invoiceId = verifyInvoiceToken(req.params.token);
      if (!invoiceId) {
        return res.status(401).json({ message: "Invalid or expired link." });
      }

      const invoice = await storage.getInvoiceByIdPublic(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found." });
      }

      if (invoice.status === "paid") {
        return res.status(400).json({ message: "This invoice has already been paid." });
      }

      const amountInCents = Math.round(parseFloat(invoice.amount) * 100);

      const paymentIntent = await stripe!.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          type: "invoice_payment",
          invoiceId: invoice.id,
          contractId: invoice.contractId,
          tenantId: invoice.tenantId,
          source: "public_link",
        },
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: parseFloat(invoice.amount),
        invoiceNumber: invoice.invoiceNumber,
      });
    } catch (error: any) {
      console.error("Public invoice payment intent error:", error);
      res.status(500).json({ message: "Failed to initiate payment: " + error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
