import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BrokerDispatch, RentalContract, Invoice, Trailer, RentalClient, Tenant } from '@shared/schema';
import {
  buildPaymentMethods,
  paymentMethodsToInstructionLines,
  type PaymentMethod,
} from './payment-methods.service';

interface DispatchPDFData extends BrokerDispatch {
  trailer: Trailer;
}

interface ContractPDFData extends RentalContract {
  client: RentalClient;
  trailer: Trailer;
}

interface InvoicePDFData extends Invoice {
  contract: RentalContract & {
    client: RentalClient;
    trailer: Trailer;
  };
  tenant?: Tenant | null;
}

export interface InvoiceDataItem {
  description: string;
  rate: number;
  qty: number;
  amount: number;
}

export interface InvoiceDataBillTo {
  companyName: string;
  tradeName: string | null;
  email: string;
  phone: string;
  address: string | null;
  taxId: string | null;
}

export interface InvoiceDataTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string | null;
  dueDate: string;
  billTo: InvoiceDataBillTo;
  items: InvoiceDataItem[];
  totals: InvoiceDataTotals;
  paymentInstructions: string[];
  paymentMethods: PaymentMethod[];
  status: string;
  referenceMonth: string;
  notes: string | null;
  paidDate: string | null;
}

export class PDFService {
  private static addHeader(doc: jsPDF, title: string) {
    doc.setFillColor(33, 51, 82);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Opus Rental Capital', 20, 20);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(title, 20, 30);
    
    doc.setTextColor(0, 0, 0);
  }

  private static addFooter(doc: jsPDF, pageNumber: number = 1) {
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Opus Rental Capital | Commercial Trailer Investments',
      doc.internal.pageSize.width / 2,
      pageHeight - 15,
      { align: 'center' }
    );
    doc.text(
      `Page ${pageNumber}`,
      doc.internal.pageSize.width / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  private static formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }

  private static formatCurrency(amount: string | number | null | undefined): string {
    if (!amount) return '$0.00';
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  }

