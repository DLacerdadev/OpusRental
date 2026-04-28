/**
 * Catalog of asset (trailer) document categories and types.
 *
 * The 4 top-level tabs and the document types inside each tab are driven by
 * this map — adding/removing a document type in the future is purely a
 * configuration change here, with no database migration required.
 *
 * The same module is consumed by the server (validation, grouping) and by
 * the client (UI checklist + i18n labels), so they always agree on what is
 * a valid (category, type) pair and on which types are required.
 */

export const DOCUMENT_CATEGORIES = [
  "vehicle",
  "insurance",
  "contract",
  "tracking",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface DocumentTypeDef {
  /** Stable machine-readable id stored in `trailer_documents.document_type`. */
  type: string;
  /** When true, this type counts toward the "required" checklist for its category. */
  required: boolean;
}

export const DOCUMENT_TYPE_CATALOG: Record<DocumentCategory, DocumentTypeDef[]> = {
  vehicle: [
    { type: "title", required: true },
    { type: "registration", required: true },
    { type: "inspection_report", required: false },
    { type: "purchase_invoice", required: false },
    { type: "vin_plate_photo", required: false },
    { type: "odometer_photo", required: false },
    { type: "other", required: false },
  ],
  insurance: [
    { type: "liability_insurance", required: true },
    { type: "cargo_insurance", required: false },
  ],
  contract: [
    { type: "master_lease", required: true },
    { type: "rental_contract", required: false },
    { type: "addendum", required: false },
  ],
  tracking: [
    { type: "tracker_certificate", required: true },
    { type: "tracker_install_photo", required: false },
  ],
};

/** Returns the ordered list of document types defined for a category. */
export function getTypesForCategory(category: DocumentCategory): DocumentTypeDef[] {
  return DOCUMENT_TYPE_CATALOG[category] ?? [];
}

/** True when the (category, type) pair is part of the catalog. */
export function isKnownDocumentType(category: string, type: string): boolean {
  if (!isDocumentCategory(category)) return false;
  return DOCUMENT_TYPE_CATALOG[category].some((d) => d.type === type);
}

/** True when the type is marked as required for that category. */
export function isRequiredDocumentType(category: DocumentCategory, type: string): boolean {
  const def = DOCUMENT_TYPE_CATALOG[category].find((d) => d.type === type);
  return def?.required ?? false;
}

export function isDocumentCategory(value: string): value is DocumentCategory {
  return (DOCUMENT_CATEGORIES as readonly string[]).includes(value);
}

export function isDocumentStatus(value: string): value is DocumentStatus {
  return (DOCUMENT_STATUSES as readonly string[]).includes(value);
}

/**
 * One-shot mapping from the LEGACY `document_category` values
 * (`title | registration | insurance | inspection | purchase_invoice | other`)
 * to the new (category, type) pair. Used by the backfill migration so existing
 * uploads land in the correct tab automatically.
 */
export const LEGACY_CATEGORY_MAP: Record<
  string,
  { category: DocumentCategory; type: string }
> = {
  title: { category: "vehicle", type: "title" },
  registration: { category: "vehicle", type: "registration" },
  inspection: { category: "vehicle", type: "inspection_report" },
  purchase_invoice: { category: "vehicle", type: "purchase_invoice" },
  insurance: { category: "insurance", type: "liability_insurance" },
  other: { category: "vehicle", type: "other" },
};
