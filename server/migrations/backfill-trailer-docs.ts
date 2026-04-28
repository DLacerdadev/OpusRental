/**
 * One-shot backfill: copy the legacy `document_category` value into the new
 * (category, document_type) pair, mark every existing row as `is_current=true`
 * and `status='approved'` (so historical uploads do not all suddenly appear
 * as "Pending" overnight). Idempotent: re-running it on already-migrated
 * rows is a no-op because the WHERE clause filters them out.
 *
 * Run with:  npx tsx server/migrations/backfill-trailer-docs.ts
 */

import { db } from "../db";
import { sql } from "drizzle-orm";
import { LEGACY_CATEGORY_MAP } from "@shared/document-types";

async function main() {
  // Build CASE statements from the catalog so the mapping table lives in
  // one place (shared/document-types.ts) and is reused here.
  const categoryCase = sql.join(
    Object.entries(LEGACY_CATEGORY_MAP).flatMap(([legacy, { category }]) => [
      sql`WHEN ${legacy} THEN ${category}`,
    ]),
    sql` `,
  );
  const typeCase = sql.join(
    Object.entries(LEGACY_CATEGORY_MAP).flatMap(([legacy, { type }]) => [
      sql`WHEN ${legacy} THEN ${type}`,
    ]),
    sql` `,
  );

  const result = await db.execute(sql`
    UPDATE trailer_documents
       SET category      = CASE document_category ${categoryCase} ELSE 'vehicle' END,
           document_type = CASE document_category ${typeCase} ELSE 'other' END,
           status        = 'approved',
           is_current    = true,
           version       = COALESCE(version, 1)
     WHERE category IS NULL OR document_type IS NULL
  `);

  console.log("backfill-trailer-docs: rows updated =", result.rowCount ?? 0);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("backfill-trailer-docs failed:", err);
    process.exit(1);
  });
