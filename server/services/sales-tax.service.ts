/**
 * US sales-tax engine.
 *
 * For now this resolver uses a built-in table of state-level base sales-tax
 * rates rather than calling out to TaxJar / Avalara. The table only covers
 * the *state* portion of US sales tax — it does NOT include county or city
 * surtaxes. That is intentional: a fully accurate tax engine would require
 * an external service, and the goal of this module is to remove the
 * "tenant-default-rate-applied-to-everyone" footgun by at least using the
 * customer's state.
 *
 * The five NOMAD states (no general state sales tax) are explicitly mapped
 * to 0%: New Hampshire, Oregon, Montana, Alaska, Delaware. (Alaska allows
 * local sales tax, which we do not model here.)
 *
 * Rates as of 2024–2025; sourced from each state's department of revenue.
 * Update freely as legislation changes — this file is the single source of
 * truth for the resolver.
 */

export interface ResolvedSalesTax {
  /** Rate as a percentage (e.g. 8.25 for 8.25%). */
  rate: number;
  /** ISO 3166-2:US two-letter code we resolved the input to (e.g. "CA"). */
  stateCode: string;
  /** Human-readable name (e.g. "California"). */
  stateName: string;
  source: "state_table";
}

/**
 * Two-letter state code → { name, rate }. `rate` is the *state* portion of
 * the general sales tax, expressed as a percentage. Local surtaxes are not
 * modeled — see file header.
 */
const US_STATE_SALES_TAX: Record<string, { name: string; rate: number }> = {
  AL: { name: "Alabama", rate: 4.0 },
  AK: { name: "Alaska", rate: 0.0 },
  AZ: { name: "Arizona", rate: 5.6 },
  AR: { name: "Arkansas", rate: 6.5 },
  CA: { name: "California", rate: 7.25 },
  CO: { name: "Colorado", rate: 2.9 },
  CT: { name: "Connecticut", rate: 6.35 },
  DE: { name: "Delaware", rate: 0.0 },
  DC: { name: "District of Columbia", rate: 6.0 },
  FL: { name: "Florida", rate: 6.0 },
  GA: { name: "Georgia", rate: 4.0 },
  HI: { name: "Hawaii", rate: 4.0 },
  ID: { name: "Idaho", rate: 6.0 },
  IL: { name: "Illinois", rate: 6.25 },
  IN: { name: "Indiana", rate: 7.0 },
  IA: { name: "Iowa", rate: 6.0 },
  KS: { name: "Kansas", rate: 6.5 },
  KY: { name: "Kentucky", rate: 6.0 },
  LA: { name: "Louisiana", rate: 4.45 },
  ME: { name: "Maine", rate: 5.5 },
  MD: { name: "Maryland", rate: 6.0 },
  MA: { name: "Massachusetts", rate: 6.25 },
  MI: { name: "Michigan", rate: 6.0 },
  MN: { name: "Minnesota", rate: 6.875 },
  MS: { name: "Mississippi", rate: 7.0 },
  MO: { name: "Missouri", rate: 4.225 },
  MT: { name: "Montana", rate: 0.0 },
  NE: { name: "Nebraska", rate: 5.5 },
  NV: { name: "Nevada", rate: 6.85 },
  NH: { name: "New Hampshire", rate: 0.0 },
  NJ: { name: "New Jersey", rate: 6.625 },
  NM: { name: "New Mexico", rate: 4.875 },
  NY: { name: "New York", rate: 4.0 },
  NC: { name: "North Carolina", rate: 4.75 },
  ND: { name: "North Dakota", rate: 5.0 },
  OH: { name: "Ohio", rate: 5.75 },
  OK: { name: "Oklahoma", rate: 4.5 },
  OR: { name: "Oregon", rate: 0.0 },
  PA: { name: "Pennsylvania", rate: 6.0 },
  RI: { name: "Rhode Island", rate: 7.0 },
  SC: { name: "South Carolina", rate: 6.0 },
  SD: { name: "South Dakota", rate: 4.2 },
  TN: { name: "Tennessee", rate: 7.0 },
  TX: { name: "Texas", rate: 6.25 },
  UT: { name: "Utah", rate: 6.1 },
  VT: { name: "Vermont", rate: 6.0 },
  VA: { name: "Virginia", rate: 5.3 },
  WA: { name: "Washington", rate: 6.5 },
  WV: { name: "West Virginia", rate: 6.0 },
  WI: { name: "Wisconsin", rate: 5.0 },
  WY: { name: "Wyoming", rate: 4.0 },
};

