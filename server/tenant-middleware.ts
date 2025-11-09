import { Request, Response, NextFunction } from "express";
import { db } from "./db";
import { tenants } from "@shared/schema";
import { eq, or } from "drizzle-orm";

// Extend Express Request type to include tenant context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: typeof tenants.$inferSelect;
    }
  }
}

/**
 * Tenant Context Middleware
 * Detects current tenant from:
 * 1. Custom domain (e.g., app.opusrental.com)
 * 2. Subdomain (e.g., opus-rental.domain.com)
 * 3. X-Tenant-ID header (for API clients)
 * 4. Session user tenantId (for authenticated users)
 * 
 * Injects tenant into req.tenantId and req.tenant
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    let tenant: typeof tenants.$inferSelect | undefined;

    // 1. Try to detect tenant from X-Tenant-ID header (for API clients)
    const tenantIdHeader = req.headers["x-tenant-id"] as string | undefined;
    if (tenantIdHeader) {
      const [foundTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.id, tenantIdHeader))
        .limit(1);
      if (foundTenant) {
        tenant = foundTenant;
      }
    }

    // 2. Try to detect tenant from domain/subdomain
    if (!tenant) {
      const host = req.headers.host || "";
      const domain = host.split(":")[0]; // Remove port if present

      // Check for custom domain or subdomain
      const [foundTenant] = await db
        .select()
        .from(tenants)
        .where(
          or(
            eq(tenants.domain, domain),
            eq(tenants.slug, domain.split(".")[0])
          )
        )
        .limit(1);
      
      if (foundTenant) {
        tenant = foundTenant;
      }
    }

    // 3. Try to get tenant from authenticated user's session
    if (!tenant && req.user) {
      const userId = (req.user as any).id;
      if (userId) {
        // User's tenantId will be used (already in user object from auth middleware)
        const userTenantId = (req.user as any).tenantId;
        if (userTenantId) {
          const [foundTenant] = await db
            .select()
            .from(tenants)
            .where(eq(tenants.id, userTenantId))
            .limit(1);
          if (foundTenant) {
            tenant = foundTenant;
          }
        }
      }
    }

    // 4. Fallback to default tenant for development
    if (!tenant && process.env.NODE_ENV !== "production") {
      const [defaultTenant] = await db
        .select()
        .from(tenants)
        .where(eq(tenants.slug, "opus-rental"))
        .limit(1);
      if (defaultTenant) {
        tenant = defaultTenant;
      }
    }

    // SECURITY: Validate tenant matches session for authenticated users
    // Prevent cross-tenant access via header/domain spoofing
    if (tenant && req.session && req.session.tenantId) {
      if (tenant.id !== req.session.tenantId) {
        console.error("Security: Tenant mismatch detected", {
          userId: req.session.userId,
          sessionTenantId: req.session.tenantId,
          requestTenantId: tenant.id,
          path: req.path,
          method: req.method,
          ip: req.ip,
        });
        return res.status(403).json({
          error: "Tenant mismatch: Your session belongs to a different tenant",
          message: "Please log out and log in to the correct tenant",
        });
      }
    }

    // Validate tenant status
    if (tenant) {
      if (tenant.status !== "active") {
        return res.status(403).json({
          error: "Tenant account is suspended or cancelled",
          status: tenant.status,
        });
      }

      // Inject tenant context into request
      req.tenantId = tenant.id;
      req.tenant = tenant;
    } else {
      // No tenant found - only allow public routes
      const publicPaths = ["/", "/login", "/register", "/api/auth"];
      const isPublic = publicPaths.some(path => req.path.startsWith(path));
      
      if (!isPublic) {
        return res.status(400).json({
          error: "Unable to determine tenant. Please provide a valid domain or tenant ID.",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Error in tenant middleware:", error);
    return res.status(500).json({
      error: "Internal server error while resolving tenant",
    });
  }
}

/**
 * Middleware to require tenant context
 * Use this after tenantMiddleware on protected routes
 */
export function requireTenant(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.tenantId || !req.tenant) {
    return res.status(400).json({
      error: "Tenant context is required for this operation",
    });
  }
  next();
}
