import cron from "node-cron";
import { storage } from "../storage";
import { EmailService, type EmailAttachment } from "./email.service";
import { WhatsAppService } from "./whatsapp.service";
import { PDFService } from "./pdf.service";
import type { RentalContract, Invoice } from "@shared/schema";

/**
 * Best-effort builder for the per-invoice email payload (tenant + PDF
 * attachment). Returns an empty object on any failure so the email can still
 * be sent without these enhancements rather than aborting the notification.
 */
async function buildInvoiceEmailExtras(
  invoice: Invoice,
  contract: RentalContract,
  client: { companyName: string; tradeName: string | null; email: string; phone: string; address: string | null; taxId: string | null },
): Promise<{ tenant: { name: string } | null; attachments: EmailAttachment[] }> {
  let tenant: { name: string } | null = null;
  const attachments: EmailAttachment[] = [];
  try {
    const t = await storage.getTenant(invoice.tenantId);
    if (t) tenant = { name: t.name };
  } catch (err) {
    log("warn", "buildInvoiceEmailExtras", `getTenant failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    const trailer = await storage.getTrailer(contract.trailerId, invoice.tenantId).catch(() => null);
    if (trailer) {
      const lineItems = await storage.getInvoiceItems(invoice.id, invoice.tenantId).catch(() => []);
      const pdfBuffer = PDFService.generateInvoicePDF({
        ...invoice,
        contract: { ...contract, client: client as any, trailer },
        tenant: (await storage.getTenant(invoice.tenantId).catch(() => null)) ?? null,
        lineItems,
      });
      attachments.push({
        filename: `Fatura-${invoice.invoiceNumber}.pdf`,
        content: pdfBuffer,
        contentType: "application/pdf",
      });
    }
  } catch (err) {
    log("warn", "buildInvoiceEmailExtras", `PDF generation failed: ${err instanceof Error ? err.message : String(err)}`);
  }
  return { tenant, attachments };
}

const log = (level: "info" | "warn" | "error", operation: string, detail: string) => {
  const entry = { level, timestamp: new Date().toISOString(), service: "invoice-automation", operation, tenantId: null, detail };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
};

export type GenerateInvoiceResult =
  | { ok: true; invoice: Invoice }
  | { ok: false; skipped: true; reason: "duplicate" | "missing_rate" }
  | { ok: false; skipped: false; reason: string };

/**
 * All date math in this service is UTC-based to match the cron schedule
 * (which is also pinned to UTC). This makes per-contract eligibility,
 * referenceMonth, and dueDate deterministic regardless of the host's
 * configured timezone.
 */

/**
 * Format a Date as YYYY-MM-DD using UTC calendar fields.
 */
function formatDateOnly(d: Date): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date as YYYY-MM (reference month) using UTC calendar fields.
 */
function formatReferenceMonth(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Returns the last calendar day (1-31) of the UTC month containing `d`.
 */
function lastDayOfMonth(d: Date): number {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
}

/**
 * Decide whether a contract should be billed today (UTC) based on its
 * configured invoiceDayOfMonth. If the configured day does not exist in
 * the current month (e.g. day=31 in February), the contract is billed on
 * the last day of the month instead, so contracts never skip a billing
 * cycle.
 */
export function isContractDueToday(
  contract: Pick<RentalContract, "invoiceDayOfMonth">,
  today: Date,
): boolean {
  const rawDay = contract.invoiceDayOfMonth ?? 1;
  const dayOfMonth = Math.min(Math.max(1, rawDay), 31);
  const lastDay = lastDayOfMonth(today);
  const effectiveDay = Math.min(dayOfMonth, lastDay);
  return today.getUTCDate() === effectiveDay;
}

export class InvoiceAutomationService {
  private static isRunning = false;

  /**
   * Initialize cron jobs for invoice automation
   */
  static initialize() {
    if (this.isRunning) {
      log("warn", "initialize", "already running — skipping");
      return;
    }

    log("info", "initialize", "starting");

    // All schedules pinned to UTC so behavior is deterministic regardless
    // of the host's timezone. Per-contract eligibility for the daily job
    // is computed by matching today's UTC day-of-month against
    // contract.invoiceDayOfMonth.
    const cronOptions = { timezone: "UTC" } as const;

    cron.schedule(
      "1 0 * * *",
      async () => {
        log("info", "generateMonthlyInvoices", "cron triggered");
        await this.generateMonthlyInvoices();
      },
      cronOptions,
    );

    cron.schedule(
      "0 9 * * *",
      async () => {
        log("info", "sendOverdueReminders", "cron triggered");
        await this.sendOverdueReminders();
      },
      cronOptions,
    );

    cron.schedule(
      "0 9 * * *",
      async () => {
        log("info", "sendUpcomingDueReminders", "cron triggered");
        await this.sendUpcomingDueReminders();
      },
      cronOptions,
    );

    this.isRunning = true;
    log("info", "initialize", "started — monthly:daily/00:01 UTC overdue:daily/09:00 UTC due-reminder:daily/09:00 UTC");
  }

  /**
   * Generate one invoice for one contract on a specific date. Reusable by
   * the daily cron, the manual "trigger now" endpoint, and the per-contract
   * "Generate invoice now" button.
   *
   * - referenceMonth: YYYY-MM derived from `today`
   * - dueDate: today + (contract.paymentDueDays || 15)
   * - amount: contract.monthlyRate
   *
   * Idempotent at the (contractId, referenceMonth) granularity thanks to
   * the uniq_invoices_contract_month database constraint.
   */
  static async generateInvoiceForContract(
    contract: RentalContract,
    today: Date = new Date(),
    options: { notes?: string } = {},
  ): Promise<GenerateInvoiceResult> {
    const referenceMonth = formatReferenceMonth(today);

    if (!contract.monthlyRate) {
      log("warn", "generateInvoiceForContract", `missing monthlyRate contract=${contract.contractNumber}`);
      return { ok: false, skipped: true, reason: "missing_rate" };
    }

    // Tenant-scoped duplicate check. The DB also has a unique constraint as
    // a backstop in case of races.
    const existingInvoices = await storage.getInvoicesByContractId(
      contract.id,
      contract.tenantId,
    );
    if (existingInvoices.some((inv: Invoice) => inv.referenceMonth === referenceMonth)) {
      return { ok: false, skipped: true, reason: "duplicate" };
    }

    // Calculate due date as today + paymentDueDays in UTC. Use nullish
    // coalescing so a contract configured with 0 (due on the same day) is
    // honored instead of falling back to the default. The Date arithmetic
    // handles month/year rollover automatically.
    const dueDays = contract.paymentDueDays ?? 15;
    const dueDate = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() + dueDays),
    );

    const invoiceNumber = await storage.getNextInvoiceNumber(contract.tenantId);

    let invoice: Invoice;
    try {
      invoice = await storage.createInvoice({
        tenantId: contract.tenantId,
        invoiceNumber,
        contractId: contract.id,
        amount: contract.monthlyRate,
        dueDate: formatDateOnly(dueDate),
        paidDate: null,
        status: "pending",
        referenceMonth,
        notes: options.notes ?? "Auto-generated monthly invoice",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error creating invoice";
      // Only the (contractId, referenceMonth) collision is a graceful
      // duplicate. Any other unique violation (e.g. invoice-number race on
      // uniq_invoices_tenant_invoice_number) is a real failure and must
      // bubble up so the caller sees it instead of being silently skipped.
      if (/uniq_invoices_contract_month/i.test(message)) {
        return { ok: false, skipped: true, reason: "duplicate" };
      }
      throw error;
    }

    log(
      "info",
      "generateInvoiceForContract",
      `invoice created invoiceNumber=${invoiceNumber} contract=${contract.contractNumber} dueDate=${invoice.dueDate} amount=${invoice.amount}`,
    );

    // Best-effort email + WhatsApp notification. Failures here do NOT
    // invalidate the created invoice — they are logged and surfaced via the
    // email log table for audit.
    try {
      const client = await storage.getRentalClient(contract.clientId);
      if (client) {
        let emailStatus: "sent" | "failed" = "failed";
        let errorMessage: string | undefined;

        try {
          const extras = await buildInvoiceEmailExtras(invoice, contract, client);
          await EmailService.sendInvoiceEmail({ invoice, contract, client, ...extras });
          emailStatus = "sent";
        } catch (error) {
          errorMessage = error instanceof Error ? error.message : "Unknown error sending email";
          log("error", "sendInvoiceEmail", `${errorMessage} to=${client.email}`);
        }

        const emailLog = EmailService.createEmailLog(
          client.email,
          client.tradeName || client.companyName,
          `Invoice ${invoice.invoiceNumber} - ${referenceMonth}`,
          "invoice",
          "invoice",
          invoice.id,
          emailStatus,
          errorMessage,
        );
        await storage.createEmailLog(emailLog);

        if (emailStatus === "sent") {
          log("info", "sendInvoiceEmail", `sent to=${client.email} invoiceNumber=${invoice.invoiceNumber}`);
        }

        if (client.phone) {
          try {
            await WhatsAppService.sendEvent(
              "invoice_issued",
              {
                recipientPhone: client.phone,
                recipientName: client.tradeName || client.companyName,
                invoiceNumber: invoice.invoiceNumber,
                amount: `$${Number(invoice.amount).toFixed(2)}`,
                dueDate: invoice.dueDate,
              },
              contract.tenantId,
            );
          } catch (waError) {
            log(
              "error",
              "whatsappInvoiceIssued",
              `${waError instanceof Error ? waError.message : "Unknown error"} invoiceNumber=${invoice.invoiceNumber}`,
            );
          }
        }
      }
    } catch (error) {
      log(
        "error",
        "generateInvoiceForContract",
        `notification phase failed ${error instanceof Error ? error.message : "Unknown error"} invoiceNumber=${invoice.invoiceNumber}`,
      );
    }

    return { ok: true, invoice };
  }

  /**
   * Daily handler: process every active contract whose invoiceDayOfMonth
   * matches today's day (with last-day-of-month fallback for short months).
   *
   * Optionally accepts an explicit list of contractIds to force generation
   * for those specific contracts regardless of today's day — useful for
   * manual back-fill or testing.
   */
  static async generateMonthlyInvoices(
    options: { contractIds?: string[]; today?: Date; tenantId?: string } = {},
  ): Promise<{ generated: number; skipped: number; errors: number; eligible: number }> {
    const today = options.today ?? new Date();
    const summary = { generated: 0, skipped: 0, errors: 0, eligible: 0 };

    try {
      // Tenant scoping: when called from a manual route, the caller MUST
      // pass tenantId so we never look at contracts outside their tenant.
      // The cron path runs across all tenants by design (no tenantId).
      const contracts = await storage.getAllRentalContracts(options.tenantId);
      const activeContracts = contracts.filter((c) => c.status === "active");

      // When an explicit contractIds list is provided, treat it as a force
      // and bypass the autoGenerateInvoices flag — the caller (e.g. the
      // "Generate invoice now" button) has explicit intent to generate.
      // The cron path (no contractIds) still respects autoGenerateInvoices.
      // Because we already filtered contracts by tenantId above (when
      // provided), unknown/cross-tenant IDs simply won't match anything.
      const eligible = options.contractIds
        ? activeContracts.filter((c) => options.contractIds!.includes(c.id))
        : activeContracts
            .filter((c) => c.autoGenerateInvoices)
            .filter((c) => isContractDueToday(c, today));

      summary.eligible = eligible.length;

      log(
        "info",
        "generateMonthlyInvoices",
        `today=${formatDateOnly(today)} active=${activeContracts.length} eligible=${eligible.length} forced=${options.contractIds ? options.contractIds.length : 0}`,
      );

      for (const contract of eligible) {
        try {
          const result = await this.generateInvoiceForContract(contract, today);
          if (result.ok) {
            summary.generated++;
          } else if (result.skipped) {
            log(
              "info",
              "generateMonthlyInvoices",
              `skipped reason=${result.reason} contract=${contract.contractNumber} month=${formatReferenceMonth(today)}`,
            );
            summary.skipped++;
          } else {
            log(
              "error",
              "generateMonthlyInvoices",
              `failed reason=${result.reason} contract=${contract.contractNumber}`,
            );
            summary.errors++;
          }
        } catch (error) {
          log(
            "error",
            "generateMonthlyInvoices",
            `${error instanceof Error ? error.message : "Unknown error"} contract=${contract.contractNumber}`,
          );
          summary.errors++;
        }
      }

      log(
        "info",
        "generateMonthlyInvoices",
        `summary today=${formatDateOnly(today)} eligible=${summary.eligible} generated=${summary.generated} skipped=${summary.skipped} errors=${summary.errors}`,
      );
    } catch (error) {
      log("error", "generateMonthlyInvoices", error instanceof Error ? error.message : "Unknown error");
    }

    return summary;
  }

  /**
   * Send reminders for overdue invoices
   */
  static async sendOverdueReminders(): Promise<void> {
    try {
      const allInvoices = await storage.getAllInvoices();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueInvoices = allInvoices.filter((invoice) => {
        if (invoice.status !== "pending" && invoice.status !== "overdue" && invoice.status !== "reissued") {
          return false;
        }
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      log("info", "sendOverdueReminders", `overdue invoices found count=${overdueInvoices.length}`);

      let sent = 0;
      let errors = 0;

      for (const invoice of overdueInvoices) {
        try {
          // Update invoice status to overdue if not already
          if (invoice.status === "pending" || invoice.status === "reissued") {
            await storage.updateInvoice(invoice.id, { status: "overdue" });
          }

          // Get contract and client info
          const contract = await storage.getRentalContract(invoice.contractId);
          if (!contract) continue;

          const client = await storage.getRentalClient(contract.clientId);
          if (!client) continue;

          // Calculate days overdue
          const dueDate = new Date(invoice.dueDate);
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          // Only send reminder every 7 days to avoid spamming
          if (daysOverdue % 7 !== 0) {
            continue;
          }

          // Send reminder email
          let emailStatus: "sent" | "failed" = "failed";
          let errorMessage: string | undefined;

          try {
            const extras = await buildInvoiceEmailExtras(invoice, contract, client);
            await EmailService.sendPaymentReminderEmail(
              { invoice, contract, client, ...extras },
              daysOverdue
            );
            emailStatus = "sent";
          } catch (error) {
            emailStatus = "failed";
            errorMessage = error instanceof Error ? error.message : "Unknown error sending reminder";
          }

          // Log email attempt
          const emailLog = EmailService.createEmailLog(
            client.email,
            client.tradeName || client.companyName,
            `Payment Reminder - Invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
            "payment_reminder",
            "invoice",
            invoice.id,
            emailStatus,
            errorMessage
          );
          await storage.createEmailLog(emailLog);

          if (emailStatus === "sent") {
            log("info", "sendOverdueReminders", `reminder sent invoiceNumber=${invoice.invoiceNumber} daysOverdue=${daysOverdue}`);
            sent++;
          } else {
            log("error", "sendOverdueReminders", `${errorMessage} invoiceNumber=${invoice.invoiceNumber}`);
            errors++;
          }

          if (client.phone) {
            await WhatsAppService.sendEvent(
              "invoice_overdue",
              {
                recipientPhone: client.phone,
                recipientName: client.tradeName || client.companyName,
                invoiceNumber: invoice.invoiceNumber,
                amount: `$${Number(invoice.amount).toFixed(2)}`,
                daysOverdue: String(daysOverdue),
              },
              contract.tenantId
            );
          }
        } catch (error) {
          log("error", "sendOverdueReminders", `${error instanceof Error ? error.message : "Unknown error"} invoiceNumber=${invoice.invoiceNumber}`);
          errors++;
        }
      }

      log("info", "sendOverdueReminders", `summary sent=${sent} errors=${errors}`);
    } catch (error) {
      log("error", "sendOverdueReminders", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Send reminders for invoices due in 3 days
   */
  static async sendUpcomingDueReminders(): Promise<void> {
    try {
      const allInvoices = await storage.getAllInvoices();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeDaysFromNow = new Date(today);
      threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

      const upcomingInvoices = allInvoices.filter((invoice) => {
        if (invoice.status !== "pending") {
          return false;
        }
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate.getTime() === threeDaysFromNow.getTime();
      });

      log("info", "sendUpcomingDueReminders", `invoices due in 3 days found count=${upcomingInvoices.length}`);

      let sent = 0;
      let errors = 0;

      for (const invoice of upcomingInvoices) {
        try {
          const contract = await storage.getRentalContract(invoice.contractId);
          if (!contract) continue;

          const client = await storage.getRentalClient(contract.clientId);
          if (!client) continue;

          // Send friendly reminder email
          let emailStatus: "sent" | "failed" = "failed";
          let errorMessage: string | undefined;

          try {
            const extras = await buildInvoiceEmailExtras(invoice, contract, client);
            await EmailService.sendInvoiceEmail({
              invoice,
              contract,
              client,
              ...extras,
            });
            emailStatus = "sent";
          } catch (error) {
            emailStatus = "failed";
            errorMessage = error instanceof Error ? error.message : "Unknown error sending due reminder";
          }

          // Log email attempt
          const emailLog = EmailService.createEmailLog(
            client.email,
            client.tradeName || client.companyName,
            `Reminder: Invoice ${invoice.invoiceNumber} due in 3 days`,
            "due_reminder",
            "invoice",
            invoice.id,
            emailStatus,
            errorMessage
          );
          await storage.createEmailLog(emailLog);

          if (emailStatus === "sent") {
            log("info", "sendUpcomingDueReminders", `due reminder sent invoiceNumber=${invoice.invoiceNumber}`);
            sent++;
          } else {
            log("error", "sendUpcomingDueReminders", `${errorMessage} invoiceNumber=${invoice.invoiceNumber}`);
            errors++;
          }

          if (client.phone) {
            const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("pt-BR");
            await WhatsAppService.sendEvent(
              "invoice_issued",
              {
                recipientPhone: client.phone,
                recipientName: client.tradeName || client.companyName,
                invoiceNumber: invoice.invoiceNumber,
                amount: `$${Number(invoice.amount).toFixed(2)}`,
                dueDate: dueDateFormatted,
              },
              contract.tenantId
            );
          }
        } catch (error) {
          log("error", "sendUpcomingDueReminders", `${error instanceof Error ? error.message : "Unknown error"} invoiceNumber=${invoice.invoiceNumber}`);
          errors++;
        }
      }

      if (sent > 0 || errors > 0) {
        log("info", "sendUpcomingDueReminders", `summary sent=${sent} errors=${errors}`);
      }
    } catch (error) {
      log("error", "sendUpcomingDueReminders", error instanceof Error ? error.message : "Unknown error");
    }
  }

  /**
   * Manually trigger invoice generation. Same logic as the daily cron, but
   * callable on demand. Without arguments it processes only the contracts
   * eligible today (matching their invoiceDayOfMonth). Pass `contractIds`
   * to force generation for a specific set regardless of the day.
   */
  static async generateInvoicesNow(
    options: { contractIds?: string[]; today?: Date; tenantId?: string } = {},
  ): Promise<{ generated: number; skipped: number; errors: number; eligible: number }> {
    log(
      "info",
      "generateInvoicesNow",
      `manual trigger tenant=${options.tenantId ?? "ALL"} contractIds=${options.contractIds ? options.contractIds.length : "auto"}`,
    );
    return this.generateMonthlyInvoices(options);
  }

  /**
   * Manually trigger overdue check (for testing)
   */
  static async checkOverdueNow(): Promise<void> {
    log("info", "checkOverdueNow", "manual trigger");
    await this.sendOverdueReminders();
  }
}
