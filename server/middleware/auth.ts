import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { matchPolicy, type UserRole } from "../policies";

declare module 'express-session' {
  interface SessionData {
    userId: string;
    user?: {
      id: string;
      email: string;
      role: UserRole;
    };
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.session.userId);
      
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: "Forbidden: Insufficient permissions",
          required: allowedRoles,
          current: user.role
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  };
};

export const isManager = requireRole(["manager", "admin"]);

export const isAdmin = requireRole(["admin"]);

export const attachUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Attach user error:", error);
    next();
  }
};

export const authorize = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.user) {
        if (req.session.userId) {
          await storage.createAuditLog({
            userId: req.session.userId,
            action: "unauthorized_access",
            entityType: "route",
            entityId: req.path,
            details: { method: req.method, path: req.path },
            ipAddress: req.ip,
          });
        }
        return res.status(401).json({ message: "Unauthorized" });
      }

      const allowedRoles = matchPolicy(req.method, req.path);
      
      if (!allowedRoles) {
        return res.status(404).json({ message: "Not found" });
      }

      if (allowedRoles[0] === "*") {
        return next();
      }

      const roles = allowedRoles as readonly UserRole[];
      if (!roles.includes(req.session.user.role)) {
        await storage.createAuditLog({
          userId: req.session.user.id,
          action: "forbidden_access",
          entityType: "route",
          entityId: req.path,
          details: { 
            method: req.method, 
            path: req.path,
            required: allowedRoles,
            current: req.session.user.role 
          },
          ipAddress: req.ip,
        });
        
        return res.status(403).json({ 
          message: "Forbidden: Insufficient permissions",
          required: allowedRoles,
          current: req.session.user.role
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      res.status(500).json({ message: "Authorization failed" });
    }
  };
};

export const logAccess = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logEntry = {
        timestamp: new Date().toISOString(),
        userId: req.session.user?.id || req.session.userId || "anonymous",
        email: req.session.user?.email || "unknown",
        role: req.session.user?.role || "none",
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
      };
      
      if (res.statusCode >= 400) {
        console.error("❌ Access Error:", JSON.stringify(logEntry));
      } else {
        console.log("✅ Access:", JSON.stringify(logEntry));
      }
    });
    
    next();
  };
};

export const checkOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.session.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userRole = req.session.user.role;
      
      if (userRole === "manager" || userRole === "admin") {
        return next();
      }

      const shareId = req.params.id || req.params.shareId;
      const userId = req.session.user.id;

      if (req.path.includes("/shares/") && shareId) {
        const share = await storage.getShare(shareId);
        if (!share || share.userId !== userId) {
          await storage.createAuditLog({
            userId,
            action: "ownership_violation",
            entityType: "share",
            entityId: shareId,
            details: { 
              method: req.method, 
              path: req.path,
              attemptedAccess: shareId,
              actualOwner: share?.userId || "not_found"
            },
            ipAddress: req.ip,
          });
          return res.status(403).json({ message: "Forbidden: You can only access your own resources" });
        }
      }

      if (req.path.includes("/payments/") && shareId) {
        const share = await storage.getShare(shareId);
        if (!share || share.userId !== userId) {
          await storage.createAuditLog({
            userId,
            action: "ownership_violation",
            entityType: "payment",
            entityId: shareId,
            details: { 
              method: req.method, 
              path: req.path,
              attemptedAccess: shareId,
              actualOwner: share?.userId || "not_found"
            },
            ipAddress: req.ip,
          });
          return res.status(403).json({ message: "Forbidden: You can only access your own resources" });
        }
      }

      next();
    } catch (error) {
      console.error("Ownership check error:", error);
      res.status(500).json({ message: "Ownership check failed" });
    }
  };
};
