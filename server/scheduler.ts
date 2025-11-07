import cron from "node-cron";
import { generateMonth } from "./services/finance.service";
import { notificationService } from "./services/notification.service";

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

  // Verificar pagamentos atrasados a cada 6 horas
  cron.schedule("0 */6 * * *", async () => {
    try {
      console.log("[Scheduler] Verificando pagamentos atrasados...");
      await notificationService.checkOverduePayments();
      console.log("[Scheduler] Verificação de pagamentos atrasados concluída");
    } catch (error) {
      console.error("[Scheduler] Erro ao verificar pagamentos atrasados:", error);
    }
  });

  // Verificar manutenção vencida diariamente às 08:00 UTC
  cron.schedule("0 8 * * *", async () => {
    try {
      console.log("[Scheduler] Verificando manutenção vencida...");
      await notificationService.checkMaintenanceDue();
      console.log("[Scheduler] Verificação de manutenção concluída");
    } catch (error) {
      console.error("[Scheduler] Erro ao verificar manutenção vencida:", error);
    }
  });

  // Verificar geofencing GPS a cada 2 horas
  cron.schedule("0 */2 * * *", async () => {
    try {
      console.log("[Scheduler] Verificando alertas de geofencing...");
      await notificationService.checkGeofenceAlerts();
      console.log("[Scheduler] Verificação de geofencing concluída");
    } catch (error) {
      console.error("[Scheduler] Erro ao verificar geofencing:", error);
    }
  });

  console.log("[Scheduler] Agendamentos configurados:");
  console.log("  - Pagamentos mensais: 1º dia de cada mês às 06:00 UTC");
  console.log("  - Pagamentos atrasados: A cada 6 horas");
  console.log("  - Manutenção vencida: Diariamente às 08:00 UTC");
  console.log("  - Geofencing GPS: A cada 2 horas");
}
