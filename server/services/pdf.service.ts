import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BrokerDispatch, RentalContract, Invoice, InvoiceItem, Trailer, RentalClient, Tenant } from '@shared/schema';
import {
  buildPaymentMethods,
  paymentMethodsToInstructionLines,
  type PaymentMethod,
} from './payment-methods.service';
import { buildPublicPaymentUrl } from './invoice-token.service';

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
  /**
   * Optional per-row breakdown of the invoice. When this array is non-empty,
   * the renderer uses it as the source of truth for the line-items table and
   * recomputes totals from it. When undefined or empty, the renderer falls
   * back to the legacy single-row "Locação Mensal — {trailer} — {month}"
   * synthesized from `contract.monthlyRate`, so existing invoices without
   * stored items keep producing identical output.
   */
  lineItems?: InvoiceItem[];
  /**
   * Pre-fetched tenant logo as a data URL (e.g. "data:image/png;base64,...").
   * Renderer is synchronous, so the caller is responsible for fetching the
   * `tenant.logoUrl` in advance and passing it here. When omitted the header
   * falls back to the brand name only.
   */
  tenantLogoDataUrl?: string | null;
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const LOGO_FETCH_TIMEOUT_MS = 5_000;
const MAX_REDIRECT_HOPS = 5;

/**
 * Returns true when the given numeric IP address (v4 or v6) is in a range we
 * MUST NOT make outbound requests to from server context (loopback, private,
 * link-local, CGNAT, benchmarking, multicast, IPv4-mapped IPv6, etc.).
 *
 * Designed to be the single chokepoint for SSRF protection — the URL host
 * must resolve to a public, routable address before we issue the HTTP
 * request, and again on every redirect hop.
 */
function isPrivateIp(ip: string): boolean {
  const lower = ip.toLowerCase();

  // IPv4-mapped IPv6 (`::ffff:0:0/96`) covers both:
  //   - dotted-decimal form: `::ffff:127.0.0.1`
  //   - hex-compressed form: `::ffff:7f00:1`
  // Both refer to the same underlying IPv4 host. The dotted form is decoded
  // back to v4 for precise range checking; for the hex form there's no
  // legitimate use case in a tenant-supplied URL — block the entire `::ffff:`
  // prefix to prevent textual-encoding bypasses to loopback / private IPs.
  if (lower.startsWith('::ffff:')) {
    const dotted = lower.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
    if (dotted) return isPrivateIp(dotted[1]);
    // Hex form (or anything else under ::ffff:) — refuse outright.
    return true;
  }

  // IPv4 literal
  const v4 = lower.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [, a, b] = v4.map(Number);
    // 0.0.0.0/8 (current network)
    if (a === 0) return true;
    // 10.0.0.0/8 private
    if (a === 10) return true;
    // 127.0.0.0/8 loopback
    if (a === 127) return true;
    // 169.254.0.0/16 link-local (incl. AWS/GCP metadata 169.254.169.254)
    if (a === 169 && b === 254) return true;
    // 172.16.0.0/12 private
    if (a === 172 && b >= 16 && b <= 31) return true;
    // 192.168.0.0/16 private
    if (a === 192 && b === 168) return true;
    // 100.64.0.0/10 CGNAT
    if (a === 100 && b >= 64 && b <= 127) return true;
    // 198.18.0.0/15 benchmarking
    if (a === 198 && (b === 18 || b === 19)) return true;
    // 224.0.0.0/4 multicast, 240.0.0.0/4 reserved
    if (a >= 224) return true;
    return false;
  }

  // IPv6 loopback / unspecified
  if (lower === '::1' || lower === '::') return true;
  // Link-local fe80::/10
  if (/^fe[89ab][0-9a-f]?:/.test(lower)) return true;
  // Unique-local fc00::/7
  if (/^f[cd][0-9a-f]{0,2}:/.test(lower)) return true;
  // Multicast ff00::/8
  if (lower.startsWith('ff')) return true;

  return false;
}

/**
 * Resolve the URL's hostname and ensure every returned address is public.
 * Throws when the URL is unsafe (bad scheme, unresolvable, or any address
 * lands inside a blocked range — also catches DNS rebinding for this hop).
 */
