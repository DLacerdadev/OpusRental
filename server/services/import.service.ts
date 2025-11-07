import * as XLSX from "xlsx";
import { db } from "../db";
import { trailers, rentalClients, insertTrailerSchema, insertRentalClientSchema } from "../../shared/schema";
import { z } from "zod";

interface ImportResult {
  success: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export class ImportService {
  static async importTrailers(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
    };

    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      result.total = data.length;

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2; // Excel rows start at 1, header is row 1

        try {
          const trailerData = {
            trailerId: row["Trailer ID"] || row["trailerId"] || row["trailer_id"] || `TR${String(Date.now()).slice(-6)}`,
            trailerType: row["Type"] || row["trailerType"] || row["trailer_type"] || "Seco",
            model: row["Model"] || row["model"] || "Dry Van 53ft",
            purchaseValue: parseFloat(row["Purchase Value"] || row["purchaseValue"] || row["purchase_value"] || "28000"),
            currentValue: parseFloat(row["Current Value"] || row["currentValue"] || row["current_value"] || row["Purchase Value"] || row["purchaseValue"] || "28000"),
            purchaseDate: row["Purchase Date"] || row["purchaseDate"] || row["purchase_date"] || new Date().toISOString().split('T')[0],
            status: (row["Status"] || row["status"] || "stock").toLowerCase(),
            location: row["Location"] || row["location"] || "",
            depreciationRate: parseFloat(row["Depreciation Rate"] || row["depreciationRate"] || row["depreciation_rate"] || "0.05"),
            expirationDate: row["Expiration Date"] || row["expirationDate"] || row["expiration_date"] || null,
            totalShares: parseInt(row["Total Shares"] || row["totalShares"] || row["total_shares"] || "1"),
          };

          const validated = insertTrailerSchema.parse(trailerData);
          await db.insert(trailers).values(validated);
          result.imported++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error.message || "Unknown error",
            data: row,
          });
        }
      }

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push({
        row: 0,
        error: `File parsing error: ${error.message}`,
        data: null,
      });
    }

    return result;
  }

  static async importRentalClients(buffer: Buffer): Promise<ImportResult> {
    const result: ImportResult = {
      success: true,
      total: 0,
      imported: 0,
      failed: 0,
      errors: [],
    };

    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      result.total = data.length;

      for (let i = 0; i < data.length; i++) {
        const row: any = data[i];
        const rowNumber = i + 2;

        try {
          const clientData = {
            companyName: row["Company Name"] || row["companyName"] || row["company_name"],
            tradeName: row["Trade Name"] || row["tradeName"] || row["trade_name"] || null,
            taxId: row["Tax ID"] || row["taxId"] || row["tax_id"],
            email: row["Email"] || row["email"],
            phone: row["Phone"] || row["phone"],
            address: row["Address"] || row["address"] || null,
            city: row["City"] || row["city"] || null,
            state: row["State"] || row["state"] || null,
            zipCode: row["Zip Code"] || row["zipCode"] || row["zip_code"] || null,
            country: row["Country"] || row["country"] || "US",
            status: (row["Status"] || row["status"] || "active").toLowerCase(),
          };

          const validated = insertRentalClientSchema.parse(clientData);
          await db.insert(rentalClients).values(validated);
          result.imported++;
        } catch (error: any) {
          result.failed++;
          result.errors.push({
            row: rowNumber,
            error: error.message || "Unknown error",
            data: row,
          });
        }
      }

      result.success = result.failed === 0;
    } catch (error: any) {
      result.success = false;
      result.errors.push({
        row: 0,
        error: `File parsing error: ${error.message}`,
        data: null,
      });
    }

    return result;
  }

  static generateTrailerTemplate(): Buffer {
    const templateData = [
      {
        "Trailer ID": "TR001",
        "Type": "Seco",
        "Model": "Dry Van 53ft",
        "Purchase Value": 28000,
        "Current Value": 28000,
        "Purchase Date": "2024-01-15",
        "Status": "stock",
        "Location": "Los Angeles, CA",
        "Depreciation Rate": "0.05",
        "Expiration Date": "",
        "Total Shares": 1,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Trailers Template");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }

  static generateClientTemplate(): Buffer {
    const templateData = [
      {
        "Company Name": "Example Transport LLC",
        "Trade Name": "Example Transport",
        "Tax ID": "12-3456789",
        "Email": "contact@example.com",
        "Phone": "+1-555-0123",
        "Address": "123 Main Street",
        "City": "New York",
        "State": "NY",
        "Zip Code": "10001",
        "Country": "US",
        "Status": "active",
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Clients Template");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}
