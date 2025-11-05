import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { 
  insertUserSchema, 
  insertTrailerSchema, 
  insertShareSchema, 
  financialRecords, 
  insertGpsDeviceSchema,
  insertRentalClientSchema,
  insertRentalContractSchema,
  insertInvoiceSchema,
  insertChecklistSchema,
  insertMaintenanceScheduleSchema,
  insertBrokerDispatchSchema
} from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import { isAuthenticated, isManager, requireRole, authorize, checkOwnership, logAccess } from "./middleware/auth";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { GpsAdapterFactory, type GpsProvider } from "./services/gps/factory";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
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

  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "opus-rental-capital-secret-key",
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

  // Access logging
  app.use(logAccess());

  // Auth routes
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Normalize email to lowercase for consistent comparison
      const normalizedEmail = email.toLowerCase().trim();
      
      const user = await storage.getUserByEmail(normalizedEmail);
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
      const { firstName, lastName, email, username, password } = req.body;

      // Normalize email to lowercase for consistent storage and comparison
      const normalizedEmail = email.toLowerCase().trim();

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(normalizedEmail);
      if (existingUser) {
        return res.status(400).json({ message: "emailExists" });
      }

      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "usernameExists" });
      }

      // Create new investor user (password will be hashed in createUser)
      const newUser = await storage.createUser({
        firstName,
        lastName,
        email: normalizedEmail,
        username,
        password,
        role: "investor",
        country: "BR",
      });

      // Log the registration
      await storage.createAuditLog({
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
      const user = await storage.getUser(req.session.userId!);
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

  // Investors list (Manager/Admin only)
  app.get("/api/investors", authorize(), async (req, res) => {
    try {
      const investors = await storage.getAllInvestors();
      const investorsWithoutPasswords = investors.map(({ password, ...investor }) => investor);
      res.json(investorsWithoutPasswords);
    } catch (error) {
      console.error("Get investors error:", error);
      res.status(500).json({ message: "Failed to fetch investors" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", authorize(), async (req, res) => {
    try {
      const userRole = req.session.user?.role;
      
      // Managers and admins get company-wide statistics
      if (userRole === "manager" || userRole === "admin") {
        const stats = await storage.getCompanyStats();
        res.json(stats);
      } else {
        // Investors get personal statistics
        const stats = await storage.getDashboardStats(req.session.userId!);
        res.json(stats);
      }
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", authorize(), async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioData(req.session.userId!);
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

      const device = await storage.getGpsDeviceByTrailerId(trailerId);
      if (device) {
        await storage.updateGpsDevice(device.id, { lastPing: new Date() });
      }

      await storage.createTrackingData({
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
      const devices = await storage.getAllGpsDevices();
      res.json(devices);
    } catch (error) {
      console.error("GPS devices error:", error);
      res.status(500).json({ message: "Failed to fetch GPS devices" });
    }
  });

  app.get("/api/gps/devices/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const device = await storage.getGpsDeviceByTrailerId(req.params.trailerId);
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

      const existing = await storage.getGpsDeviceByTrailerId(validation.data.trailerId);
      if (existing) {
        return res.status(400).json({ message: "GPS device already exists for this trailer" });
      }

      const device = await storage.createGpsDevice(validation.data);

      await storage.createAuditLog({
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
      const device = await storage.updateGpsDevice(req.params.id, req.body);

      await storage.createAuditLog({
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
      await storage.deleteGpsDevice(req.params.id);

      await storage.createAuditLog({
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
        trailerId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        speed: (Math.random() * 80).toFixed(2),
        status: "active",
      });

      const device = await storage.getGpsDeviceByTrailerId(trailerId);
      if (device) {
        await storage.updateGpsDevice(device.id, { lastPing: new Date() });
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
      const clients = await storage.getAllRentalClients();
      res.json(clients);
    } catch (error) {
      console.error("Rental clients error:", error);
      res.status(500).json({ message: "Failed to fetch rental clients" });
    }
  });

  app.get("/api/rental-clients/:id", authorize(), async (req, res) => {
    try {
      const client = await storage.getRentalClient(req.params.id);
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

      const client = await storage.createRentalClient(validation.data);

      await storage.createAuditLog({
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
      const client = await storage.updateRentalClient(req.params.id, req.body);

      await storage.createAuditLog({
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
      await storage.deleteRentalClient(req.params.id);

      await storage.createAuditLog({
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
      const contracts = await storage.getAllRentalContracts();
      res.json(contracts);
    } catch (error) {
      console.error("Rental contracts error:", error);
      res.status(500).json({ message: "Failed to fetch rental contracts" });
    }
  });

  app.get("/api/rental-contracts/:id", authorize(), async (req, res) => {
    try {
      const contract = await storage.getRentalContract(req.params.id);
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
      const contracts = await storage.getContractsByClientId(req.params.clientId);
      res.json(contracts);
    } catch (error) {
      console.error("Client contracts error:", error);
      res.status(500).json({ message: "Failed to fetch client contracts" });
    }
  });

  app.get("/api/rental-contracts/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const contracts = await storage.getContractsByTrailerId(req.params.trailerId);
      res.json(contracts);
    } catch (error) {
      console.error("Trailer contracts error:", error);
      res.status(500).json({ message: "Failed to fetch trailer contracts" });
    }
  });

  app.post("/api/rental-contracts", authorize(), async (req, res) => {
    try {
      const validatedData = insertRentalContractSchema.parse(req.body);
      const contract = await storage.createRentalContract(validatedData);

      await storage.createAuditLog({
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
      const contract = await storage.updateRentalContract(req.params.id, validatedData);

      await storage.createAuditLog({
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

      const contract = await storage.terminateContract(req.params.id);

      await storage.createAuditLog({
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
      const invoices = await storage.getAllInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/overdue", authorize(), async (req, res) => {
    try {
      const invoices = await storage.getOverdueInvoices();
      res.json(invoices);
    } catch (error) {
      console.error("Get overdue invoices error:", error);
      res.status(500).json({ message: "Failed to fetch overdue invoices" });
    }
  });

  app.get("/api/invoices/contract/:contractId", authorize(), async (req, res) => {
    try {
      const invoices = await storage.getInvoicesByContractId(req.params.contractId);
      res.json(invoices);
    } catch (error) {
      console.error("Get invoices by contract error:", error);
      res.status(500).json({ message: "Failed to fetch invoices by contract" });
    }
  });

  app.get("/api/invoices/:id", authorize(), async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
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
      const validation = insertInvoiceSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const invoice = await storage.createInvoice(validation.data);

      await storage.createAuditLog({
        userId: req.session.userId!,
        action: "create",
        entityType: "invoice",
        entityId: invoice.id,
        details: validation.data,
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

      await storage.deleteInvoice(req.params.id);

      await storage.createAuditLog({
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

  // Checklist/Inspection routes (Manager/Admin only)
  app.get("/api/checklists/trailer/:trailerId", authorize(), async (req, res) => {
    try {
      const checklists = await storage.getChecklistsByTrailerId(req.params.trailerId);
      res.json(checklists);
    } catch (error) {
      console.error("Get checklists by trailer error:", error);
      res.status(500).json({ message: "Failed to fetch checklists by trailer" });
    }
  });

  app.get("/api/checklists/type/:type", authorize(), async (req, res) => {
    try {
      const checklists = await storage.getChecklistsByType(req.params.type);
      res.json(checklists);
    } catch (error) {
      console.error("Get checklists by type error:", error);
      res.status(500).json({ message: "Failed to fetch checklists by type" });
    }
  });

  app.get("/api/checklists/:id", authorize(), async (req, res) => {
    try {
      const checklist = await storage.getChecklist(req.params.id);
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

      const checklist = await storage.createChecklist(validation.data);

      await storage.createAuditLog({
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

      const checklist = await storage.updateChecklist(req.params.id, validation.data);

      await storage.createAuditLog({
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

  app.post("/api/checklists/:id/complete", authorize(), async (req, res) => {
    try {
      const completeSchema = z.object({
        approved: z.boolean(),
        notes: z.string().optional(),
      }).strict();

      const validation = completeSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          message: "Invalid payload", 
          errors: validation.error.errors 
        });
      }

      const checklist = await storage.completeChecklist(
        req.params.id,
        validation.data.approved,
        validation.data.notes
      );

      await storage.createAuditLog({
        userId: req.session.userId!,
        action: "complete",
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
      const trailers = await storage.getAllTrailers();
      const allSchedules = await Promise.all(
        trailers.map(async (trailer) => {
          return await storage.getMaintenanceSchedulesByTrailerId(trailer.id);
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
      const schedules = await storage.getMaintenanceSchedulesByTrailerId(req.params.trailerId);
      res.json(schedules);
    } catch (error) {
      console.error("Get maintenance schedules by trailer error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedules by trailer" });
    }
  });

  app.get("/api/maintenance/alerts", authorize(), async (req, res) => {
    try {
      const alerts = await storage.getMaintenanceAlerts();
      res.json(alerts);
    } catch (error) {
      console.error("Get maintenance alerts error:", error);
      res.status(500).json({ message: "Failed to fetch maintenance alerts" });
    }
  });

  app.get("/api/maintenance/:id", authorize(), async (req, res) => {
    try {
      const schedule = await storage.getMaintenanceSchedule(req.params.id);
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

      const schedule = await storage.createMaintenanceSchedule(data);

      await storage.createAuditLog({
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
      const existing = await storage.getMaintenanceSchedule(req.params.id);
      
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

      const schedule = await storage.updateMaintenanceSchedule(req.params.id, data);

      await storage.createAuditLog({
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
      const trailers = await storage.getAllTrailers();
      res.json(trailers);
    } catch (error) {
      console.error("Trailers error:", error);
      res.status(500).json({ message: "Failed to fetch trailers" });
    }
  });

  app.get("/api/trailers/available", authorize(), async (req, res) => {
    try {
      const trailers = await storage.getAvailableTrailers();
      res.json(trailers);
    } catch (error) {
      console.error("Available trailers error:", error);
      res.status(500).json({ message: "Failed to fetch available trailers" });
    }
  });

  app.get("/api/trailers/:id", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailer(req.params.id);
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
      const allTrailers = await storage.getAllTrailers();
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
      const trailer = await storage.createTrailer(validated);
      
      // If allocated to specific investor, create share automatically
      if (allocationType === "specific" && investorId) {
        await storage.createShare({
          userId: investorId,
          trailerId: trailer.id,
          purchaseValue: trailer.purchaseValue,
          purchaseDate: trailer.purchaseDate,
          status: "active",
          monthlyReturn: "2.00",
          totalReturns: "0.00",
        });
        
        // Update trailer status to active since share is sold
        await storage.updateTrailer(trailer.id, { status: "active" });
      }
      
      await storage.createAuditLog({
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
      const tracking = await storage.getAllLatestTracking();
      res.json(tracking);
    } catch (error) {
      console.error("Tracking error:", error);
      res.status(500).json({ message: "Failed to fetch tracking data" });
    }
  });

  app.get("/api/tracking/:trailerId/history", authorize(), async (req, res) => {
    try {
      const trailer = await storage.getTrailerByTrailerId(req.params.trailerId);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }
      const history = await storage.getTrackingHistory(trailer.id);
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
      
      const allShares = await storage.getAllShares();
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
      const result = await generateMonth(month);
      
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
      const documents = await storage.getDocumentsByUserId(req.session.userId!);
      res.json(documents);
    } catch (error) {
      console.error("Documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/audit-logs", authorize(), adminLimiter, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(50);
      res.json(logs);
    } catch (error) {
      console.error("Audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Shares routes
  app.get("/api/shares/all", authorize(), async (req, res) => {
    try {
      const sharesWithDetails = await storage.getAllSharesWithDetails();
      res.json(sharesWithDetails);
    } catch (error) {
      console.error("All shares error:", error);
      res.status(500).json({ message: "Failed to fetch all shares" });
    }
  });

  app.get("/api/shares", authorize(), async (req, res) => {
    try {
      const shares = await storage.getSharesByUserId(req.session.userId!);
      res.json(shares);
    } catch (error) {
      console.error("Shares error:", error);
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  app.get("/api/shares/:id", authorize(), checkOwnership(), async (req, res) => {
    try {
      const share = await storage.getShare(req.params.id);
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
      const trailer = await storage.getTrailer(req.body.trailerId);
      if (!trailer) {
        return res.status(404).json({ message: "Trailer not found" });
      }
      
      // Check if trailer is expired (not available for purchase)
      if (trailer.status === "expired") {
        return res.status(400).json({ message: "Trailer is expired and not available for purchase" });
      }
      
      // Check available shares for this trailer
      const existingShares = await storage.getSharesByTrailerId(req.body.trailerId);
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
        await storage.updateTrailer(req.body.trailerId, { status: "active" });
      }
      
      // Create audit log
      await storage.createAuditLog({
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
      const payments = await storage.getPaymentsByUserId(req.session.userId!);
      res.json(payments);
    } catch (error) {
      console.error("Payments error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:shareId", authorize(), checkOwnership(), async (req, res) => {
    try {
      const payments = await storage.getPaymentsByShareId(req.params.shareId);
      res.json(payments);
    } catch (error) {
      console.error("Payments by share error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  // Broker Dispatch routes
  app.get("/api/broker-dispatches", authorize(), isManager, async (req, res) => {
    try {
      const dispatches = await storage.getAllBrokerDispatches();
      
      await storage.createAuditLog({
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
      const dispatch = await storage.getBrokerDispatchById(req.params.id);
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
      const dispatches = await storage.getBrokerDispatchesByTrailer(req.params.trailerId);
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
      const allDispatches = await storage.getAllBrokerDispatches();
      const dispatchNumber = `DISPATCH-${String(allDispatches.length + 1).padStart(3, '0')}`;

      const dispatch = await storage.createBrokerDispatch({
        ...validation.data,
        dispatchNumber,
        createdBy: req.session.userId!,
      });

      await storage.createAuditLog({
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
      const existing = await storage.getBrokerDispatchById(req.params.id);
      if (!existing) {
        return res.status(404).json({ message: "Broker dispatch not found" });
      }

      const dispatch = await storage.updateBrokerDispatch(req.params.id, validation.data);

      await storage.createAuditLog({
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

  const httpServer = createServer(app);
  return httpServer;
}
