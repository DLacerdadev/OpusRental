import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { Invoice, RentalClient, RentalContract, InsertEmailLog, Tenant } from "@shared/schema";
import { buildPublicPaymentUrl } from "./invoice-token.service";

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
  attachments?: EmailAttachment[];
}

export interface InvoiceEmailData {
  invoice: Invoice;
  contract: RentalContract;
  client: RentalClient;
  /** Tenant the invoice belongs to. Used to render branded emails. */
  tenant?: Pick<Tenant, "name"> | null;
  /** Optional PDF (or other) attachments to include in the email. */
  attachments?: EmailAttachment[];
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

      const from = process.env.SMTP_FROM || "noreply@opusrentalcapital.com";
      const fromName = options.fromName?.trim() || "Opus Rental Capital";

      const info = await transporter.sendMail({
        from: `"${fromName}" <${from}>`,
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
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("pt-BR");
    const amount = parseFloat(invoice.amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pagar fatura</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Link de pagamento indisponível</span>`;

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
      <h1>Fatura ${invoice.invoiceNumber}</h1>
      <p>${brandName}</p>
    </div>
    <div class="content">
      <h2>Olá ${client.tradeName || client.companyName},</h2>
      <p>Sua fatura mensal de locação está disponível. O PDF está em anexo neste e-mail.</p>

      <div class="invoice-details">
        <div class="detail-row">
          <span class="label">Número da fatura:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contrato:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Mês de referência:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vencimento:</span>
          <span class="value">${dueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div class="detail-row">
          <span class="label">Valor a pagar:</span>
          <span class="amount">${amount}</span>
        </div>
      </div>

      <p>Pague até o vencimento para evitar juros e multa.</p>

      <center>
        ${buttonHtml}
      </center>

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>Em caso de dúvidas, responda a este e-mail.</p>
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
    const dueDate = new Date(invoice.dueDate).toLocaleDateString("pt-BR");
    const amount = parseFloat(invoice.amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pagar agora</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Link de pagamento indisponível</span>`;

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
      <h1>Lembrete de pagamento</h1>
      <p>Fatura ${invoice.invoiceNumber} em atraso</p>
    </div>
    <div class="content">
      <h2>Olá ${client.tradeName || client.companyName},</h2>
      <p><strong class="overdue">Esta fatura está ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} em atraso.</strong></p>
      <p>Ainda não recebemos o pagamento da fatura abaixo. Por favor regularize o quanto antes para evitar a suspensão do serviço.</p>

      <div class="warning-box">
        <div class="detail-row">
          <span class="label">Número da fatura:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contrato:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vencimento original:</span>
          <span class="value overdue">${dueDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Dias em atraso:</span>
          <span class="value overdue">${daysOverdue} dia${daysOverdue > 1 ? 's' : ''}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div class="detail-row">
          <span class="label">Valor a pagar:</span>
          <span class="amount">${amount}</span>
        </div>
      </div>

      <p><strong>Se o pagamento já foi efetuado, por favor desconsidere este aviso.</strong></p>
      <p>Em caso de dúvidas sobre esta fatura, entre em contato conosco.</p>

      <center>
        ${buttonHtml}
      </center>

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>Em caso de dúvidas, responda a este e-mail.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Generate invoice reissued (2ª via) email HTML
   */
  static generateInvoiceReissuedEmail(data: InvoiceEmailData, previousDueDate: string): string {
    const { invoice, contract, client } = data;
    const brandName = data.tenant?.name?.trim() || "Opus Rental Capital";
    const paymentUrl = publicPaymentLinkFor(invoice.id);
    const newDueDate = new Date(invoice.dueDate).toLocaleDateString("pt-BR");
    const oldDueDate = new Date(previousDueDate).toLocaleDateString("pt-BR");
    const amount = parseFloat(invoice.amount).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
    const buttonHtml = paymentUrl
      ? `<a href="${paymentUrl}" class="button">Pagar agora</a>`
      : `<span class="button" style="background:#9ca3af;cursor:not-allowed">Link de pagamento indisponível</span>`;

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
      <h1>Fatura reemitida (2ª via)</h1>
      <p>Fatura ${invoice.invoiceNumber} — novo vencimento</p>
    </div>
    <div class="content">
      <h2>Olá ${client.tradeName || client.companyName},</h2>
      <p>A fatura <strong>${invoice.invoiceNumber}</strong> foi reemitida com novo vencimento. O PDF atualizado segue em anexo.</p>

      <div class="warning-box">
        <div class="detail-row">
          <span class="label">Número da fatura:</span>
          <span class="value">${invoice.invoiceNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contrato:</span>
          <span class="value">${contract.contractNumber}</span>
        </div>
        <div class="detail-row">
          <span class="label">Mês de referência:</span>
          <span class="value">${invoice.referenceMonth}</span>
        </div>
        <div class="detail-row">
          <span class="label">Vencimento anterior:</span>
          <span class="value old-date">${oldDueDate}</span>
        </div>
        <div class="detail-row">
          <span class="label">Novo vencimento:</span>
          <span class="value new-date">${newDueDate}</span>
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
        <div class="detail-row">
          <span class="label">Valor a pagar:</span>
          <span class="amount">${amount}</span>
        </div>
      </div>

      <p><strong>Se o pagamento já foi efetuado, por favor desconsidere este aviso.</strong></p>
      <p>Em caso de dúvidas sobre esta fatura, entre em contato conosco.</p>

      <center>
        ${buttonHtml}
      </center>

      <div class="footer">
        <p><strong>${brandName}</strong></p>
        <p>Em caso de dúvidas, responda a este e-mail.</p>
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
Fatura ${data.invoice.invoiceNumber}

Olá ${data.client.tradeName || data.client.companyName},

Sua fatura mensal de locação (Contrato ${data.contract.contractNumber}) está disponível.

Valor: R$ ${data.invoice.amount}
Vencimento: ${new Date(data.invoice.dueDate).toLocaleDateString("pt-BR")}
Mês de referência: ${data.invoice.referenceMonth}
${paymentUrl ? `Pagar online: ${paymentUrl}` : ""}

Por favor pague até o vencimento.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      subject: `Fatura ${data.invoice.invoiceNumber} — ${data.invoice.referenceMonth}`,
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
LEMBRETE DE PAGAMENTO — Fatura ${data.invoice.invoiceNumber}

Olá ${data.client.tradeName || data.client.companyName},

Esta fatura está ${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} em atraso.

Valor: R$ ${data.invoice.amount}
Vencimento original: ${new Date(data.invoice.dueDate).toLocaleDateString("pt-BR")}
${paymentUrl ? `Pagar agora: ${paymentUrl}` : ""}

Se já pagou, desconsidere este aviso.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      subject: `Lembrete de pagamento — Fatura ${data.invoice.invoiceNumber} (${daysOverdue} dia${daysOverdue > 1 ? 's' : ''} em atraso)`,
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
    const newDueDateStr = new Date(data.invoice.dueDate).toLocaleDateString("pt-BR");
    const oldDueDateStr = new Date(previousDueDate).toLocaleDateString("pt-BR");
    const text = `
Fatura reemitida (2ª via) — ${data.invoice.invoiceNumber}

Olá ${data.client.tradeName || data.client.companyName},

A fatura ${data.invoice.invoiceNumber} (Contrato ${data.contract.contractNumber}) foi reemitida com novo vencimento.

Valor: R$ ${data.invoice.amount}
Vencimento anterior: ${oldDueDateStr}
Novo vencimento: ${newDueDateStr}
Mês de referência: ${data.invoice.referenceMonth}
${paymentUrl ? `Pagar agora: ${paymentUrl}` : ""}

Se já pagou, desconsidere este aviso.

${brandName}
    `.trim();

    return this.sendEmail({
      to: data.client.email,
      toName: data.client.tradeName || data.client.companyName,
      fromName: brandName,
      subject: `Fatura reemitida (2ª via) — ${data.invoice.invoiceNumber} — novo vencimento ${newDueDateStr}`,
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