// Reverse lookup: lower-cased full name → 2-letter code. Built once at
// module load so the resolver can accept "california", "California",
// "  CA  " or "ca" interchangeably.
const NAME_TO_CODE: Record<string, string> = Object.entries(
  US_STATE_SALES_TAX,
).reduce((acc, [code, info]) => {
  acc[info.name.toLowerCase()] = code;
  return acc;
}, {} as Record<string, string>);

/**
 * Normalize whatever the user typed into the rental client's `state` field
 * to a canonical 2-letter US state code, or null if it can't be matched.
 *
 * Accepts:
 *  - 2-letter codes ("CA", "ca", "  Tx  ")
 *  - Full state names ("California", "new york")
 */
export function normalizeUsStateCode(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = String(input).trim();
  if (!trimmed) return null;

  const upper = trimmed.toUpperCase();
  if (upper.length === 2 && US_STATE_SALES_TAX[upper]) {
    return upper;
  }

  const lower = trimmed.toLowerCase();
  return NAME_TO_CODE[lower] ?? null;
}

/**
 * Resolve the sales-tax rate (state portion) for a given billing state.
 * Returns null when the input cannot be matched to a US state — callers
 * are expected to fall back to the tenant default in that case.
 */
export function resolveSalesTaxByState(
  stateInput: string | null | undefined,
): ResolvedSalesTax | null {
  const code = normalizeUsStateCode(stateInput);
  if (!code) return null;
  const entry = US_STATE_SALES_TAX[code];
  if (!entry) return null;
  return {
    rate: entry.rate,
    stateCode: code,
    stateName: entry.name,
    source: "state_table",
  };
}

/**
 * The full list of US states/DC supported by the resolver, sorted by name.
 * Useful for powering a dropdown in the rental-client form so managers
 * pick a value the engine can match.
 */
export function listUsStates(): Array<{ code: string; name: string; rate: number }> {
  return Object.entries(US_STATE_SALES_TAX)
    .map(([code, info]) => ({ code, name: info.name, rate: info.rate }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve the sales-tax rate to apply to an invoice for `client`.
 *
 * Resolution order (highest priority first):
 *  1. Customer billing state (`client.state` resolved against the table)
 *  2. Tenant default rate (`tenant.salesTaxRate`)
 *  3. 0%
 *
 * The returned object is shaped so callers can both apply the rate AND log
 * which path produced it, which is useful for audit and for the "why is
 * this invoice 8.25%?" question.
 */
export function resolveInvoiceSalesTaxRate(opts: {
  clientState?: string | null;
  tenantDefaultRate?: string | number | null;
}): {
  rate: number;
  source: "client_state" | "tenant_default" | "fallback_zero";
  stateCode: string | null;
  stateName: string | null;
} {
  const fromState = resolveSalesTaxByState(opts.clientState);
  if (fromState) {
    return {
      rate: fromState.rate,
      source: "client_state",
      stateCode: fromState.stateCode,
      stateName: fromState.stateName,
    };
  }

  const tenantRaw = opts.tenantDefaultRate;
  if (tenantRaw != null && tenantRaw !== "") {
    const n = typeof tenantRaw === "number" ? tenantRaw : parseFloat(String(tenantRaw));
    if (Number.isFinite(n) && n >= 0) {
      return { rate: n, source: "tenant_default", stateCode: null, stateName: null };
    }
  }

  return { rate: 0, source: "fallback_zero", stateCode: null, stateName: null };
}
