/**
 * One-shot backfill: migrate legacy `document_category` rows into the new
 * `(category, document_type, version, parent_document_id, is_current,
 * status)` model while preserving version history for trailers that had
 * multiple legacy uploads of the same kind.
 *
 * Idempotent: a group whose rows are all already migrated is skipped, and
 * a partially-migrated group is reprocessed by including its already-
 * migrated siblings so the chain is rebuilt from the full set.
 *
 * Run with:  npx tsx server/migrations/backfill-trailer-docs.ts
 */

import { db } from "../db";
import { trailerDocuments } from "@shared/schema";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { LEGACY_CATEGORY_MAP, type DocumentCategory } from "@shared/document-types";

interface ChainRow {
  id: string;
  uploadedAt: Date | null;
  category: DocumentCategory;
  type: string;
  alreadyMigrated: boolean;
}

async function main() {
  // Pull every row that still carries the legacy column. Some may already
  // be migrated (have category+documentType set) — we still need them when
  // rebuilding chains for groups that contain at least one un-migrated row.
  const legacyRows = await db
    .select()
    .from(trailerDocuments)
    .where(isNotNull(trailerDocuments.documentCategory));

  const groups = new Map<string, ChainRow[]>();
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
      alreadyMigrated: row.category != null && row.documentType != null,
    });
    groups.set(key, arr);
  }

  let groupsProcessed = 0;
  let rowsUpdated = 0;
  for (const rows of Array.from(groups.values())) {
    if (rows.every((r) => r.alreadyMigrated)) continue;

    rows.sort((a: ChainRow, b: ChainRow) => {
      const aTime = a.uploadedAt?.getTime() ?? 0;
      const bTime = b.uploadedAt?.getTime() ?? 0;
      if (aTime !== bTime) return aTime - bTime;
      return a.id.localeCompare(b.id);
    });

    await db.transaction(async (tx) => {
      // Drop is_current on every sibling first to avoid colliding with the
      // partial unique index while we reassign the chain.
      await tx
        .update(trailerDocuments)
        .set({ isCurrent: false })
        .where(
          sql`${trailerDocuments.id} IN (${sql.join(
            rows.map((r) => sql`${r.id}`),
            sql`, `,
          )})`,
        );

      const v1Id = rows[0].id;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        await tx
          .update(trailerDocuments)
          .set({
            category: row.category,
            documentType: row.type,
            version: i + 1,
            parentDocumentId: i === 0 ? null : v1Id,
            isCurrent: i === rows.length - 1,
            status: "approved",
          })
          .where(eq(trailerDocuments.id, row.id));
        rowsUpdated++;
      }
    });
    groupsProcessed++;
  }

  console.log(
    `backfill-trailer-docs: groups processed=${groupsProcessed} rows updated=${rowsUpdated}`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("backfill-trailer-docs failed:", err);
    process.exit(1);
  });
