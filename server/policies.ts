export type UserRole = "investor" | "manager" | "admin";

export const Policy = {
  "GET /api/auth/user": ["investor", "manager", "admin"],
  "POST /api/auth/login": ["*"],
  "POST /api/auth/logout": ["investor", "manager", "admin"],
  
  "GET /api/dashboard/stats": ["investor", "manager", "admin"],
  "GET /api/portfolio": ["investor"],
  
  "GET /api/trailers": ["manager", "admin"],
  "GET /api/trailers/:id": ["manager", "admin"],
  "POST /api/trailers": ["manager", "admin"],
  
  "GET /api/tracking": ["manager", "admin"],
  "GET /api/tracking/:trailerId/history": ["manager", "admin"],
  
  "GET /api/financial/records": ["manager", "admin"],
  "GET /api/financial/current": ["manager", "admin"],
  "POST /api/financial/generate/:month": ["manager", "admin"],
  
  "GET /api/documents": ["investor", "manager", "admin"],
  
  "GET /api/audit-logs": ["manager", "admin"],
  
  "GET /api/shares/all": ["manager", "admin"],
  "GET /api/shares": ["investor", "manager", "admin"],
  "GET /api/shares/:id": ["investor", "manager", "admin"],
  "POST /api/shares": ["manager", "admin"],
  
  "GET /api/payments": ["investor", "manager", "admin"],
  "GET /api/payments/:shareId": ["investor", "manager", "admin"],
  "POST /api/payments": ["manager", "admin"],
} as const;

export type PolicyKey = keyof typeof Policy;

export function matchPolicy(method: string, path: string): readonly UserRole[] | readonly ["*"] | undefined {
  const normalizedPath = path.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    const trailerIdPattern = /^\/[A-Z0-9-]+$/;
    const monthPattern = /^\/\d{4}-\d{2}$/;
    
    if (path.includes('/generate/') && monthPattern.test(match)) {
      return "/:month";
    }
    if (path.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (path.includes('/tracking/') && trailerIdPattern.test(match)) {
      return "/:trailerId";
    }
    if (uuidPattern.test(match)) {
      return "/:id";
    }
    if (trailerIdPattern.test(match)) {
      return "/:trailerId";
    }
    return match;
  });
  
  const key = `${method} ${normalizedPath}` as PolicyKey;
  return Policy[key];
}

export const OwnershipRoutes = new Set([
  "GET /api/shares/:id",
  "GET /api/payments/:shareId",
  "GET /api/documents",
]);

export function requiresOwnershipCheck(method: string, path: string): boolean {
  const normalizedPath = path.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    
    if (path.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (uuidPattern.test(match)) {
      return "/:id";
    }
    return match;
  });
  
  const key = `${method} ${normalizedPath}`;
  return OwnershipRoutes.has(key);
}
