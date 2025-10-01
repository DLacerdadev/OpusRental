import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

declare module 'express-session' {
  interface SessionData {
    userId: string;
  }
}

export interface AuthRequest extends Request {
  session: {
    userId?: string;
    destroy: (callback: (err?: any) => void) => void;
  };
  user?: any;
}

export const isAuthenticated = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
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

export const attachUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
