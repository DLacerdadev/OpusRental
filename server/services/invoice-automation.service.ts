import cron from "node-cron";
import { storage } from "../storage";
import { EmailService } from "./email.service";
import { WhatsAppService } from "./whatsapp.service";
import type { RentalContract, Invoice } from "@shared/schema";

const log = (level: "info" | "error", operation: string, detail: string) => {
  const entry = { level, timestamp: new Date().toISOString(), service: "invoice-automation", operation, tenantId: null, detail };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
};

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

    // Generate invoices on the 1st of every month at 00:01
    cron.schedule("1 0 1 * *", async () => {
      log("info", "generateMonthlyInvoices", "cron triggered");
      await this.generateMonthlyInvoices();
    });

    // Check for overdue invoices daily at 09:00
    cron.schedule("0 9 * * *", async () => {
      log("info", "sendOverdueReminders", "cron triggered");
      await this.sendOverdueReminders();
    });

    // Send reminder 3 days before due date at 09:00
    cron.schedule("0 9 * * *", async () => {
      log("info", "sendUpcomingDueReminders", "cron triggered");
      await this.sendUpcomingDueReminders();
    });

    this.isRunning = true;
    log("info", "initialize", "started — monthly:1st/00:01 overdue:daily/09:00 due-reminder:daily/09:00");
  }

  /**
   * Generate invoices for all active contracts
   */
  static async generateMonthlyInvoices(): Promise<void> {
    try {
      const contracts = await storage.getAllRentalContracts();
      const activeContracts = contracts.filter(
        (c) => c.status === "active" && c.autoGenerateInvoices
      );

      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      log("info", "generateMonthlyInvoices", `active contracts found count=${activeContracts.length} month=${currentMonth}`);

      let generated = 0;
      let skipped = 0;
      let errors = 0;

      for (const contract of activeContracts) {
        try {
          // Check if invoice already exists for this month
          const existingInvoices = await storage.getInvoicesByContractId(contract.id);
          const alreadyExists = existingInvoices.some(
            (inv: Invoice) => inv.referenceMonth === currentMonth
          );

          if (alreadyExists) {
            log("info", "generateMonthlyInvoices", `skipped — already exists contract=${contract.contractNumber} month=${currentMonth}`);
            skipped++;
            continue;
          }

          // Generate invoice number
          const allInvoices = await storage.getAllInvoices();
          const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(4, "0")}`;

          // Calculate due date using invoiceDayOfMonth from the contract.
          // Use the configured day in the current month if it has not yet passed;
          // otherwise roll forward to the same day in the next month.
          // Clamp to 1-28 to avoid month-overflow on short months (e.g. Feb 30).
          const rawDay = contract.invoiceDayOfMonth || 15;
          const dayOfMonth = Math.min(Math.max(1, rawDay), 28);
          const dueDate = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
          if (dueDate.getTime() < today.getTime()) {
            dueDate.setMonth(dueDate.getMonth() + 1);
          }

          // Create invoice
          const invoice = await storage.createInvoice({
            invoiceNumber,
            contractId: contract.id,
            amount: contract.monthlyRate,
            dueDate: dueDate.toISOString().split("T")[0],
            paidDate: null,
            status: "pending",
            referenceMonth: currentMonth,
            notes: "Auto-generated monthly invoice",
          });

          log("info", "generateMonthlyInvoices", `invoice created invoiceNumber=${invoiceNumber} contract=${contract.contractNumber}`);
          generated++;

          // Send invoice email to client
          const client = await storage.getRentalClient(contract.clientId);
          if (client) {
            let emailStatus: "sent" | "failed" = "failed";
            let errorMessage: string | undefined;

            try {
              await EmailService.sendInvoiceEmail({
                invoice,
                contract,
                client,
              });
              emailStatus = "sent";
            } catch (error) {
              emailStatus = "failed";
              errorMessage = error instanceof Error ? error.message : "Unknown error sending email";
              log("error", "sendInvoiceEmail", `${errorMessage} to=${client.email}`);
            }

            // Log email attempt
            const emailLog = EmailService.createEmailLog(
              client.email,
              client.tradeName || client.companyName,
              `Invoice ${invoice.invoiceNumber} - ${currentMonth}`,
              "invoice",
              "invoice",
              invoice.id,
              emailStatus,
              errorMessage
            );
            await storage.createEmailLog(emailLog);

            if (emailStatus === "sent") {
              log("info", "sendInvoiceEmail", `sent to=${client.email} invoiceNumber=${invoice.invoiceNumber}`);
            }

            if (client.phone) {
              await WhatsAppService.sendEvent(
                "invoice_issued",
                {
                  recipientPhone: client.phone,
                  recipientName: client.tradeName || client.companyName,
                  invoiceNumber: invoice.invoiceNumber,
                  amount: `$${Number(invoice.amount).toFixed(2)}`,
                  dueDate: invoice.dueDate,
                },
                contract.tenantId
              );
            }
          }
        } catch (error) {
          log("error", "generateMonthlyInvoices", `${error instanceof Error ? error.message : "Unknown error"} contract=${contract.contractNumber}`);
          errors++;
        }
      }

      log("info", "generateMonthlyInvoices", `summary generated=${generated} skipped=${skipped} errors=${errors}`);
    } catch (error) {
      log("error", "generateMonthlyInvoices", error instanceof Error ? error.message : "Unknown error");
    }
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
          if (invoice.status === "pending") {
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
            await EmailService.sendPaymentReminderEmail(
              { invoice, contract, client },
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
            await EmailService.sendInvoiceEmail({
              invoice,
              contract,
              client,
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
   * Manually trigger invoice generation (for testing)
   */
  static async generateInvoicesNow(): Promise<void> {
    log("info", "generateInvoicesNow", "manual trigger");
    await this.generateMonthlyInvoices();
  }

  /**
   * Manually trigger overdue check (for testing)
   */
  static async checkOverdueNow(): Promise<void> {
    log("info", "checkOverdueNow", "manual trigger");
    await this.sendOverdueReminders();
  }
}
