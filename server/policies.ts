export type UserRole = "investor" | "manager" | "admin";

export const Policy = {
  // ===== Auth & Session =====
  "GET /api/auth/user": ["investor", "manager", "admin"],
  "POST /api/auth/login": ["*"],
  "POST /api/auth/logout": ["investor", "manager", "admin"],
  "POST /api/auth/register": ["*"],

  // ===== Health =====
  "GET /api/health": ["*"],

  // ===== Tenant =====
  "GET /api/tenant": ["investor", "manager", "admin"],
  "GET /api/tenant/billing": ["manager", "admin"],
  "PUT /api/tenant": ["admin"],

  // ===== Admin Users =====
  "GET /api/admin/users": ["admin"],
  "POST /api/admin/users": ["admin"],
  "PATCH /api/admin/users/:id": ["admin"],
  "POST /api/admin/users/:id/reset-password": ["admin"],
  "DELETE /api/admin/users/:id": ["admin"],

  // ===== Dashboard / Investors / Portfolio =====
  "GET /api/dashboard/stats": ["investor", "manager", "admin"],
  "GET /api/portfolio": ["investor"],
  "GET /api/investors": ["manager", "admin"],

  // ===== Analytics =====
  "GET /api/analytics/revenue-trend": ["manager", "admin"],
  "GET /api/analytics/trailer-roi": ["manager", "admin"],
  "GET /api/analytics/performance-comparison": ["manager", "admin"],
  "GET /api/analytics/revenue-forecast": ["manager", "admin"],

  // ===== Notifications =====
  "GET /api/notifications": ["investor", "manager", "admin"],
  "GET /api/notifications/unread-count": ["investor", "manager", "admin"],
  "PATCH /api/notifications/:id/read": ["investor", "manager", "admin"],
  "DELETE /api/notifications/:id": ["investor", "manager", "admin"],

  // ===== Trailers =====
  "GET /api/trailers": ["manager", "admin"],
  "GET /api/trailers/available": ["investor", "manager", "admin"],
  "GET /api/trailers/:id": ["manager", "admin"],
  "POST /api/trailers": ["manager", "admin"],

  // ===== GPS =====
  "POST /api/gps/webhook": ["*"],
  "GET /api/gps/devices": ["manager", "admin"],
  "GET /api/gps/devices/trailer/:trailerId": ["manager", "admin"],
  "GET /api/gps/devices/trailer/:id": ["manager", "admin"],
  "POST /api/gps/devices": ["manager", "admin"],
  "PUT /api/gps/devices/:id": ["manager", "admin"],
  "DELETE /api/gps/devices/:id": ["manager", "admin"],
  "POST /api/gps/simulate": ["manager", "admin"],

  // ===== Tracking =====
  "GET /api/tracking": ["manager", "admin"],
  "GET /api/tracking/:trailerId/history": ["manager", "admin"],
  "GET /api/tracking/:id/history": ["manager", "admin"],

  // ===== Rental Clients =====
  "GET /api/rental-clients": ["manager", "admin"],
  "GET /api/rental-clients/:id": ["manager", "admin"],
  "POST /api/rental-clients": ["manager", "admin"],
  "PUT /api/rental-clients/:id": ["manager", "admin"],
  "DELETE /api/rental-clients/:id": ["manager", "admin"],

  // ===== Rental Contracts =====
  "GET /api/rental-contracts": ["manager", "admin"],
  "GET /api/rental-contracts/:id": ["manager", "admin"],
  "GET /api/rental-contracts/client/:id": ["manager", "admin"],
  "GET /api/rental-contracts/trailer/:trailerId": ["manager", "admin"],
  "GET /api/rental-contracts/trailer/:id": ["manager", "admin"],
  "POST /api/rental-contracts": ["manager", "admin"],
  "PUT /api/rental-contracts/:id": ["manager", "admin"],
  "POST /api/rental-contracts/:id/generate-invoice": ["manager", "admin"],
  "POST /api/rental-contracts/:id/terminate": ["manager", "admin"],
  "POST /api/rental-contracts/:id/generate-pdf": ["manager", "admin"],

  // ===== Invoices =====
  "GET /api/invoices": ["manager", "admin"],
  "GET /api/invoices/overdue": ["manager", "admin"],
  "GET /api/invoices/contract/:id": ["manager", "admin"],
  "GET /api/invoices/:id": ["manager", "admin"],
  "POST /api/invoices": ["manager", "admin"],
  "PUT /api/invoices/:id/status": ["manager", "admin"],
  "DELETE /api/invoices/:id": ["manager", "admin"],
  "POST /api/invoices/:id/reissue": ["manager", "admin"],
  "POST /api/invoices/generate-monthly": ["manager", "admin"],
  "POST /api/invoices/check-overdue": ["manager", "admin"],
  "GET /api/invoices/:id/data": ["manager", "admin"],
  "GET /api/invoices/:id/items": ["manager", "admin"],
  "POST /api/invoices/:id/items": ["manager", "admin"],
  "PUT /api/invoices/:id/items/:id": ["manager", "admin"],
  "DELETE /api/invoices/:id/items/:id": ["manager", "admin"],
  "GET /api/invoices/:id/payment-methods": ["investor", "manager", "admin"],
  "POST /api/invoices/:id/generate-pdf": ["manager", "admin"],

  // ===== Checklists =====
  "GET /api/checklists/trailer/:trailerId": ["manager", "admin"],
  "GET /api/checklists/trailer/:id": ["manager", "admin"],
  "GET /api/checklists/type/:type": ["manager", "admin"],
  "GET /api/checklists/:id": ["manager", "admin"],
  "POST /api/checklists": ["manager", "admin"],
  "PUT /api/checklists/:id": ["manager", "admin"],
  "POST /api/checklists/:id/generate-pdf": ["manager", "admin"],
  "POST /api/checklists/:id/complete": ["manager", "admin"],

  // ===== Maintenance =====
  "GET /api/maintenance": ["manager", "admin"],
  "GET /api/maintenance/trailer/:trailerId": ["manager", "admin"],
  "GET /api/maintenance/trailer/:id": ["manager", "admin"],
  "GET /api/maintenance/alerts": ["manager", "admin"],
  "GET /api/maintenance/:id": ["manager", "admin"],
  "POST /api/maintenance": ["manager", "admin"],
  "PUT /api/maintenance/:id": ["manager", "admin"],
  "POST /api/maintenance/:id/complete": ["manager", "admin"],

  // ===== Broker Dispatches =====
  "GET /api/broker-dispatches": ["manager", "admin"],
  "GET /api/broker-dispatches/:id": ["manager", "admin"],
  "GET /api/broker-dispatches/trailer/:trailerId": ["manager", "admin"],
  "GET /api/broker-dispatches/trailer/:id": ["manager", "admin"],
  "POST /api/broker-dispatches": ["manager", "admin"],
  "PUT /api/broker-dispatches/:id": ["manager", "admin"],
  "POST /api/broker-dispatches/:id/generate-pdf": ["manager", "admin"],

  // ===== Financial =====
  "GET /api/financial/records": ["manager", "admin"],
  "GET /api/financial/current": ["manager", "admin"],
  "POST /api/financial/generate/:month": ["manager", "admin"],
  "POST /api/financial/report/:month/generate-pdf": ["manager", "admin"],

  // ===== Documents / Audit / Email Logs / System =====
  "GET /api/documents": ["investor", "manager", "admin"],
  "GET /api/audit-logs": ["manager", "admin"],
  "GET /api/email-logs": ["manager", "admin"],
  "GET /api/system/status": ["manager", "admin"],

  // ===== Monitoring =====
  "GET /api/monitoring/logs": ["admin"],
  "GET /api/monitoring/suspicious": ["admin"],
  "GET /api/monitoring/statistics": ["admin"],
  "GET /api/monitoring/filter-options": ["admin"],

  // ===== Shares =====
  "GET /api/shares/all": ["manager", "admin"],
  "GET /api/shares": ["investor", "manager", "admin"],
  "GET /api/shares/:id": ["investor", "manager", "admin"],
  "POST /api/shares": ["investor", "manager", "admin"],

  // ===== Payments =====
  "GET /api/payments": ["investor", "manager", "admin"],
  "GET /api/payments/:shareId": ["investor", "manager", "admin"],
  "GET /api/payments/:id": ["investor", "manager", "admin"],
  "POST /api/payments": ["manager", "admin"],

  // ===== Stripe =====
  "POST /api/stripe/create-share-payment": ["investor", "manager", "admin"],
  "POST /api/stripe/create-invoice-payment": ["investor", "manager", "admin"],
  "POST /api/stripe/webhook": ["*"],
  "GET /api/stripe/payment-status/:id": ["investor", "manager", "admin"],

  // ===== Export / Import =====
  "GET /api/export/trailers": ["manager", "admin"],
  "GET /api/export/invoices": ["manager", "admin"],
  "GET /api/export/shares": ["manager", "admin"],
  "GET /api/export/clients": ["manager", "admin"],
  "GET /api/export/financial-report": ["manager", "admin"],
  "GET /api/import/templates/trailers": ["manager", "admin"],
  "GET /api/import/templates/clients": ["manager", "admin"],
  "POST /api/import/trailers": ["manager", "admin"],
  "POST /api/import/clients": ["manager", "admin"],

  // ===== WhatsApp =====
  "GET /api/whatsapp/logs": ["manager", "admin"],
  "POST /api/whatsapp/test": ["admin"],
} as const;

