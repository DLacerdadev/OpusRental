import { db } from "../db";
import { payments, financialRecords, shares } from "@shared/schema";
import { sql, eq, and } from "drizzle-orm";

export interface GenerateMonthResult {
  referenceMonth: string;
  sharesProcessed: number;
  investorPayouts: string;
  totalRevenue: string;
  companyMargin: string;
  tenantsProcessed: number;
}

/**
 * Gera pagamentos mensais para todas as shares ativas de forma idempotente.
 * Multi-tenant: processa todos os tenants ou um tenant específico.
 *
 * @param referenceMonth - Formato YYYY-MM (ex: "2025-10")
 * @param tenantId       - Opcional: restringir a um único tenant
 */
export async function generateMonth(
  referenceMonth: string,
  tenantId?: string
): Promise<GenerateMonthResult> {
  // Validar formato YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw new Error("Formato inválido. Use YYYY-MM (ex: 2025-10)");
  }

  const [year, month] = referenceMonth.split("-").map(Number);
  const today = new Date();

  // Data de pagamento: até o dia 28 para evitar problemas em meses curtos
  const paymentDate = new Date(
    Date.UTC(year, month - 1, Math.min(28, today.getUTCDate()))
  );

  // 1) Buscar shares ativas (filtradas por tenant quando fornecido)
  const activeShares = await db.query.shares.findMany({
    where: tenantId
      ? and(eq(shares.status, "active"), eq(shares.tenantId, tenantId))
      : eq(shares.status, "active"),
    columns: {
      id: true,
      tenantId: true,
      userId: true,
      purchaseValue: true,
      monthlyReturn: true,
    },
  });

  // 2) Agrupar shares por tenantId para gerar financial_records separados
  const byTenant = new Map<string, typeof activeShares>();
  for (const share of activeShares) {
    const group = byTenant.get(share.tenantId) ?? [];
    group.push(share);
    byTenant.set(share.tenantId, group);
  }

  let totalPayoutSum = 0;
  let totalSharesProcessed = 0;

  // 3) Processar cada tenant separadamente
  for (const [tid, tenantShares] of byTenant.entries()) {
    let payoutSum = 0;

    for (const share of tenantShares) {
      const rate = Number(share.monthlyReturn ?? 2) / 100;
      const amount = +(Number(share.purchaseValue) * rate).toFixed(2);

      // INSERT idempotente por (share_id, reference_month)
      await db.execute(sql`
        INSERT INTO "payments" (
          "id",
          "tenant_id",
          "share_id",
          "user_id",
          "amount",
          "payment_date",
          "status",
          "reference_month",
          "created_at"
        )
        VALUES (
          gen_random_uuid(),
          ${tid},
          ${share.id},
          ${share.userId},
          ${amount},
          ${paymentDate.toISOString()},
          'paid',
          ${referenceMonth},
          now()
        )
        ON CONFLICT ("share_id", "reference_month") DO NOTHING
      `);

      payoutSum += amount;
    }

    // 4) Consolidar financial_records por tenant com upsert
    const investorPayouts = +payoutSum.toFixed(2);
    const totalRevenue = investorPayouts;
    const operationalCosts = 0;
    const companyMargin = +(totalRevenue - investorPayouts - operationalCosts).toFixed(2);

    await db.execute(sql`
      INSERT INTO "financial_records" (
        "id",
        "tenant_id",
        "month",
        "total_revenue",
        "investor_payouts",
        "operational_costs",
        "company_margin",
        "created_at"
      )
      VALUES (
        gen_random_uuid(),
        ${tid},
        ${referenceMonth},
        ${totalRevenue},
        ${investorPayouts},
        ${operationalCosts},
        ${companyMargin},
        now()
      )
      ON CONFLICT ("tenant_id", "month") DO UPDATE
      SET
        "total_revenue"      = EXCLUDED."total_revenue",
        "investor_payouts"   = EXCLUDED."investor_payouts",
        "operational_costs"  = EXCLUDED."operational_costs",
        "company_margin"     = EXCLUDED."company_margin"
    `);

    totalPayoutSum += payoutSum;
    totalSharesProcessed += tenantShares.length;
  }

  return {
    referenceMonth,
    sharesProcessed: totalSharesProcessed,
    tenantsProcessed: byTenant.size,
    investorPayouts: totalPayoutSum.toFixed(2),
    totalRevenue: totalPayoutSum.toFixed(2),
    companyMargin: "0.00",
  };
}