async function assertSafeHttpsUrl(rawUrl: string): Promise<URL> {
  const dns = await import('node:dns/promises');
  const net = await import('node:net');

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error('invalid url');
  }
  if (parsed.protocol !== 'https:') throw new Error('non-https');

  // If the host is itself an IP literal, validate it directly (no DNS needed).
  if (net.isIP(parsed.hostname)) {
    if (isPrivateIp(parsed.hostname)) throw new Error('private ip literal');
    return parsed;
  }

  // Otherwise resolve all addresses and reject if any is private. We check
  // every record to defend against round-robin rebinding tricks.
  const addrs = await dns.lookup(parsed.hostname, { all: true });
  if (!addrs.length) throw new Error('dns: no addresses');
  for (const a of addrs) {
    if (isPrivateIp(a.address)) throw new Error(`dns: private address ${a.address}`);
  }
  return parsed;
}

/**
 * Best-effort fetch of a remote image, returned as a data URL the PDF
 * renderer can embed. Returns null on any failure so the caller falls back
 * to a name-only header without aborting PDF generation.
 *
 * SSRF / DOS hardening:
 *  - HTTPS only.
 *  - Per-hop DNS resolution: every resolved IP must be public (defends
 *    against private-IP literals, IPv4-mapped IPv6, CGNAT, link-local,
 *    cloud metadata addresses, multicast, etc.).
 *  - Manual redirect loop (max 5 hops) re-runs the host check before
 *    following any 3xx, blocking redirect-to-private bypass.
 *  - 5s `AbortController` timeout for the entire fetch chain.
 *  - `Content-Length` precheck plus 2MB hard cap on the streamed body
 *    (with reader.cancel() on overflow).
 *  - `Content-Type` must start with `image/`.
 *
 * Note: a determined attacker could still race DNS between our `lookup` and
 * Node's internal resolution (classic DNS rebinding). For a production
 * threat model of "tenant supplies a logo URL" this is acceptable — the
 * payload is bounded, the response body is base64-embedded into a PDF only,
 * and no response data is echoed back to the attacker.
 */
