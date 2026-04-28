import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Invoice, RentalClient, RentalContract, InsertEmailLog, Tenant } from "@shared/schema";
import { buildPublicPaymentUrl } from "./invoice-token.service";

/**
 * Tenant fields needed by the e-mail templates. Includes the brand name,
 * the white-label billing email (used as the From address override) and the
 * ACH bank-transfer payment configuration so the HTML body can render the
 * "Other ways to pay" block alongside the public payment button. All payment
 * fields are optional; when missing the template silently omits the block
 * instead of breaking.
 *
 * Note: `bankAgency` is reused semantically as the ACH routing number.
 */
export type EmailTenant = Pick<
  Tenant,
  | "name"
  | "billingEmail"
  | "bankName"
  | "bankAgency"
  | "bankAccount"
  | "bankAccountHolder"
  | "bankAccountType"
>;

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  /**
   * Optional From address override (e.g. tenant `billingEmail`). When set,
   * the message is sent from this address and Reply-To is set to it as well
   * so customer replies reach the tenant inbox even if the SMTP provider
   * forces the envelope From back to the platform domain (DMARC alignment).
   */
  fromAddress?: string;
  attachments?: EmailAttachment[];
}

export interface InvoiceEmailData {
  invoice: Invoice;
  contract: RentalContract;
  client: RentalClient;
  /** Tenant the invoice belongs to. Used to render branded emails. */
  tenant?: EmailTenant | null;
  /** Optional PDF (or other) attachments to include in the email. */
  attachments?: EmailAttachment[];
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Build the HTML block listing the tenant's ACH bank-transfer details.
 * Returns an empty string when nothing is configured so the template skips
 * the section instead of showing an empty box. Only fields that the tenant
 * filled in are rendered — partial configurations are supported.
 *
 * `bankAgency` is reused semantically as the ACH routing number.
 */
function renderPaymentMethodsBlock(tenant?: EmailTenant | null): string {
  if (!tenant) return "";
  const bankName = tenant.bankName?.trim();
  const bankAccount = tenant.bankAccount?.trim();
  if (!(bankName && bankAccount)) return "";

  const routing = tenant.bankAgency?.trim();
  const holder = tenant.bankAccountHolder?.trim();
  const accountType = tenant.bankAccountType?.trim();
  const accountTypeLabel =
    accountType === "checking" ? "Checking" : accountType === "savings" ? "Savings" : accountType;

  const section = `
        <div>
          <p style="margin:0 0 6px 0;font-weight:bold;color:#111">Bank Transfer (ACH)</p>
          <p style="margin:2px 0;font-size:13px"><span style="color:#666">Bank:</span> ${escapeHtml(bankName)}</p>
          ${routing ? `<p style="margin:2px 0;font-size:13px"><span style="color:#666">Routing Number:</span> ${escapeHtml(routing)}</p>` : ""}
          <p style="margin:2px 0;font-size:13px"><span style="color:#666">Account:</span> ${escapeHtml(bankAccount)}</p>
          ${holder ? `<p style="margin:2px 0;font-size:13px"><span style="color:#666">Account Holder:</span> ${escapeHtml(holder)}</p>` : ""}
          ${accountTypeLabel ? `<p style="margin:2px 0;font-size:13px"><span style="color:#666">Type:</span> ${escapeHtml(accountTypeLabel)}</p>` : ""}
        </div>`;

  return `
      <div style="background:white;padding:20px;margin:20px 0;border-radius:8px;border-left:4px solid #16a34a">
        <h3 style="margin:0 0 12px 0;font-size:16px;color:#111">Other ways to pay</h3>
        ${section}
      </div>`;
}

function formatUSD(amount: string | number): string {
  const n = typeof amount === "number" ? amount : parseFloat(amount);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function formatRate(rate: string | number | null | undefined): string {
  if (rate == null) return "0";
  const n = typeof rate === "number" ? rate : parseFloat(rate);
  if (!Number.isFinite(n)) return "0";
  return n
    .toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

/**
 * Render the Subtotal / Sales Tax / Total breakdown rows that appear at the
 * bottom of every invoice email. When the invoice has a stored subtotal we
 * always show the three rows, even if Sales Tax = $0.00, so the customer can
 * verify the math. Legacy invoices that were created before this change have
 * `subtotal == null` — in that case we fall back to a single "Amount due" row.
 *
 * @param amountClass CSS class to apply to the bold "Total / Amount due"
 *                    line so the colour matches the surrounding template.
 */
function renderInvoiceTotalsRows(
  invoice: Invoice,
  amountClass: string,
): string {
  const total = formatUSD(invoice.amount);
  if (invoice.subtotal == null) {
    return `
        <div class="detail-row">
          <span class="label">Amount due:</span>
          <span class="${amountClass}">${total}</span>
        </div>`;
  }
  const subtotal = formatUSD(invoice.subtotal);
  const taxAmount = formatUSD(invoice.salesTaxAmount ?? "0");
  const ratePct = formatRate(invoice.salesTaxRate);
  return `
        <div class="detail-row">
          <span class="label">Subtotal:</span>
          <span class="value">${subtotal}</span>
        </div>
        <div class="detail-row">
          <span class="label">Sales Tax (${ratePct}%):</span>
          <span class="value">${taxAmount}</span>
        </div>
        <div class="detail-row">
          <span class="label">Total:</span>
          <span class="${amountClass}">${total}</span>
        </div>`;
}

/**
 * Plaintext counterpart of {@link renderInvoiceTotalsRows} used in the
 * `text` body of every invoice email. Mirrors the HTML breakdown so that
 * mail clients without HTML support still see the same numbers.
 */
function renderInvoiceTotalsText(invoice: Invoice): string {
  const total = formatUSD(invoice.amount);
  if (invoice.subtotal == null) {
    return `Amount: ${total}`;
  }
  const subtotal = formatUSD(invoice.subtotal);
  const taxAmount = formatUSD(invoice.salesTaxAmount ?? "0");
  const ratePct = formatRate(invoice.salesTaxRate);
  return [
    `Subtotal: ${subtotal}`,
    `Sales Tax (${ratePct}%): ${taxAmount}`,
    `Total: ${total}`,
  ].join("\n");
}

function formatUSDate(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  return d.toLocaleDateString("en-US");
}

function publicPaymentLinkFor(invoiceId: string): string | null {
  try {
    return buildPublicPaymentUrl(invoiceId);
  } catch {
    return null;
  }
}

export class EmailService {
  private static transporter: Transporter | null = null;
  private static isDevelopment = process.env.NODE_ENV !== "production";

  /**
   * Initialize SMTP transporter for production use
   */
  private static async getTransporter(): Promise<Transporter | null> {
    if (this.isDevelopment) {
      return null; // Mock mode in development
    }

    // Return cached transporter if already initialized
    if (this.transporter) {
      return this.transporter;
    }

    // Check for required SMTP environment variables
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM;

    if (!host || !port || !user || !pass || !from) {
      console.error(JSON.stringify({ level: "error", timestamp: new Date().toISOString(), service: "email", operation: "getTransporter", tenantId: null, detail: "SMTP credentials not configured — set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM" }));
      return null;
    }

    try {
      // Create transporter with SMTP credentials
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(port, 10),
        secure: parseInt(port, 10) === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      // Verify connection
      await this.transporter.verify();
      console.info(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), service: "email", operation: "getTransporter", tenantId: null, detail: "SMTP connection verified successfully" }));
      
      return this.transporter;
    } catch (error) {
      console.error(JSON.stringify({ level: "error", timestamp: new Date().toISOString(), service: "email", operation: "getTransporter", tenantId: null, detail: error instanceof Error ? error.message : "Unknown error" }));
      this.transporter = null;
      return null;
    }
  }

