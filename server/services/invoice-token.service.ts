import crypto from "crypto";

/**
 * Stateless signed token for public invoice payment links.
 *
 * Format: <base64url(invoiceId)>.<base64url(hmac_sha256(invoiceId, secret))>
 *
 * The token does not encode an expiry — invoice payability is always
 * re-validated server-side against the invoice status (open/overdue) and the
 * tenant context derived from the invoice itself. The signature only proves
 * the invoiceId came from us; the server is the source of truth for what is
 * payable.
 */
const SECRET_ENV = "SESSION_SECRET";

function getSecret(): string {
  const secret = process.env[SECRET_ENV];
  if (!secret) {
    throw new Error(
      `Cannot sign invoice token: ${SECRET_ENV} is not configured`,
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/") + pad, "base64");
}

function sign(invoiceId: string): string {
  return b64url(
    crypto.createHmac("sha256", getSecret()).update(invoiceId).digest(),
  );
}

export function signInvoiceToken(invoiceId: string): string {
  if (!invoiceId) throw new Error("invoiceId is required");
  const idPart = b64url(Buffer.from(invoiceId, "utf8"));
  const sigPart = sign(invoiceId);
  return `${idPart}.${sigPart}`;
}

export function verifyInvoiceToken(token: string): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  let invoiceId: string;
  try {
    invoiceId = fromB64url(parts[0]).toString("utf8");
  } catch {
    return null;
  }
  if (!invoiceId) return null;
  const expected = sign(invoiceId);
  const a = Buffer.from(parts[1]);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!crypto.timingSafeEqual(a, b)) return null;
  return invoiceId;
}

/**
 * Build the absolute URL where a client can pay an invoice without logging
 * in. Honours APP_PUBLIC_URL when set, otherwise falls back to
 * REPLIT_DEV_DOMAIN, otherwise to a relative path. Always returns a path
 * that the frontend `/pay/:token` route knows how to render.
 */
export function buildPublicPaymentUrl(invoiceId: string): string {
  const token = signInvoiceToken(invoiceId);
  const path = `/pay/${token}`;

  const explicit = process.env.APP_PUBLIC_URL?.trim();
  if (explicit) {
    return `${explicit.replace(/\/$/, "")}${path}`;
  }

  const replitDomain = process.env.REPLIT_DEV_DOMAIN?.trim();
  if (replitDomain) {
    return `https://${replitDomain.replace(/\/$/, "")}${path}`;
  }

  return path;
}
