import * as XLSX from "xlsx";
import { db } from "../db";
import { trailers, shares, invoices, rentalClients, rentalContracts, users, financialRecords } from "../../shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class ExportService {
  static async exportTrailers() {
    const allTrailers = await db.select().from(trailers).orderBy(desc(trailers.createdAt));

    const data = allTrailers.map(t => ({
      "Trailer ID": t.trailerId,
      "Type": t.trailerType,
      "Model": t.model,
      "Purchase Value": t.purchaseValue,
      "Current Value": t.currentValue,
      "Purchase Date": t.purchaseDate,
      "Status": t.status,
      "Location": t.location || "",
      "Depreciation Rate": t.depreciationRate,
      "Expiration Date": t.expirationDate || "",
      "Total Shares": t.totalShares,
      "Created At": t.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trailers");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  static async exportInvoices(startDate?: string, endDate?: string) {
    let query = db.select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      contractId: invoices.contractId,
      amount: invoices.amount,
      dueDate: invoices.dueDate,
      status: invoices.status,
      paidDate: invoices.paidDate,
      createdAt: invoices.createdAt,
    }).from(invoices);

    if (startDate && endDate) {
      query = query.where(
        and(
          gte(invoices.createdAt, new Date(startDate)),
          lte(invoices.createdAt, new Date(endDate))
        )
      ) as any;
    }

    const allInvoices = await query.orderBy(desc(invoices.createdAt));

    const data = allInvoices.map(inv => ({
      "Invoice Number": inv.invoiceNumber,
      "Contract ID": inv.contractId,
      "Amount": inv.amount,
      "Due Date": inv.dueDate,
      "Status": inv.status,
      "Paid Date": inv.paidDate || "Not Paid",
      "Created At": inv.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  static async exportShares() {
    const allShares = await db
      .select({
        shareId: shares.id,
        trailerId: shares.trailerId,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        purchaseValue: shares.purchaseValue,
        purchaseDate: shares.purchaseDate,
        status: shares.status,
        monthlyReturn: shares.monthlyReturn,
        totalReturns: shares.totalReturns,
        createdAt: shares.createdAt,
      })
      .from(shares)
      .leftJoin(users, eq(shares.userId, users.id))
      .orderBy(desc(shares.createdAt));

    const data = allShares.map(s => ({
      "Share ID": s.shareId,
      "Trailer ID": s.trailerId,
      "Investor Name": `${s.userFirstName || ''} ${s.userLastName || ''}`.trim() || "N/A",
      "Investor Email": s.userEmail,
      "Purchase Value": s.purchaseValue,
      "Purchase Date": s.purchaseDate,
      "Status": s.status,
      "Monthly Return %": s.monthlyReturn,
      "Total Returns": s.totalReturns,
      "Created At": s.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Investment Shares");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  static async exportFinancialReport(year: number, month: number) {
    const targetMonth = `${year}-${String(month).padStart(2, '0')}`;

    const record = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.month, targetMonth))
      .limit(1);

    if (record.length === 0) {
      const summaryData = [
        { "Metric": "Total Revenue", "Amount": 0 },
        { "Metric": "Investor Payouts", "Amount": 0 },
        { "Metric": "Operational Costs", "Amount": 0 },
        { "Metric": "Company Margin", "Amount": 0 },
      ];

      const worksheet = XLSX.utils.json_to_sheet(summaryData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");

      return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    }

    const r = record[0];

    const summaryData = [
      { "Metric": "Month", "Value": r.month },
      { "Metric": "Total Revenue", "Amount": r.totalRevenue },
      { "Metric": "Investor Payouts", "Amount": r.investorPayouts },
      { "Metric": "Operational Costs", "Amount": r.operationalCosts },
      { "Metric": "Company Margin", "Amount": r.companyMargin },
    ];

    const workbook = XLSX.utils.book_new();
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, "Financial Summary");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }

  static async exportRentalClients() {
    const clients = await db.select().from(rentalClients).orderBy(desc(rentalClients.createdAt));

    const data = clients.map(c => ({
      "Client ID": c.id,
      "Company Name": c.companyName,
      "Trade Name": c.tradeName || "",
      "Tax ID": c.taxId,
      "Email": c.email,
      "Phone": c.phone,
      "Address": c.address || "",
      "City": c.city || "",
      "State": c.state || "",
      "Zip Code": c.zipCode || "",
      "Country": c.country,
      "Status": c.status,
      "Created At": c.createdAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Rental Clients");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    return buffer;
  }
}
