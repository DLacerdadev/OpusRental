import { db } from "../db";
import { payments, financialRecords, shares } from "@shared/schema";
import { sql, eq, and } from "drizzle-orm";
import { WhatsAppService } from "./whatsapp.service";

export interface GenerateMonthResult {
  referenceMonth: string;
  sharesProcessed: number;
  investorPayouts: string;
  totalRevenue: string;
  companyMargin: string;
  tenantsProcessed: number;
}

const log = (level: "info" | "error", operation: string, tenantId?: string, detail?: unknown) => {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    service: "finance",
    operation,
    tenantId: tenantId ?? null,
    ...(detail !== undefined ? { detail } : {}),
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
};

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
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw new Error("Formato inválido. Use YYYY-MM (ex: 2025-10)");
  }

  log("info", "generate_month_start", tenantId, { referenceMonth });

  const [year, month] = referenceMonth.split("-").map(Number);
  const today = new Date();

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

  log("info", "generate_month_shares_found", tenantId, {
    referenceMonth,
    count: activeShares.length,
  });

  // 2) Agrupar shares por tenantId
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

      await db.execute(sql`
        INSERT INTO "payments" (
          "id", "tenant_id", "share_id", "user_id",
          "amount", "payment_date", "status", "reference_month", "created_at"
        )
        VALUES (
          gen_random_uuid(), ${tid}, ${share.id}, ${share.userId},
          ${amount}, ${paymentDate.toISOString()}, 'paid', ${referenceMonth}, now()
        )
        ON CONFLICT ("share_id", "reference_month") DO NOTHING
      `);

      payoutSum += amount;
    }

    const investorPayouts = +payoutSum.toFixed(2);
    const totalRevenue = investorPayouts;
    const operationalCosts = 0;
    const companyMargin = +(totalRevenue - investorPayouts - operationalCosts).toFixed(2);

    await db.execute(sql`
      INSERT INTO "financial_records" (
        "id", "tenant_id", "month", "total_revenue",
        "investor_payouts", "operational_costs", "company_margin", "created_at"
      )
      VALUES (
        gen_random_uuid(), ${tid}, ${referenceMonth}, ${totalRevenue},
        ${investorPayouts}, ${operationalCosts}, ${companyMargin}, now()
      )
      ON CONFLICT ("tenant_id", "month") DO UPDATE
      SET
        "total_revenue"    = EXCLUDED."total_revenue",
        "investor_payouts" = EXCLUDED."investor_payouts",
        "operational_costs"= EXCLUDED."operational_costs",
        "company_margin"   = EXCLUDED."company_margin"
    `);

    log("info", "generate_month_tenant_complete", tid, {
      referenceMonth,
      sharesProcessed: tenantShares.length,
      payoutSum: payoutSum.toFixed(2),
    });

    totalPayoutSum += payoutSum;
    totalSharesProcessed += tenantShares.length;
  }

  const result = {
    referenceMonth,
    sharesProcessed: totalSharesProcessed,
    tenantsProcessed: byTenant.size,
    investorPayouts: totalPayoutSum.toFixed(2),
    totalRevenue: totalPayoutSum.toFixed(2),
    companyMargin: "0.00",
  };

  log("info", "generate_month_complete", tenantId, result);

  WhatsAppService.notifyMonthlyPayments(referenceMonth).catch((err: unknown) => {
    log("error", "whatsapp_notify_monthly_failed", tenantId, err instanceof Error ? err.message : String(err));
  });

  return result;
}
