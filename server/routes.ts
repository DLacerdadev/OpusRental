import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import Stripe from "stripe";
import { 
  insertUserSchema, 
  insertTrailerSchema, 
  insertShareSchema, 
  financialRecords,
  payments, 
  insertGpsDeviceSchema,
  insertRentalClientSchema,
  insertRentalContractSchema,
  insertInvoiceSchema,
  insertChecklistSchema,
  insertMaintenanceScheduleSchema,
  insertBrokerDispatchSchema,
  auditLogs,
  users
} from "@shared/schema";
import { PDFService } from "./services/pdf.service";
import { buildPaymentMethods } from "./services/payment-methods.service";
import { EmailService } from "./services/email.service";
import { ExportService } from "./services/export.service";
import { ImportService } from "./services/import.service";
import { MonitoringService } from "./services/monitoring.service";
import { z } from "zod";
import session from "express-session";
import ConnectPgSimple from "connect-pg-simple";
import { isAuthenticated, isManager, isAdmin, requireRole, authorize, checkOwnership, logAccess } from "./middleware/auth";
import { tenantMiddleware, requireTenant } from "./tenant-middleware";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db, pool } from "./db";
import { sql } from "drizzle-orm";
import { GpsAdapterFactory, type GpsProvider } from "./services/gps/factory";
import multer from "multer";

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

      // Sanitize response - only return public branding + billing fields
      const publicTenantData = {
        id: req.tenant.id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        logoUrl: req.tenant.logoUrl,
        primaryColor: req.tenant.primaryColor,
        secondaryColor: req.tenant.secondaryColor,
        status: req.tenant.status,
        pixKey: req.tenant.pixKey ?? null,
        pixBeneficiary: req.tenant.pixBeneficiary ?? null,
        bankName: req.tenant.bankName ?? null,
        bankAgency: req.tenant.bankAgency ?? null,
        bankAccount: req.tenant.bankAccount ?? null,
        bankAccountHolder: req.tenant.bankAccountHolder ?? null,
        bankAccountType: req.tenant.bankAccountType ?? null,
      };

      res.json(publicTenantData);
    } catch (error) {
      console.error("Get tenant error:", error);
      res.status(500).json({ message: "Failed to fetch tenant" });
    }
  });

  // Update tenant branding (Manager only)
  app.put("/api/tenant", authorize(), async (req, res) => {
    try {
      const optionalString = z.string().trim().max(200).optional().nullable()
        .transform((v) => (v === undefined ? undefined : v === null || v === "" ? null : v));

      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        primaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        secondaryColor: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
        logoUrl: z.string().url().optional().nullable(),
        // Per-tenant payment configuration (Template 3)
        pixKey: optionalString,
        pixBeneficiary: optionalString,
        bankName: optionalString,
        bankAgency: optionalString,
        bankAccount: optionalString,
        bankAccountHolder: optionalString,
        bankAccountType: z.enum(["checking", "savings"]).optional().nullable()
          .transform((v) => (v === undefined ? undefined : v ?? null)),
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

      // Return sanitized response (includes payment fields so the settings UI
      // can re-hydrate after saving)
      const publicTenantData = {
        id: updatedTenant.id,
        name: updatedTenant.name,
        slug: updatedTenant.slug,
        logoUrl: updatedTenant.logoUrl,
        primaryColor: updatedTenant.primaryColor,
        secondaryColor: updatedTenant.secondaryColor,
        status: updatedTenant.status,
        pixKey: updatedTenant.pixKey ?? null,
        pixBeneficiary: updatedTenant.pixBeneficiary ?? null,
        bankName: updatedTenant.bankName ?? null,
        bankAgency: updatedTenant.bankAgency ?? null,
        bankAccount: updatedTenant.bankAccount ?? null,
        bankAccountHolder: updatedTenant.bankAccountHolder ?? null,
        bankAccountType: updatedTenant.bankAccountType ?? null,
      };

      res.json(publicTenantData);
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

      const invoice = await storage.createInvoice({
        ...validation.data,
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
      const statusUpdateSchema = z.object({
        status: z.enum(["pending", "paid", "overdue", "cancelled"]),
        paidDate: z.string().optional(),
      }).strict();

      const validation = statusUpdateSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const paidDate = validation.data.paidDate ? new Date(validation.data.paidDate) : undefined;
      
      const invoice = await storage.updateInvoiceStatus(
        req.params.id, 
        validation.data.status,
        paidDate
      );

      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "update",
        entityType: "invoice",
        entityId: invoice.id,
        details: validation.data,
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
            await EmailService.sendInvoiceReissuedEmail(
              { invoice: reissued, contract, client },
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
            `📄 Invoice Reissued (2ª Via) - ${invoice.invoiceNumber} - New Due Date ${newDueDateLocale}`,
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
      const { InvoiceAutomationService } = await import("./services/invoice-automation.service");
      await InvoiceAutomationService.generateInvoicesNow();
      
      await storage.createAuditLog({
        tenantId: req.tenantId!,
        userId: req.session.userId!,
        action: "manual_invoice_generation",
        entityType: "invoice",
        entityId: null,
        details: { triggeredBy: "manual" },
        ipAddress: req.ip,
      });

      res.json({ message: "Monthly invoices generated successfully" });
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

      const invoiceData = PDFService.buildInvoiceData({
        ...invoice,
        contract: {
          ...contract,
          client,
          trailer,
        },
        tenant: req.tenant ?? null,
      });

      res.json(invoiceData);
    } catch (error) {
      console.error("Get invoice data error:", error);
      res.status(500).json({ message: "Failed to fetch invoice data" });
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

      const pdfBuffer = PDFService.generateInvoicePDF({
        ...invoice,
        contract: {
          ...contract,
          client,
          trailer
        },
        tenant: req.tenant ?? null,
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

      // Create Stripe payment intent
      const paymentIntent = await stripe!.paymentIntents.create({
        amount: amountInCents,
        currency: "usd",
        metadata: {
          type: "invoice_payment",
          invoiceId: invoiceId,
          contractId: invoice.contractId,
        },
        description: `Payment for Invoice #${invoice.invoiceNumber} - Rental Fee`,
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
      // Verify webhook signature (requires STRIPE_WEBHOOK_SECRET in production)
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe!.webhooks.constructEvent(req.body, sig, webhookSecret);
      } else {
        // In development, accept without verification (not recommended for production)
        event = req.body as Stripe.Event;
      }
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
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
            // Update invoice status to paid
            await storage.updateInvoice(metadata.invoiceId, {
              status: "paid",
              paidDate: new Date().toISOString(),
            });

            console.log(`✅ Invoice ${metadata.invoiceId} paid via Stripe`);
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

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
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

  const httpServer = createServer(app);
  return httpServer;
}