  static generateDispatchPDF(data: DispatchPDFData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Broker Dispatch Document');
    
    let yPos = 50;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`Dispatch #${data.dispatchNumber}`, 20, yPos);
    
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${this.formatDate(data.createdAt)}`, 20, yPos);
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TRAILER INFORMATION', 22, yPos + 5);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    const trailerInfo = [
      ['Trailer ID:', data.trailer.trailerId],
      ['Model:', data.trailer.model],
      ['Type:', data.trailer.trailerType],
      ['Current Location:', data.trailer.location || 'N/A']
    ];
    
    trailerInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('BROKER INFORMATION', 22, yPos + 5);
    yPos += 12;
    
    const brokerInfo = [
      ['Broker Name:', data.brokerName],
      ['Email:', data.brokerEmail],
      ['Phone:', data.brokerPhone || 'N/A']
    ];
    
    brokerInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('DISPATCH DETAILS', 22, yPos + 5);
    yPos += 12;
    
    const dispatchInfo = [
      ['Pickup Location:', data.pickupLocation],
      ['Pickup Date:', this.formatDate(data.pickupDate)],
      ['Delivery Location:', data.deliveryLocation],
      ['Est. Delivery Date:', this.formatDate(data.estimatedDeliveryDate)],
      ['Load Type:', data.loadType.replace('_', ' ').toUpperCase()],
      ['Status:', data.status.toUpperCase()]
    ];
    
    dispatchInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    if (data.specialInstructions) {
      yPos += 5;
      doc.setFillColor(245, 247, 250);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('SPECIAL INSTRUCTIONS', 22, yPos + 5);
      yPos += 12;
      
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.specialInstructions, 160);
      doc.text(lines, 22, yPos);
      yPos += (lines.length * 6);
    }
    
    if (data.notes) {
      yPos += 5;
      doc.setFillColor(245, 247, 250);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('NOTES', 22, yPos + 5);
      yPos += 12;
      
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.notes, 160);
      doc.text(lines, 22, yPos);
    }
    
    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  static generateContractPDF(data: ContractPDFData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Trailer Rental Agreement');
    
    let yPos = 50;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('RENTAL CONTRACT', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(14);
    doc.text(`Contract #${data.contractNumber}`, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 15;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENT INFORMATION', 22, yPos + 5);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    const clientInfo = [
      ['Company Name:', data.client.companyName],
      ['Trade Name:', data.client.tradeName || 'N/A'],
      ['Email:', data.client.email],
      ['Phone:', data.client.phone],
      ['Address:', data.client.address || 'N/A']
    ];
    
    clientInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TRAILER INFORMATION', 22, yPos + 5);
    yPos += 12;
    
    const trailerInfo = [
      ['Trailer ID:', data.trailer.trailerId],
      ['Model:', data.trailer.model],
      ['Type:', data.trailer.trailerType],
      ['Value:', this.formatCurrency(data.trailer.currentValue)]
    ];
    
    trailerInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    yPos += 5;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('CONTRACT TERMS', 22, yPos + 5);
    yPos += 12;
    
    const contractTerms = [
      ['Start Date:', this.formatDate(data.startDate)],
      ['End Date:', this.formatDate(data.endDate)],
      ['Duration:', `${data.duration} months`],
      ['Monthly Rate:', this.formatCurrency(data.monthlyRate)],
      ['Total Contract Value:', this.formatCurrency(parseFloat(data.monthlyRate.toString()) * data.duration)],
      ['Status:', data.status.toUpperCase()]
    ];
    
    contractTerms.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPos);
      yPos += 6;
    });
    
    yPos += 10;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS AND CONDITIONS', 22, yPos + 5);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const terms = [
      '1. The Lessee agrees to pay the monthly rental fee by the 1st of each month.',
      '2. The trailer must be maintained in good condition and returned in the same state.',
      '3. Any damage to the trailer will be the responsibility of the Lessee.',
      '4. The Lessee must maintain comprehensive insurance coverage for the trailer.',
      '5. GPS tracking must remain active at all times during the rental period.',
      '6. This contract may be terminated with 30 days written notice by either party.',
      '7. Late payments will incur a 5% late fee per month.',
      '8. The trailer may not be subleased without written permission from Opus Rental Capital.'
    ];
    
    terms.forEach(term => {
      const lines = doc.splitTextToSize(term, 160);
      doc.text(lines, 22, yPos);
      yPos += (lines.length * 5);
    });
    
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SIGNATURES', 22, yPos);
    yPos += 10;
    
    doc.setFont('helvetica', 'normal');
    doc.line(22, yPos, 90, yPos);
    doc.text('Opus Rental Capital Representative', 22, yPos + 5);
    doc.text(`Date: ${this.formatDate(new Date())}`, 22, yPos + 10);
    
    doc.line(110, yPos, 180, yPos);
    doc.text('Client Representative', 110, yPos + 5);
    doc.text('Date: _________________', 110, yPos + 10);
    
    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  /**
   * Normalize a date-like value coming from drizzle (`date` columns are
   * returned as ISO strings, `timestamp` columns as Date objects) into an
   * ISO 8601 string. Returns null when the input is null/undefined.
   */
  private static toISO(value: Date | string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    if (value instanceof Date) return value.toISOString();
    return value;
  }

  /**
   * Build the structured invoice data used by both the PDF renderer and the
   * JSON API endpoint. This is the single source of truth for what an invoice
   * looks like — keeping PDF and JSON consistent.
   */
  static buildInvoiceData(data: InvoicePDFData): InvoiceData {
    const rate = parseFloat(data.contract.monthlyRate.toString());
    const qty = 1;
    const amount = rate * qty;
    const tax = 0;
    const subtotal = amount;
    const total = subtotal + tax;

    const description = `Locação Mensal — ${data.contract.trailer.trailerId} — ${data.referenceMonth}`;

    const dueDate = this.toISO(data.dueDate);
    if (!dueDate) {
      throw new Error('Invoice is missing a due date');
    }

    const paymentMethods = buildPaymentMethods(data.tenant ?? null, {
      id: data.id,
      invoiceNumber: data.invoiceNumber,
      amount: data.amount,
    });
    const paymentInstructions = paymentMethodsToInstructionLines(paymentMethods);

    return {
      invoiceNumber: data.invoiceNumber,
      issueDate: this.toISO(data.createdAt),
      dueDate,
      billTo: {
        companyName: data.contract.client.companyName,
        tradeName: data.contract.client.tradeName ?? null,
        email: data.contract.client.email,
        phone: data.contract.client.phone,
        address: data.contract.client.address ?? null,
        taxId: data.contract.client.taxId ?? null,
      },
      items: [
        {
          description,
          rate,
          qty,
          amount,
        },
      ],
      totals: {
        subtotal,
        tax,
        total,
      },
      paymentInstructions,
      paymentMethods,
      status: data.status,
      referenceMonth: data.referenceMonth,
      notes: data.notes ?? null,
      paidDate: this.toISO(data.paidDate),
    };
  }

  static generateInvoicePDF(data: InvoicePDFData): Buffer {
    const invoiceData = this.buildInvoiceData(data);
    const doc = new jsPDF();

    this.addHeader(doc, 'Invoice');

    let yPos = 50;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, yPos);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${invoiceData.invoiceNumber}`, 150, yPos);
    yPos += 6;
    doc.text(`Date: ${this.formatDate(invoiceData.issueDate)}`, 150, yPos);
    yPos += 6;
    doc.text(`Due Date: ${this.formatDate(invoiceData.dueDate)}`, 150, yPos);

    yPos += 15;

    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 75, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 22, yPos + 5);
    yPos += 12;

    doc.setFont('helvetica', 'normal');
    doc.text(invoiceData.billTo.companyName, 22, yPos);
    yPos += 5;
    if (invoiceData.billTo.tradeName) {
      doc.text(invoiceData.billTo.tradeName, 22, yPos);
      yPos += 5;
    }
    doc.text(invoiceData.billTo.email, 22, yPos);
    yPos += 5;
    doc.text(invoiceData.billTo.phone, 22, yPos);
    if (invoiceData.billTo.address) {
      yPos += 5;
      doc.text(invoiceData.billTo.address, 22, yPos);
    }

    yPos += 15;

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Rate', 'Qty', 'Amount']],
      body: invoiceData.items.map((item) => [
        item.description,
        this.formatCurrency(item.rate),
        String(item.qty),
        this.formatCurrency(item.amount),
      ]),
      theme: 'striped',
      headStyles: {
        fillColor: [33, 51, 82],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right', fontStyle: 'bold' },
      },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFillColor(245, 247, 250);
    doc.rect(120, yPos, 70, 30, 'F');

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 125, yPos + 8);
    doc.text(this.formatCurrency(invoiceData.totals.subtotal), 185, yPos + 8, { align: 'right' });

    doc.text('Tax:', 125, yPos + 16);
    doc.text(this.formatCurrency(invoiceData.totals.tax), 185, yPos + 16, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 125, yPos + 26);
    doc.text(this.formatCurrency(invoiceData.totals.total), 185, yPos + 26, { align: 'right' });

    yPos += 45;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');

    const statusColor = invoiceData.status === 'paid' ? [34, 197, 94] :
                       invoiceData.status === 'overdue' ? [239, 68, 68] :
                       [251, 191, 36];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(20, yPos, 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${invoiceData.status.toUpperCase()}`, 22, yPos + 5);
    doc.setTextColor(0, 0, 0);

    if (invoiceData.status === 'paid' && invoiceData.paidDate) {
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid on: ${this.formatDate(invoiceData.paidDate)}`, 22, yPos);
    }

    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INSTRUCTIONS', 22, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    invoiceData.paymentInstructions.forEach((line) => {
      doc.text(line, 22, yPos);
      yPos += 5;
    });

    if (invoiceData.notes) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('NOTES', 22, yPos);
      yPos += 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(invoiceData.notes, 160);
      doc.text(lines, 22, yPos);
    }

    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  static generateFinancialReportPDF(
    reportData: {
      month: string;
      totalRevenue: number;
      investorPayouts: number;
      operationalCosts: number;
      companyMargin: number;
      activeTrailers: number;
      totalInvestors: number;
      payments: Array<{
        investor: string;
        shares: number;
        amount: number;
      }>;
    }
  ): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Monthly Financial Report');
    
    let yPos = 50;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL REPORT', doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 8;
    doc.setFontSize(14);
    doc.text(reportData.month, doc.internal.pageSize.width / 2, yPos, { align: 'center' });
    
    yPos += 20;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('SUMMARY', 22, yPos + 5);
    yPos += 15;
    
    const summary = [
      ['Total Revenue:', this.formatCurrency(reportData.totalRevenue)],
      ['Investor Payouts:', this.formatCurrency(reportData.investorPayouts)],
      ['Operational Costs:', this.formatCurrency(reportData.operationalCosts)],
      ['Company Margin:', this.formatCurrency(reportData.companyMargin)],
      ['Active Trailers:', reportData.activeTrailers.toString()],
      ['Total Investors:', reportData.totalInvestors.toString()]
    ];
    
    summary.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 22, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 120, yPos, { align: 'right' });
      yPos += 7;
    });
    
    yPos += 10;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('INVESTOR PAYMENTS', 22, yPos + 5);
    yPos += 12;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Investor', 'Active Shares', 'Payment Amount']],
      body: reportData.payments.map(p => [
        p.investor,
        p.shares.toString(),
        this.formatCurrency(p.amount)
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: [33, 51, 82],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 9 },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    this.addFooter(doc);
    
    return Buffer.from(doc.output('arraybuffer'));
  }

  static generateInspectionReport(checklist: any, trailer: Trailer): Buffer {
    const doc = new jsPDF();
    
    // Header
    this.addHeader(doc, 'Inspection Report');
    
    // Checklist Info Section
    let yPos = 50;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Details', 20, yPos);
    
    yPos += 10;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    
    // Info grid
    const infoData = [
      ['Inspection ID:', checklist.id.substring(0, 8).toUpperCase()],
      ['Trailer ID:', trailer.trailerId],
      ['Inspection Type:', this.getInspectionTypeLabel(checklist.type)],
      ['Inspector:', checklist.inspector],
      ['Inspection Date:', this.formatDate(checklist.inspectionDate)],
      ['Status:', checklist.approved ? '✓ APPROVED' : (checklist.rejected ? '✗ REJECTED' : '⏳ PENDING')],
    ];

    if (checklist.approvedBy) {
      const approvedDate = checklist.approvedAt ? this.formatDate(checklist.approvedAt) : 'N/A';
      infoData.push(['Reviewed on:', approvedDate]);
    }

    if (checklist.rejectionReason) {
      infoData.push(['Rejection Reason:', checklist.rejectionReason]);
    }

    autoTable(doc, {
      startY: yPos,
      body: infoData,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 120 }
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Inspection Items Section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Checklist', 20, yPos);
    yPos += 5;

    const items = checklist.items || [];
    const itemsData = items.map((item: any) => [
      item.item,
      this.getStatusLabel(item.status),
      item.notes || '-'
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Item', 'Status', 'Notes']],
      body: itemsData,
      theme: 'grid',
      headStyles: {
        fillColor: [33, 51, 82],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 90 }
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      didParseCell: (data) => {
        if (data.column.index === 1 && data.section === 'body') {
          const status = items[data.row.index]?.status;
          if (status === 'ok') {
            data.cell.styles.textColor = [34, 197, 94]; // Green
            data.cell.styles.fontStyle = 'bold';
          } else if (status === 'issue') {
            data.cell.styles.textColor = [239, 68, 68]; // Red
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [107, 114, 128]; // Gray
          }
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Summary Section
    if (yPos > doc.internal.pageSize.height - 80) {
      doc.addPage();
      yPos = 20;
    }

    const okCount = items.filter((item: any) => item.status === 'ok').length;
    const issueCount = items.filter((item: any) => item.status === 'issue').length;
    const naCount = items.filter((item: any) => item.status === 'na').length;
    const totalItems = items.length;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Inspection Summary', 20, yPos);
    yPos += 10;

    const summaryData = [
      ['Total Items Checked:', totalItems.toString()],
      ['Items OK:', `${okCount} (${totalItems > 0 ? Math.round((okCount / totalItems) * 100) : 0}%)`],
      ['Items with Issues:', `${issueCount} (${totalItems > 0 ? Math.round((issueCount / totalItems) * 100) : 0}%)`],
      ['Items N/A:', `${naCount} (${totalItems > 0 ? Math.round((naCount / totalItems) * 100) : 0}%)`],
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'plain',
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 50 }
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Additional Notes
    if (checklist.notes) {
      if (yPos > doc.internal.pageSize.height - 60) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes:', 20, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(checklist.notes, 170);
      doc.text(splitNotes, 20, yPos);
    }

    // Footer
    this.addFooter(doc);

    return Buffer.from(doc.output('arraybuffer'));
  }

  private static getInspectionTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      pre_rental: 'Pre-Rental Inspection',
      maintenance: 'Maintenance Inspection',
      arrival: 'Arrival Inspection',
    };
    return labels[type] || type;
  }

  private static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      ok: '✓ OK',
      issue: '✗ Issue',
      na: '- N/A',
    };
    return labels[status] || status;
  }
}
