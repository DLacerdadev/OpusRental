import cron from "node-cron";
import { generateMonth } from "./services/finance.service";

export function startScheduler() {
  // Executar no 1º dia de cada mês às 06:00 UTC
  // Formato: segundo minuto hora dia mês dia-da-semana
  // "0 6 1 * *" = minuto 0, hora 6, dia 1, qualquer mês, qualquer dia da semana
  cron.schedule("0 6 1 * *", async () => {
    try {
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = String(now.getUTCMonth() + 1).padStart(2, "0");
      const referenceMonth = `${year}-${month}`;

      console.log(`[Scheduler] Iniciando geração automática de pagamentos para ${referenceMonth}`);
      
      const result = await generateMonth(referenceMonth);
      
      console.log(`[Scheduler] Pagamentos gerados com sucesso:`, {
        referenceMonth: result.referenceMonth,
        sharesProcessed: result.sharesProcessed,
        investorPayouts: result.investorPayouts,
        totalRevenue: result.totalRevenue,
      });
    } catch (error) {
      console.error("[Scheduler] Erro ao gerar pagamentos automáticos:", error);
    }
  });

  console.log("[Scheduler] Agendamento configurado: 1º dia de cada mês às 06:00 UTC");
}