export type PolicyKey = keyof typeof Policy;

const STRICT_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MONTH_PATTERN = /^\d{4}-\d{2}$/;

export function matchPolicy(method: string, path: string): readonly UserRole[] | readonly ["*"] | undefined {
  // First pass: normalize any non-final segment that is a strict UUID (8-4-4-4-12 hex)
  // to ":id", or a YYYY-MM month string to ":month". This handles routes where the
  // dynamic param sits in the middle of the path (e.g. POST /api/rental-contracts/:id/generate-invoice
  // or POST /api/financial/report/:month/generate-pdf). The final segment is left
  // untouched so the existing special-case logic below can still map it to
  // ":shareId" / ":trailerId" / ":month" / ":id" as appropriate.
  const segments = path.split("/");
  const middleNormalized = segments
    .map((seg, idx) => {
      if (idx >= segments.length - 1) return seg;
      if (STRICT_UUID.test(seg)) return ":id";
      if (MONTH_PATTERN.test(seg)) return ":month";
      return seg;
    })
    .join("/");

  // Second pass: original last-segment normalization preserved verbatim for
  // ":trailerId" / ":shareId" / ":month" / ":id" handling.
  const normalizedPath = middleNormalized.replace(/\/[^/]+$/, (match) => {
    const uuidPattern = /^\/[0-9a-f-]+$/i;
    const trailerIdPattern = /^\/[A-Z0-9-]+$/;
    const monthPattern = /^\/\d{4}-\d{2}$/;

    if (middleNormalized.includes('/generate/') && monthPattern.test(match)) {
      return "/:month";
    }
    if (middleNormalized.includes('/payments/') && uuidPattern.test(match)) {
      return "/:shareId";
    }
    if (middleNormalized.includes('/tracking/') && trailerIdPattern.test(match)) {
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
