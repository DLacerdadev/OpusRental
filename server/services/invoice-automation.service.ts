import cron from "node-cron";
import { storage } from "../storage";
import { EmailService } from "./email.service";
import type { RentalContract, Invoice } from "@shared/schema";

export class InvoiceAutomationService {
  private static isRunning = false;

  /**
   * Initialize cron jobs for invoice automation
   */
  static initialize() {
    if (this.isRunning) {
      console.log("⚠️  Invoice automation already running");
      return;
    }

    console.log("🤖 Initializing Invoice Automation Service...");

    // Generate invoices on the 1st of every month at 00:01
    cron.schedule("1 0 1 * *", async () => {
      console.log("📅 Running monthly invoice generation...");
      await this.generateMonthlyInvoices();
    });

    // Check for overdue invoices daily at 09:00
    cron.schedule("0 9 * * *", async () => {
      console.log("⏰ Checking for overdue invoices...");
      await this.sendOverdueReminders();
    });

    // Send reminder 3 days before due date at 09:00
    cron.schedule("0 9 * * *", async () => {
      console.log("📧 Sending upcoming due date reminders...");
      await this.sendUpcomingDueReminders();
    });

    this.isRunning = true;
    console.log("✅ Invoice automation service started");
    console.log("   - Monthly generation: 1st of month at 00:01");
    console.log("   - Overdue checks: Daily at 09:00");
    console.log("   - Due date reminders: Daily at 09:00");
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

      console.log(`📊 Found ${activeContracts.length} active contracts with auto-generation enabled`);

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
            console.log(`⏭️  Skipping ${contract.contractNumber} - invoice already exists for ${currentMonth}`);
            skipped++;
            continue;
          }

          // Generate invoice number
          const allInvoices = await storage.getAllInvoices();
          const invoiceNumber = `INV-${String(allInvoices.length + 1).padStart(4, "0")}`;

          // Calculate due date based on contract settings
          const dueDate = new Date(today);
          dueDate.setDate(dueDate.getDate() + (contract.paymentDueDays || 15));

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

          console.log(`✅ Generated ${invoiceNumber} for ${contract.contractNumber}`);
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
              console.log(`   ❌ Failed to send email to ${client.email}: ${errorMessage}`);
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
              console.log(`   📧 Email sent to ${client.email}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error generating invoice for ${contract.contractNumber}:`, error);
          errors++;
        }
      }

      console.log(`\n📊 Invoice Generation Summary:`);
      console.log(`   ✅ Generated: ${generated}`);
      console.log(`   ⏭️  Skipped: ${skipped}`);
      console.log(`   ❌ Errors: ${errors}`);
    } catch (error) {
      console.error("❌ Error in generateMonthlyInvoices:", error);
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
        if (invoice.status !== "pending" && invoice.status !== "overdue") {
          return false;
        }
        const dueDate = new Date(invoice.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      });

      console.log(`📧 Found ${overdueInvoices.length} overdue invoices`);

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
            `⚠️ Payment Reminder - Invoice ${invoice.invoiceNumber} (${daysOverdue} days overdue)`,
            "payment_reminder",
            "invoice",
            invoice.id,
            emailStatus,
            errorMessage
          );
          await storage.createEmailLog(emailLog);

          if (emailStatus === "sent") {
            console.log(`   📧 Reminder sent for ${invoice.invoiceNumber} (${daysOverdue} days overdue)`);
            sent++;
          } else {
            console.log(`   ❌ Failed to send reminder for ${invoice.invoiceNumber}: ${errorMessage}`);
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error sending reminder for ${invoice.invoiceNumber}:`, error);
          errors++;
        }
      }

      console.log(`\n📊 Overdue Reminders Summary:`);
      console.log(`   ✅ Sent: ${sent}`);
      console.log(`   ❌ Errors: ${errors}`);
    } catch (error) {
      console.error("❌ Error in sendOverdueReminders:", error);
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

      console.log(`📧 Found ${upcomingInvoices.length} invoices due in 3 days`);

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
            console.log(`   📧 Due date reminder sent for ${invoice.invoiceNumber}`);
            sent++;
          } else {
            errors++;
          }
        } catch (error) {
          console.error(`❌ Error sending due reminder for ${invoice.invoiceNumber}:`, error);
          errors++;
        }
      }

      if (sent > 0 || errors > 0) {
        console.log(`\n📊 Due Date Reminders Summary:`);
        console.log(`   ✅ Sent: ${sent}`);
        console.log(`   ❌ Errors: ${errors}`);
      }
    } catch (error) {
      console.error("❌ Error in sendUpcomingDueReminders:", error);
    }
  }

  /**
   * Manually trigger invoice generation (for testing)
   */
  static async generateInvoicesNow(): Promise<void> {
    console.log("🔧 Manually triggering invoice generation...");
    await this.generateMonthlyInvoices();
  }

  /**
   * Manually trigger overdue check (for testing)
   */
  static async checkOverdueNow(): Promise<void> {
    console.log("🔧 Manually triggering overdue check...");
    await this.sendOverdueReminders();
  }
}
