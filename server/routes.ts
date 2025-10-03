import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertTrailerSchema, insertShareSchema, financialRecords } from "@shared/schema";
import session from "express-session";
import { isAuthenticated, isManager, requireRole, authorize, checkOwnership, logAccess } from "./middleware/auth";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { db } from "./db";
import { sql } from "drizzle-orm";

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
      
      const user = await storage.getUserByEmail(email);
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
      const validated = insertTrailerSchema.parse(req.body);
      const trailer = await storage.createTrailer(validated);
      
      await storage.createAuditLog({
        userId: req.session.userId!,
        action: "create_trailer",
        entityType: "trailer",
        entityId: trailer.id,
        details: validated,
        ipAddress: req.ip,
      });
      
      res.json(trailer);
    } catch (error) {
      console.error("Create trailer error:", error);
      res.status(500).json({ message: "Failed to create trailer" });
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

  const httpServer = createServer(app);
  return httpServer;
}
