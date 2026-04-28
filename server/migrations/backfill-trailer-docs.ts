/**
 * One-shot backfill: migrate the legacy `document_category` column into the
 * new `(category, document_type, version, parent_document_id, is_current,
 * status)` shape WITHOUT losing version history when a single trailer had
 * several legacy uploads under the same category.
 *
 * Algorithm per (tenant, trailer, mapped_document_type) group:
 *   1. Sort legacy rows by `uploaded_at ASC` (oldest first).
 *   2. The oldest becomes v1 with `parent_document_id=NULL`.
 *   3. Each later row gets sequential `version` and `parent_document_id`
 *      pointing at v1 (matches the live createTrailerDocument convention).
 *   4. Only the newest row keeps `is_current=true`. All older rows are
 *      flipped to `is_current=false` so they appear as History in the UI.
 *   5. Every row gets `status='approved'` so historical uploads do not
 *      suddenly all appear as Pending.
 *
 * Idempotent: a row that already has `category` AND `document_type` set is
 * skipped, so re-running the script after a partial run is safe.
 *
 * Run with:  npx tsx server/migrations/backfill-trailer-docs.ts
 */

import { db } from "../db";
import { trailerDocuments } from "@shared/schema";
import { and, eq, isNull, isNotNull, or } from "drizzle-orm";
import { LEGACY_CATEGORY_MAP, type DocumentCategory } from "@shared/document-types";

interface GroupedRow {
  id: string;
  uploadedAt: Date | null;
  category: DocumentCategory;
  type: string;
}

async function main() {
  // Pull every row that hasn't been migrated yet (missing category OR
  // missing documentType). We need the full row data to group + chain.
  const legacyRows = await db
    .select()
    .from(trailerDocuments)
    .where(
      and(
        isNotNull(trailerDocuments.documentCategory),
        or(isNull(trailerDocuments.category), isNull(trailerDocuments.documentType)),
      ),
    );

  // Group by (tenantId, trailerId, mapped_document_type). The mapped type
  // — not the raw legacy category — is the right grouping key because
  // multiple legacy categories could conceivably map onto the same new type.
  const groups = new Map<string, GroupedRow[]>();
  for (const row of legacyRows) {
    const mapped = LEGACY_CATEGORY_MAP[row.documentCategory!] ?? {
      category: "vehicle" as const,
      type: "other",
    };
    const key = `${row.tenantId}::${row.trailerId}::${mapped.type}`;
    const arr = groups.get(key) ?? [];
    arr.push({
      id: row.id,
      uploadedAt: row.uploadedAt,
      category: mapped.category,
      type: mapped.type,
    });
    groups.set(key, arr);
  }

  let updated = 0;
  for (const rows of Array.from(groups.values())) {
    // Oldest first; fall back to id for stable ordering when uploadedAt
    // collides or is null.
    rows.sort((a: GroupedRow, b: GroupedRow) => {
      const aTime = a.uploadedAt?.getTime() ?? 0;
      const bTime = b.uploadedAt?.getTime() ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

    const v1Id = rows[0].id;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const isLatest = i === rows.length - 1;
      await db
        .update(trailerDocuments)
        .set({
          category: row.category,
          documentType: row.type,
          version: i + 1,
          parentDocumentId: i === 0 ? null : v1Id,
          isCurrent: isLatest,
          status: "approved",
        })
        .where(eq(trailerDocuments.id, row.id));
      updated++;
    }
  }

  console.log(
    `backfill-trailer-docs: groups=${groups.size} rows updated=${updated}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("backfill-trailer-docs failed:", err);
    process.exit(1);
  });