export async function fetchLogoAsDataUrl(url: string | null | undefined): Promise<string | null> {
  if (!url || typeof url !== 'string') return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LOGO_FETCH_TIMEOUT_MS);

  try {
    let currentUrl = url;
    let res: Response | null = null;

    for (let hop = 0; hop <= MAX_REDIRECT_HOPS; hop++) {
      const safe = await assertSafeHttpsUrl(currentUrl);
      const r = await fetch(safe.toString(), {
        redirect: 'manual',
        signal: controller.signal,
      });

      // Handle redirects ourselves so we can re-validate the next host.
      if (r.status >= 300 && r.status < 400) {
        const loc = r.headers.get('location');
        if (!loc) return null;
        // Resolve relative redirects against the current URL.
        currentUrl = new URL(loc, safe).toString();
        try { await r.body?.cancel(); } catch { /* ignore */ }
        continue;
      }

      res = r;
      break;
    }

    if (!res) return null; // exhausted redirect budget
    if (!res.ok) return null;

    const contentType = (res.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
    if (!contentType.startsWith('image/')) return null;

    const declaredLength = Number(res.headers.get('content-length') ?? '0');
    if (declaredLength && declaredLength > MAX_LOGO_BYTES) return null;

    if (!res.body) return null;
    const reader = res.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        total += value.byteLength;
        if (total > MAX_LOGO_BYTES) {
          try { await reader.cancel(); } catch { /* ignore */ }
          return null;
        }
        chunks.push(value);
      }
    }
    if (total === 0) return null;
    const buf = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    return `data:${contentType};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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

export interface InvoiceDataTrailer {
  trailerId: string;
  model: string | null;
  make: string | null;
  year: number | null;
  vin: string | null;
}

export interface InvoiceData {
  invoiceNumber: string;
  issueDate: string | null;
  dueDate: string;
  billTo: InvoiceDataBillTo;
  trailer?: InvoiceDataTrailer;
  items: InvoiceDataItem[];
  totals: InvoiceDataTotals;
  paymentInstructions: string[];
  paymentMethods: PaymentMethod[];
  status: string;
  referenceMonth: string;
  notes: string | null;
  paidDate: string | null;
}

const DEFAULT_BRAND_NAME = 'Opus Rental Capital';

export class PDFService {
  private static addHeader(
    doc: jsPDF,
    title: string,
    brandName?: string | null,
    logoDataUrl?: string | null,
  ) {
    const name = (brandName && brandName.trim()) || DEFAULT_BRAND_NAME;
    doc.setFillColor(33, 51, 82);
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');

    let textX = 20;
    if (logoDataUrl) {
      try {
        // Pick the jsPDF format string from the data URL MIME type. jsPDF
        // does NOT auto-detect; passing the wrong format silently corrupts
        // the embedded image (e.g. JPEG bytes interpreted as PNG → blank
        // header). Default to PNG when MIME is unknown so behaviour stays
        // unchanged for already-deployed PNG logos.
        let format: 'PNG' | 'JPEG' | 'WEBP' = 'PNG';
        const mimeMatch = logoDataUrl.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
        const mime = mimeMatch?.[1]?.toLowerCase();
        if (mime === 'jpeg' || mime === 'jpg') format = 'JPEG';
        else if (mime === 'webp') format = 'WEBP';
        doc.addImage(logoDataUrl, format, 14, 8, 24, 24);
        textX = 44;
      } catch {
        // Silent fallback to name-only header.
      }
    }

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(name, textX, 20);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(title, textX, 30);

    doc.setTextColor(0, 0, 0);
  }

  private static addFooter(doc: jsPDF, pageNumber: number = 1, brandName?: string | null) {
    const pageHeight = doc.internal.pageSize.height;
    const name = (brandName && brandName.trim()) || DEFAULT_BRAND_NAME;

    doc.setFontSize(9);
    doc.setTextColor(128, 128, 128);
    doc.text(
      name,
      doc.internal.pageSize.width / 2,
      pageHeight - 15,
      { align: 'center' }
    );
    doc.text(
      `Página ${pageNumber}`,
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
    // Items: prefer stored line-items when present (multi-trailer / add-ons);
    // otherwise synthesize the legacy single "Monthly Rental" row from the
    // contract so existing single-trailer invoices keep producing identical
    // output. The line-items subtotal is always recomputed so the table sum
    // and the totals block can never disagree.
    let items: InvoiceDataItem[];
    if (data.lineItems && data.lineItems.length > 0) {
      items = data.lineItems.map((item) => {
        const rate = parseFloat(item.rate.toString());
        const qty = parseFloat(item.quantity.toString());
        const amount = parseFloat(item.amount.toString());
        return {
          description: item.description,
          rate,
          qty,
          amount,
        };
      });
    } else {
      const rate = parseFloat(data.contract.monthlyRate.toString());
      const qty = 1;
      const amount = rate * qty;
      const description = `Monthly Rental — ${data.contract.trailer.trailerId} — ${data.referenceMonth}`;
      items = [{ description, rate, qty, amount }];
    }

    // Sales tax: prefer the per-invoice values stored on the invoice itself
    // so historical invoices stay frozen. For legacy invoices created before
    // tax localization was rolled out (no stored subtotal/salesTaxAmount), we
    // intentionally do NOT retroactively apply the tenant's current default
    // rate — the PDF total must always equal `invoice.amount` so the customer
    // never sees a number different from what Stripe will actually charge.
    // In that legacy case we treat the entire stored amount as the line total
    // with zero sales tax.
    const itemsSubtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const storedSubtotal = data.subtotal != null ? parseFloat(data.subtotal.toString()) : null;
    const storedTax = data.salesTaxAmount != null ? parseFloat(data.salesTaxAmount.toString()) : null;
    const storedAmount = parseFloat((data.amount ?? "0").toString());
    const hasStoredBreakdown = storedSubtotal != null && Number.isFinite(storedSubtotal)
      && storedTax != null && Number.isFinite(storedTax);

    let subtotal: number;
    let tax: number;
    let total: number;
    if (hasStoredBreakdown) {
      subtotal = storedSubtotal!;
      tax = storedTax!;
      total = subtotal + tax;
    } else {
      // Legacy invoice: prefer the amount stored on the invoice (= what
      // Stripe charges) so PDF and charge always agree. If for some reason
      // the stored amount is not parseable, fall back to the items subtotal.
      const safeAmount = Number.isFinite(storedAmount) ? storedAmount : itemsSubtotal;
      total = safeAmount;
      subtotal = safeAmount;
      tax = 0;
    }

    const dueDate = this.toISO(data.dueDate);
    if (!dueDate) {
      throw new Error('Invoice is missing a due date');
    }

    let publicPaymentUrl: string | null = null;
    try {
      publicPaymentUrl = buildPublicPaymentUrl(data.id);
    } catch {
      publicPaymentUrl = null;
    }

    const paymentMethods = buildPaymentMethods(
      data.tenant ?? null,
      {
        id: data.id,
        invoiceNumber: data.invoiceNumber,
        amount: data.amount,
      },
      { publicPaymentUrl },
    );
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
      // Trailer summary surfaced for the invoice detail/preview view so
      // managers can verify which physical reboque (and its VIN) is being
      // billed without leaving the screen.
      trailer: {
        trailerId: data.contract.trailer.trailerId,
        model: data.contract.trailer.model ?? null,
        make: (data.contract.trailer as any).make ?? null,
        year: (data.contract.trailer as any).year ?? null,
        vin: (data.contract.trailer as any).vin ?? null,
      },
      items,
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
    const brandName = data.tenant?.name ?? null;

    this.addHeader(doc, 'Invoice', brandName, data.tenantLogoDataUrl ?? null);

    let yPos = 50;

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 20, yPos);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice # ${invoiceData.invoiceNumber}`, 150, yPos);
    yPos += 6;
    doc.text(`Issued: ${this.formatDate(invoiceData.issueDate)}`, 150, yPos);
    yPos += 6;
    doc.text(`Due: ${this.formatDate(invoiceData.dueDate)}`, 150, yPos);

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
      head: [['Description', 'Unit Rate', 'Qty', 'Total']],
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

    doc.text('Sales Tax:', 125, yPos + 16);
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
    const statusLabel = invoiceData.status === 'paid' ? 'PAID' :
                        invoiceData.status === 'overdue' ? 'OVERDUE' :
                        invoiceData.status === 'pending' ? 'OPEN' :
                        invoiceData.status === 'open' ? 'OPEN' :
                        invoiceData.status === 'cancelled' ? 'CANCELLED' :
                        invoiceData.status.toUpperCase();
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.rect(20, yPos, 50, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(`STATUS: ${statusLabel}`, 22, yPos + 5);
    doc.setTextColor(0, 0, 0);

    if (invoiceData.status === 'paid' && invoiceData.paidDate) {
      yPos += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Paid on: ${this.formatDate(invoiceData.paidDate)}`, 22, yPos);
    }

    // Diagonal "PAID" watermark when invoice is settled — leaves no doubt
    // that this PDF represents a closed-out invoice.
    if (invoiceData.status === 'paid') {
      const center = doc.internal.pageSize.width / 2;
      const middle = doc.internal.pageSize.height / 2;
      doc.saveGraphicsState();
      // jspdf has setGState; rely on light gray text instead for portability.
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(80);
      doc.setTextColor(220, 240, 220);
      doc.text('PAID', center, middle, { align: 'center', angle: 30 });
      doc.setTextColor(0, 0, 0);
      doc.restoreGraphicsState?.();
    }

    yPos += 20;
    doc.setFillColor(245, 247, 250);
    doc.rect(20, yPos - 5, 170, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('HOW TO PAY', 22, yPos);
    yPos += 8;

    // Public payment link prominently at the top — works for the customer
    // to pay by card without needing to log in. Falls back gracefully to the
    // payment-method instructions when the link cannot be built.
    let publicPaymentUrl: string | null = null;
    try {
      publicPaymentUrl = buildPublicPaymentUrl(data.id);
    } catch {
      publicPaymentUrl = null;
    }

    if (publicPaymentUrl) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Pay online (credit card):', 22, yPos);
      yPos += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 99, 232);
      const linkLines = doc.splitTextToSize(publicPaymentUrl, 165);
      doc.textWithLink(String(linkLines[0]), 22, yPos, { url: publicPaymentUrl });
      yPos += 5;
      for (let i = 1; i < linkLines.length; i++) {
        doc.textWithLink(String(linkLines[i]), 22, yPos, { url: publicPaymentUrl });
        yPos += 5;
      }
      doc.setTextColor(0, 0, 0);
      yPos += 3;
    }

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

    this.addFooter(doc, 1, brandName);

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
