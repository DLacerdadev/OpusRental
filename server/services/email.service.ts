import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Invoice, RentalClient, RentalContract, InsertEmailLog } from "@shared/schema";

export interface EmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface InvoiceEmailData {
  invoice: Invoice;
  contract: RentalContract;
  client: RentalClient;
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

      const from = process.env.SMTP_FROM || "noreply@opusrentalcapital.com";

      const info = await transporter.sendMail({
        from: `"Opus Rental Capital" <${from}>`,
        to: options.toName ? `"${options.toName}" <${options.to}>` : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
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
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const amount = parseFloat(invoice.amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });

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
      <h1>🧾 Invoice ${invoice.invoiceNumber}</h1>
      <p>Opus Rental Capital</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p>Your monthly invoice for trailer rental is ready.</p>
      
      <div class="invoice-details">
        <div class="detail-row">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Reference Month:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date:</span>
          <span class="value">${dueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div class="detail-row">
          <span class="label">Amount Due:</span>
          <span class="amount">${amount}</span>
        </div>
      </div>

      <p>Please process payment by the due date to avoid late fees.</p>
      
      <center>
        <a href="#" class="button">View Invoice Details</a>
      </center>

      <div class="footer">
        <p><strong>Opus Rental Capital</strong></p>
        <p>Commercial Trailer Rentals & Investments</p>
        <p>Questions? Contact us at support@opusrentalcapital.com</p>
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
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    const amount = parseFloat(invoice.amount).toLocaleString("en-US", {
      style: "currency",
      currency: "USD"
    });

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
      <h1>⚠️ Payment Reminder</h1>
      <p>Overdue Invoice ${invoice.invoiceNumber}</p>
    </div>
    <div class="content">
      <h2>Hello ${client.tradeName || client.companyName},</h2>
      <p><strong class="overdue">This invoice is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.</strong></p>
      <p>We have not received payment for the invoice below. Please arrange payment as soon as possible to avoid service interruption.</p>
      
      <div class="warning-box">
        <div class="detail-row">
          <span class="label">Invoice Number:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Original Due Date:</span>
          <span class="value overdue">${dueDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Days Overdue:</span>
          <span class="value overdue">${daysOverdue} days</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div class="detail-row">
          <span class="label">Amount Due:</span>
          <span class="amount">${amount}</span>
        </div>
      </div>

      <p><strong>If you have already sent payment, please disregard this notice.</strong></p>
      <p>If you have questions about this invoice, please contact us immediately.</p>
      
      <center>
        <a href="#" class="button">Pay Now</a>
      </center>

      <div class="footer">
        <p><strong>Opus Rental Capital</strong></p>
        <p>Commercial Trailer Rentals & Investments</p>
        <p>Urgent? Call us at +1 (555) 123-4567</p>
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
    const html = this.generateInvoiceEmail(data);
    const text = `
Invoice ${data.invoice.invoiceNumber}

Dear ${data.client.tradeName || data.client.companyName},

Your monthly invoice for trailer rental (Contract ${data.contract.contractNumber}) is ready.

Amount Due: $${data.invoice.amount}
Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}
Reference Month: ${data.invoice.referenceMonth}

Please process payment by the due date.

Thank you,
Opus Rental Capital
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      subject: `Invoice ${data.invoice.invoiceNumber} - ${data.invoice.referenceMonth}`,
      html,
      text
    });
  }

  /**
   * Send payment reminder email to client
   */
  static async sendPaymentReminderEmail(data: InvoiceEmailData, daysOverdue: number): Promise<boolean> {
    const html = this.generatePaymentReminderEmail(data, daysOverdue);
    const text = `
PAYMENT REMINDER - Invoice ${data.invoice.invoiceNumber}

Dear ${data.client.tradeName || data.client.companyName},

This is a reminder that invoice ${data.invoice.invoiceNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue.

Amount Due: $${data.invoice.amount}
Original Due Date: ${new Date(data.invoice.dueDate).toLocaleDateString()}

Please arrange payment as soon as possible.

If you have already sent payment, please disregard this notice.

Thank you,
Opus Rental Capital
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      subject: `⚠️ Payment Reminder - Invoice ${data.invoice.invoiceNumber} (${daysOverdue} days overdue)`,
      html,
      text
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
