import { type Request, type Response, type NextFunction } from "express";
import { storage } from "../storage";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

const JWT_SECRET = process.env.SESSION_SECRET || "opus-rental-capital-secret-key";

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

export const isManager = requireRole(["manager", "admin"]);
export const isAdmin = requireRole(["admin"]);

export const authorize = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId || !req.userRole) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const allowedRoles = permissionsMap[req.method as keyof typeof permissionsMap]?.[req.path];
      if (!allowedRoles) {
        return res.status(403).json({ message: "Forbidden" });
      }

      if (!allowedRoles.includes(user.role)) {
        await storage.createAuditLog({
          userId: user.id,
          action: "access_denied",
          entityType: "permission",
          entityId: req.path,
          details: { role: user.role, requiredRoles: allowedRoles },
          ipAddress: req.ip,
        });
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

export const checkOwnership = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (user.role === "admin" || user.role === "manager") {
        return next();
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return res.status(400).json({ message: "Resource ID required" });
      }

      let isOwner = false;
      if (req.path.includes("/shares")) {
        const share = await storage.getShareById(resourceId);
        isOwner = share?.userId === user.id;
      } else if (req.path.includes("/payments")) {
        const payment = await storage.getPaymentById(resourceId);
        const share = payment?.shareId ? await storage.getShareById(payment.shareId) : null;
        isOwner = share?.userId === user.id;
      }

      if (!isOwner) {
        await storage.createAuditLog({
          userId: user.id,
          action: "unauthorized_access",
          entityType: "resource",
          entityId: resourceId,
          details: { path: req.path, method: req.method },
          ipAddress: req.ip,
        });
        return res.status(403).json({ message: "Forbidden" });
      }

      next();
    } catch (error) {
      res.status(500).json({ message: "Authorization error" });
    }
  };
};

export const logAccess = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      const userId = req.userId || "anonymous";
      const userRole = req.userRole || "none";

      if (req.path.startsWith("/api/")) {
        const logEntry: any = {
          timestamp: new Date().toISOString(),
          userId,
          email: "unknown",
          role: userRole,
          method: req.method,
          path: req.path,
          status: res.statusCode,
          duration: `${Date.now() - (req as any).startTime}ms`,
          ip: req.ip,
        };

        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log("✅ Access:", JSON.stringify(logEntry));
        } else if (res.statusCode >= 400) {
          console.log("❌ Access Error:", JSON.stringify(logEntry));
        }
      }

      return originalJson(body);
    };

    (req as any).startTime = Date.now();
    next();
  };
};

const permissionsMap = {
  GET: {
    "/api/users": ["admin", "manager"],
    "/api/trailers": ["admin", "manager", "investor"],
    "/api/shares": ["admin", "manager", "investor"],
    "/api/payments": ["admin", "manager", "investor"],
  },
  POST: {
    "/api/users": ["admin"],
    "/api/trailers": ["admin", "manager"],
    "/api/shares": ["admin", "manager"],
    "/api/payments": ["admin", "manager"],
  },
  PUT: {
    "/api/users/:id": ["admin"],
    "/api/trailers/:id": ["admin", "manager"],
    "/api/shares/:id": ["admin", "manager"],
    "/api/payments/:id": ["admin", "manager"],
  },
  DELETE: {
    "/api/users/:id": ["admin"],
    "/api/trailers/:id": ["admin"],
    "/api/shares/:id": ["admin", "manager"],
    "/api/payments/:id": ["admin", "manager"],
  },
};
