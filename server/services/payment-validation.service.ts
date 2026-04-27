import type { Invoice } from "@shared/schema";

export type PaymentSource = "stripe" | "manual";

export type PaymentRejectionReason =
  | "amount_mismatch"
  | "invalid_status";

export interface PaymentValidationDetails {
  expectedAmountCents: number;
  receivedAmountCents: number;
  invoiceStatus: string;
  source: PaymentSource;
}

export type PaymentValidationResult =
  | { valid: true; details: PaymentValidationDetails }
  | {
      valid: false;
      reason: PaymentRejectionReason;
      details: PaymentValidationDetails;
    };

export const ACCEPTABLE_INVOICE_STATUSES_FOR_PAYMENT: ReadonlySet<string> =
  new Set(["pending", "overdue", "reissued"]);

export const PAYMENT_AMOUNT_TOLERANCE_CENTS = 1;

export function invoiceAmountToCents(amount: string | number): number {
  const numeric = typeof amount === "number" ? amount : parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100);
}

export function validateInvoicePayment(
  invoice: Pick<Invoice, "amount" | "status">,
  receivedAmountCents: number,
  source: PaymentSource,
): PaymentValidationResult {
  const expectedAmountCents = invoiceAmountToCents(invoice.amount);
  const details: PaymentValidationDetails = {
    expectedAmountCents,
    receivedAmountCents,
    invoiceStatus: invoice.status,
    source,
  };

  if (!ACCEPTABLE_INVOICE_STATUSES_FOR_PAYMENT.has(invoice.status)) {
    return { valid: false, reason: "invalid_status", details };
  }

  const diff = Math.abs(expectedAmountCents - receivedAmountCents);
  if (diff > PAYMENT_AMOUNT_TOLERANCE_CENTS) {
    return { valid: false, reason: "amount_mismatch", details };
  }

  return { valid: true, details };
}
