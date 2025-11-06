import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BrokerDispatch, RentalContract, Invoice, Trailer, RentalClient } from '@shared/schema';

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

  static generateInvoicePDF(data: InvoicePDFData): Buffer {
    const doc = new jsPDF();
    
    this.addHeader(doc, 'Invoice');
    
    let yPos = 50;
    
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, yPos);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #${data.invoiceNumber}`, 150, yPos);
    yPos += 6;
    doc.text(`Date: ${this.formatDate(data.createdAt)}`, 150, yPos);
    yPos += 6;
    doc.text(`Due Date: ${this.formatDate(data.dueDate)}`, 150, yPos);
    
    yPos += 15;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos, 75, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO', 22, yPos + 5);
    yPos += 12;
    
    doc.setFont('helvetica', 'normal');
    doc.text(data.contract.client.companyName, 22, yPos);
    yPos += 5;
    if (data.contract.client.tradeName) {
      doc.text(data.contract.client.tradeName, 22, yPos);
      yPos += 5;
    }
    doc.text(data.contract.client.email, 22, yPos);
    yPos += 5;
    doc.text(data.contract.client.phone, 22, yPos);
    if (data.contract.client.address) {
      yPos += 5;
      doc.text(data.contract.client.address, 22, yPos);
    }
    
    yPos += 15;
    
    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Period', 'Trailer', 'Amount']],
      body: [
        [
          'Monthly Trailer Rental',
          data.referenceMonth,
          data.contract.trailer.trailerId,
          this.formatCurrency(data.amount)
        ]
      ],
      theme: 'striped',
      headStyles: { 
        fillColor: [33, 51, 82],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      styles: { fontSize: 10 },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 10;
    
    const subtotal = parseFloat(data.amount.toString());
    const tax = 0;
    const total = subtotal + tax;
    
    doc.setFillColor(245, 247, 250);
    doc.rect(120, yPos, 70, 30, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', 125, yPos + 8);
    doc.text(this.formatCurrency(subtotal), 185, yPos + 8, { align: 'right' });
    
    doc.text('Tax:', 125, yPos + 16);
    doc.text(this.formatCurrency(tax), 185, yPos + 16, { align: 'right' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 125, yPos + 26);
    doc.text(this.formatCurrency(total), 185, yPos + 26, { align: 'right' });
    
    yPos += 45;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    const statusColor = data.status === 'paid' ? [34, 197, 94] : 
                       data.status === 'overdue' ? [239, 68, 68] : 
                       [251, 191, 36];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(20, yPos, 40, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${data.status.toUpperCase()}`, 22, yPos + 5);
    doc.setTextColor(0, 0, 0);
    
    if (data.status === 'paid' && data.paidDate) {
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid on: ${this.formatDate(data.paidDate)}`, 22, yPos);
    }
    
    yPos += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INSTRUCTIONS', 22, yPos);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const paymentInstructions = [
      'Bank: US Bank',
      'Account Name: Opus Rental Capital LLC',
      'Account Number: 1234567890',
      'Routing Number: 987654321',
      'Reference: ' + data.invoiceNumber
    ];
    
    paymentInstructions.forEach(line => {
      doc.text(line, 22, yPos);
      yPos += 5;
    });
    
    if (data.notes) {
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('NOTES', 22, yPos);
      yPos += 6;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(data.notes, 160);
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
}
