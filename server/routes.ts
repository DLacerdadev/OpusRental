import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { insertUserSchema, insertTrailerSchema, insertShareSchema } from "@shared/schema";
import session from "express-session";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "opus-rental-capital-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Auth middleware
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.session.userId) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
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

      req.session.userId = user.id;
      
      await storage.createAuditLog({
        userId: user.id,
        action: "login",
        entityType: "user",
        entityId: user.id,
        ipAddress: req.ip,
      });

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
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
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.session.userId!);
      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Portfolio routes
  app.get("/api/portfolio", isAuthenticated, async (req, res) => {
    try {
      const portfolio = await storage.getPortfolioData(req.session.userId!);
      res.json(portfolio);
    } catch (error) {
      console.error("Portfolio error:", error);
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  // Trailer/Asset routes
  app.get("/api/trailers", isAuthenticated, async (req, res) => {
    try {
      const trailers = await storage.getAllTrailers();
      res.json(trailers);
    } catch (error) {
      console.error("Trailers error:", error);
      res.status(500).json({ message: "Failed to fetch trailers" });
    }
  });

  app.get("/api/trailers/:id", isAuthenticated, async (req, res) => {
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

  app.post("/api/trailers", isAuthenticated, async (req, res) => {
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

  // Tracking routes
  app.get("/api/tracking", isAuthenticated, async (req, res) => {
    try {
      const tracking = await storage.getAllLatestTracking();
      res.json(tracking);
    } catch (error) {
      console.error("Tracking error:", error);
      res.status(500).json({ message: "Failed to fetch tracking data" });
    }
  });

  app.get("/api/tracking/:trailerId/history", isAuthenticated, async (req, res) => {
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

  // Financial routes
  app.get("/api/financial/records", isAuthenticated, async (req, res) => {
    try {
      const records = await storage.getAllFinancialRecords();
      res.json(records);
    } catch (error) {
      console.error("Financial records error:", error);
      res.status(500).json({ message: "Failed to fetch financial records" });
    }
  });

  app.get("/api/financial/current", isAuthenticated, async (req, res) => {
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

  // Compliance routes
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      const documents = await storage.getDocumentsByUserId(req.session.userId!);
      res.json(documents);
    } catch (error) {
      console.error("Documents error:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.get("/api/audit-logs", isAuthenticated, async (req, res) => {
    try {
      const logs = await storage.getRecentAuditLogs(50);
      res.json(logs);
    } catch (error) {
      console.error("Audit logs error:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // Shares routes
  app.get("/api/shares", isAuthenticated, async (req, res) => {
    try {
      console.log("[DEBUG] Fetching shares for userId:", req.session.userId);
      const shares = await storage.getSharesByUserId(req.session.userId!);
      console.log("[DEBUG] Found shares:", shares.length);
      res.json(shares);
    } catch (error) {
      console.error("Shares error:", error);
      res.status(500).json({ message: "Failed to fetch shares" });
    }
  });

  // Payments routes
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPaymentsByUserId(req.session.userId!);
      res.json(payments);
    } catch (error) {
      console.error("Payments error:", error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
