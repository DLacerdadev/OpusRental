import { db } from "../db";
import { payments, financialRecords, shares } from "@shared/schema";
import { sql, eq } from "drizzle-orm";

export interface GenerateMonthResult {
  referenceMonth: string;
  sharesProcessed: number;
  investorPayouts: string;
  totalRevenue: string;
  companyMargin: string;
}

/**
 * Gera pagamentos mensais para todas as shares ativas de forma idempotente
 * 
 * @param referenceMonth - Formato YYYY-MM (ex: "2025-10")
 * @returns Resumo dos pagamentos gerados e consolidação financeira
 */
export async function generateMonth(referenceMonth: string): Promise<GenerateMonthResult> {
  // Validar formato YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(referenceMonth)) {
    throw new Error("Formato inválido. Use YYYY-MM (ex: 2025-10)");
  }

  const [year, month] = referenceMonth.split('-').map(Number);
  const today = new Date();
  
  // Data de pagamento: último dia do mês de referência ou dia atual (o que for menor)
  const paymentDate = new Date(Date.UTC(
    year,
    month - 1,
    Math.min(28, today.getUTCDate())
  ));

  // 1) Buscar shares ativas
  const activeShares = await db.query.shares.findMany({
    where: eq(shares.status, "active"),
    columns: { 
      id: true, 
      userId: true, 
      purchaseValue: true, 
      monthlyReturn: true 
    },
  });

  // 2) Inserir pagamentos com idempotência (ON CONFLICT DO NOTHING)
  let payoutSum = 0;
  
  for (const share of activeShares) {
    const rate = Number(share.monthlyReturn ?? 2) / 100; // default 2%
    const amount = +(Number(share.purchaseValue) * rate).toFixed(2);

    await db.execute(sql`
      INSERT INTO "payments" (
        "id",
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

  // 3) Consolidar financialRecords com upsert
  const investorPayouts = +payoutSum.toFixed(2);
  const totalRevenue = investorPayouts; // Receita total = pagamentos aos investidores
  const operationalCosts = 0; // Ajustar conforme modelo de negócio
  const companyMargin = +(totalRevenue - investorPayouts - operationalCosts).toFixed(2);

  await db.execute(sql`
    INSERT INTO "financial_records" (
      "id",
      "month",
      "total_revenue",
      "investor_payouts",
      "operational_costs",
      "company_margin",
      "created_at"
    )
    VALUES (
      gen_random_uuid(),
      ${referenceMonth},
      ${totalRevenue},
      ${investorPayouts},
      ${operationalCosts},
      ${companyMargin},
      now()
    )
    ON CONFLICT ("month") DO UPDATE
    SET 
      "total_revenue" = EXCLUDED."total_revenue",
      "investor_payouts" = EXCLUDED."investor_payouts",
      "operational_costs" = EXCLUDED."operational_costs",
      "company_margin" = EXCLUDED."company_margin"
  `);

  return {
    referenceMonth,
    sharesProcessed: activeShares.length,
    investorPayouts: investorPayouts.toFixed(2),
    totalRevenue: totalRevenue.toFixed(2),
    companyMargin: companyMargin.toFixed(2),
  };
}