  /**
   * Send an email (mock in development, real SMTP in production)
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (this.isDevelopment) {
        console.info(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), service: "email", operation: "sendEmail", tenantId: null, detail: `mock to=${options.to} subject=${options.subject}` }));
        return true;
      }

      // Production: Send real email via SMTP
      const transporter = await this.getTransporter();
      
      if (!transporter) {
        throw new Error("SMTP transporter not configured. Please set SMTP environment variables.");
      }

      const defaultFrom = process.env.SMTP_FROM || "noreply@opusrentalcapital.com";
      const overrideFrom = options.fromAddress?.trim();
      const from = overrideFrom || defaultFrom;
      const fromName = options.fromName?.trim() || "Opus Rental Capital";

      const info = await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
        // Always route replies to the tenant's billing email when available,
        // so that even if the SMTP provider rewrites the envelope From for
        // DMARC alignment, customer responses still reach the tenant inbox.
        replyTo: overrideFrom ? `"${fromName}" <${overrideFrom}>` : undefined,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((a) => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        })),
      });

      console.info(JSON.stringify({ level: "info", timestamp: new Date().toISOString(), service: "email", operation: "sendEmail", tenantId: null, detail: `sent messageId=${info.messageId} to=${options.to}` }));
      return true;
    } catch (error) {
      console.error(JSON.stringify({ level: "error", timestamp: new Date().toISOString(), service: "email", operation: "sendEmail", tenantId: null, detail: `${error instanceof Error ? error.message : "Unknown error"} to=${options.to}` }));
      throw error; // Propagate error for proper logging
    }
  }

  /**
   * Generate invoice email HTML
   */
  static generateInvoiceEmail(data: InvoiceEmailData): string {
    const { invoice, contract, client } = data;
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(invoice.id);
    const dueDate = formatUSDate(invoice.dueDate);
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pay invoice</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Payment link unavailable</span>`;
    const paymentMethodsBlock = renderPaymentMethodsBlock(data.tenant);

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .invoice-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; font-weight: bold; color: #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Invoice ${invoice.invoiceNumber}</h1>
      <p>${brandName}</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p>Your monthly rental invoice is available. The PDF is attached to this email.</p>

      <div class="invoice-details">
        <div class="detail-row">
          <span class="label">Invoice number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Reference month:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due date:</span>
          <span class="value">${dueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        ${renderInvoiceTotalsRows(invoice, "amount")}
      </div>

      <p>Please pay by the due date to avoid late fees.</p>

      <center>
        ${buttonHtml}
      </center>

      ${paymentMethodsBlock}

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>If you have any questions, simply reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate payment reminder email HTML
   */
  static generatePaymentReminderEmail(data: InvoiceEmailData, daysOverdue: number): string {
    const { invoice, contract, client } = data;
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(invoice.id);
    const dueDate = formatUSDate(invoice.dueDate);
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pay now</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Payment link unavailable</span>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef3c7; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #dc2626; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
    .overdue { color: #dc2626; font-weight: bold; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Payment reminder</h1>
      <p>Invoice ${invoice.invoiceNumber} is overdue</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p><strong class="overdue">This invoice is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} past due.</strong></p>
      <p>We haven't received payment for the invoice below yet. Please settle it as soon as possible to avoid service suspension.</p>

      <div class="warning-box">
        <div class="detail-row">
          <span class="label">Invoice number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Original due date:</span>
          <span class="value overdue">${dueDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Days past due:</span>
          <span class="value overdue">${daysOverdue} day${daysOverdue > 1 ? 's' : ''}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        ${renderInvoiceTotalsRows(invoice, "amount")}
      </div>

      <p><strong>If you have already made the payment, please disregard this notice.</strong></p>
      <p>If you have any questions about this invoice, please contact us.</p>

      <center>
        ${buttonHtml}
      </center>

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>If you have any questions, simply reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate "due soon" reminder email HTML — sent before the due date
   * (typically 3 days before) to nudge customers into paying on time.
   * Visually softer than the overdue reminder (blue accent rather than red)
   * so customers don't feel they're already late.
   */
  static generateDueSoonReminderEmail(data: InvoiceEmailData, daysUntilDue: number): string {
    const { invoice, contract, client } = data;
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(invoice.id);
    const dueDate = formatUSDate(invoice.dueDate);
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pay now</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Payment link unavailable</span>`;
    const paymentMethodsBlock = renderPaymentMethodsBlock(data.tenant);
    const dayLabel = daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #eff6ff; padding: 30px; border-radius: 0 0 8px 8px; }
    .info-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; font-weight: bold; color: #1d4ed8; }
    .due-soon { color: #1d4ed8; font-weight: bold; }
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Friendly reminder</h1>
      <p>Invoice ${invoice.invoiceNumber} is due ${dayLabel}</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is due <strong class="due-soon">${dayLabel}</strong> (${dueDate}).</p>

      <div class="info-box">
        <div class="detail-row">
          <span class="label">Invoice number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Reference month:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due date:</span>
          <span class="value due-soon">${dueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        ${renderInvoiceTotalsRows(invoice, "amount")}
      </div>

      <p>Pay by the due date to avoid late fees.</p>

      <center>
        ${buttonHtml}
      </center>

      ${paymentMethodsBlock}

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>If you have already paid, please disregard this notice.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate reissued-invoice email HTML
   */
  static generateInvoiceReissuedEmail(data: InvoiceEmailData, previousDueDate: string): string {
    const { invoice, contract, client } = data;
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(invoice.id);
    const newDueDate = formatUSDate(invoice.dueDate);
    const oldDueDate = formatUSDate(previousDueDate);
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pay now</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Payment link unavailable</span>`;

    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #fef3c7; padding: 30px; border-radius: 0 0 8px 8px; }
    .warning-box { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; }
    .detail-row { display: flex; justify-content: space-between; margin: 10px 0; }
    .label { font-weight: bold; color: #666; }
    .value { color: #333; }
    .amount { font-size: 24px; font-weight: bold; color: #dc2626; }
    .new-date { color: #16a34a; font-weight: bold; }
    .old-date { color: #dc2626; text-decoration: line-through; }
    .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Reissued invoice</h1>
      <p>Invoice ${invoice.invoiceNumber} — new due date</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p>Invoice <strong>${invoice.invoiceNumber}</strong> has been reissued with a new due date. The updated PDF is attached.</p>

      <div class="warning-box">
        <div class="detail-row">
          <span class="label">Invoice number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Reference month:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Previous due date:</span>
          <span class="value old-date">${oldDueDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">New due date:</span>
          <span class="value new-date">${newDueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        ${renderInvoiceTotalsRows(invoice, "amount")}
      </div>

      <p><strong>If you have already made the payment, please disregard this notice.</strong></p>
      <p>If you have any questions about this invoice, please contact us.</p>

      <center>
        ${buttonHtml}
      </center>

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>If you have any questions, simply reply to this email.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Send invoice email to client
   */
  static async sendInvoiceEmail(data: InvoiceEmailData): Promise<boolean> {
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(data.invoice.id);
    const html = this.generateInvoiceEmail(data);
    const text = `
Invoice ${data.invoice.invoiceNumber}

Hello ${data.client.tradeName || data.client.companyName},

Your monthly rental invoice (Contract ${data.contract.contractNumber}) is available.

${renderInvoiceTotalsText(data.invoice)}
Due date: ${formatUSDate(data.invoice.dueDate)}
Reference month: ${data.invoice.referenceMonth}
${paymentUrl ? `Pay online: ${paymentUrl}` : ""}

Please pay by the due date.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      fromAddress: data.tenant?.billingEmail?.trim() || undefined,
      subject: `Invoice ${data.invoice.invoiceNumber} — ${data.invoice.referenceMonth}`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Send payment reminder email to client
   */
  static async sendPaymentReminderEmail(data: InvoiceEmailData, daysOverdue: number): Promise<boolean> {
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(data.invoice.id);
    const html = this.generatePaymentReminderEmail(data, daysOverdue);
    const text = `
PAYMENT REMINDER — Invoice ${data.invoice.invoiceNumber}

Hello ${data.client.tradeName || data.client.companyName},

This invoice is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} past due.

${renderInvoiceTotalsText(data.invoice)}
Original due date: ${formatUSDate(data.invoice.dueDate)}
${paymentUrl ? `Pay now: ${paymentUrl}` : ""}

If you have already paid, please disregard this notice.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      fromAddress: data.tenant?.billingEmail?.trim() || undefined,
      subject: `Payment reminder — Invoice ${data.invoice.invoiceNumber} (${daysOverdue} day${daysOverdue > 1 ? 's' : ''} past due)`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Send the "due soon" reminder to the client (typically 3 days before
   * the due date). Uses the dedicated due-soon template + a distinct
   * subject so the customer can tell it apart from the original invoice
   * email and from an overdue notice.
   */
  static async sendDueSoonReminderEmail(data: InvoiceEmailData, daysUntilDue: number): Promise<boolean> {
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(data.invoice.id);
    const html = this.generateDueSoonReminderEmail(data, daysUntilDue);
    const dayLabel = daysUntilDue === 1 ? "tomorrow" : `in ${daysUntilDue} days`;
    const dueDateStr = formatUSDate(data.invoice.dueDate);
    const text = `
Friendly reminder — Invoice ${data.invoice.invoiceNumber}

Hello ${data.client.tradeName || data.client.companyName},

Invoice ${data.invoice.invoiceNumber} (Contract ${data.contract.contractNumber}) is due ${dayLabel} (${dueDateStr}).

${renderInvoiceTotalsText(data.invoice)}
Due date: ${dueDateStr}
Reference month: ${data.invoice.referenceMonth}
${paymentUrl ? `Pay now: ${paymentUrl}` : ""}

Pay by the due date to avoid late fees.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      fromAddress: data.tenant?.billingEmail?.trim() || undefined,
      subject: `Reminder: Invoice ${data.invoice.invoiceNumber} due ${dayLabel} (${dueDateStr})`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Send invoice reissued (2ª via) email to client
   */
  static async sendInvoiceReissuedEmail(data: InvoiceEmailData, previousDueDate: string): Promise<boolean> {
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(data.invoice.id);
    const html = this.generateInvoiceReissuedEmail(data, previousDueDate);
    const newDueDateStr = formatUSDate(data.invoice.dueDate);
    const oldDueDateStr = formatUSDate(previousDueDate);
    const text = `
Reissued invoice — ${data.invoice.invoiceNumber}

Hello ${data.client.tradeName || data.client.companyName},

Invoice ${data.invoice.invoiceNumber} (Contract ${data.contract.contractNumber}) has been reissued with a new due date.

${renderInvoiceTotalsText(data.invoice)}
Previous due date: ${oldDueDateStr}
New due date: ${newDueDateStr}
Reference month: ${data.invoice.referenceMonth}
${paymentUrl ? `Pay now: ${paymentUrl}` : ""}

If you have already paid, please disregard this notice.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      fromAddress: data.tenant?.billingEmail?.trim() || undefined,
      subject: `Reissued invoice — ${data.invoice.invoiceNumber} — new due date ${newDueDateStr}`,
      html,
      text,
      attachments: data.attachments,
    });
  }

  /**
   * Create email log entry for database
   */
  static createEmailLog(
    recipientEmail: string,
    recipientName: string | null,
    subject: string,
    emailType: string,
    entityType: string | null,
    entityId: string | null,
    status: "sent" | "failed",
    errorMessage?: string
  ): InsertEmailLog {
    return {
      recipientEmail,
      recipientName,
      subject,
      emailType,
      entityType,
      entityId,
      status,
      errorMessage: errorMessage || null,
    };
  }
}
