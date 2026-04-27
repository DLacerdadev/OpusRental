export type UserRole = "investor" | "manager" | "admin";

export const Policy = {
  "GET /api/auth/user": ["investor", "manager", "admin"],
  "POST /api/auth/login": ["*"],
  "POST /api/auth/logout": ["investor", "manager", "admin"],
  
  "GET /api/dashboard/stats": ["investor", "manager", "admin"],
  "GET /api/portfolio": ["investor"],
  
  "GET /api/investors": ["manager", "admin"],
  
  "GET /api/trailers": ["manager", "admin"],
  "GET /api/trailers/available": ["investor", "manager", "admin"],
  "GET /api/trailers/:id": ["manager", "admin"],
  "POST /api/trailers": ["manager", "admin"],
  
  "GET /api/tracking": ["manager", "admin"],
  "GET /api/tracking/:trailerId/history": ["manager", "admin"],
  
  "GET /api/financial/records": ["manager", "admin"],
  "GET /api/financial/current": ["manager", "admin"],
  "POST /api/financial/generate/:month": ["manager", "admin"],
  
  "GET /api/documents": ["investor", "manager", "admin"],
  
  "GET /api/audit-logs": ["manager", "admin"],
  "GET /api/email-logs": ["manager", "admin"],
  "GET /api/system/status": ["manager", "admin"],
  
  "GET /api/shares/all": ["manager", "admin"],
  "GET /api/shares": ["investor", "manager", "admin"],
  "GET /api/shares/:id": ["investor", "manager", "admin"],
  "POST /api/shares": ["investor", "manager", "admin"],
  
  "GET /api/payments": ["investor", "manager", "admin"],
  "GET /api/payments/:shareId": ["investor", "manager", "admin"],
  "POST /api/payments": ["manager", "admin"],

  "GET /api/whatsapp/logs": ["manager", "admin"],
  "POST /api/whatsapp/test": ["admin"],

  "POST /api/rental-contracts/:id/generate-invoice": ["manager", "admin"],
} as const;

export type PolicyKey = keyof typeof Policy;

const STRICT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function matchPolicy(method: string, path: string): readonly UserRole[] | readonly ["*"] | undefined {
  // First pass: normalize any strict UUID segment (8-4-4-4-12 hex) that is
  // NOT the final segment to ":id". This handles routes like
  // POST /api/rental-contracts/:id/generate-invoice where the param sits in
  // the middle of the path. We deliberately skip the last segment so the
  // existing special-case logic below can still map it to ":shareId" /
  // ":trailerId" / ":month" / ":id" as appropriate.
  const segments = path.split("/");
  const uuidNormalized = segments
    .map((seg, idx) => (idx < segments.length - 1 && STRICT_UUID.test(seg) ? ":id" : seg))
    .join("/");

  // Second pass: original last-segment normalization preserved verbatim for
  // ":trailerId" / ":shareId" / ":month" / ":id" handling.
  const normalizedPath = uuidNormalized.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    const trailerIdPattern = /^\/[A-Z0-9-]+$/;
    const monthPattern = /^\/\d{4}-\d{2}$/;
    
    if (uuidNormalized.includes('/generate/') && monthPattern.test(match)) {
      return "/:month";
    }
    if (uuidNormalized.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (uuidNormalized.includes('/tracking/') && trailerIdPattern.test(match)) {
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
