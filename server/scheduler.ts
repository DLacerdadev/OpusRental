import cron from "node-cron";
import { generateMonth } from "./services/finance.service";
import { notificationService } from "./services/notification.service";

interface SchedulerState {
  isRunning: boolean;
  lastPaymentRun: string | null;
  lastOverdueCheck: string | null;
  lastMaintenanceCheck: string | null;
  lastGeofenceCheck: string | null;
}

const state: SchedulerState = {
  isRunning: false,
  lastPaymentRun: null,
  lastOverdueCheck: null,
  lastMaintenanceCheck: null,
  lastGeofenceCheck: null,
};

export function getSchedulerState(): SchedulerState {
  return { ...state };
}

const log = (level: "info" | "error", operation: string, detail?: unknown) => {
  const entry = {
    level,
    timestamp: new Date().toISOString(),
    service: "scheduler",
    operation,
    ...(detail !== undefined ? { detail } : {}),
  };
  if (level === "error") {
    console.error(JSON.stringify(entry));
  } else {
    console.info(JSON.stringify(entry));
  }
};

export function startScheduler() {
  // Executar no 1º dia de cada mês às 06:00 UTC
  cron.schedule("0 6 1 * *", async () => {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, "0");
    const referenceMonth = `${year}-${month}`;

    log("info", "payment_generation_start", { referenceMonth });

    try {
      const result = await generateMonth(referenceMonth);
      state.lastPaymentRun = now.toISOString();
      log("info", "payment_generation_complete", {
        referenceMonth: result.referenceMonth,
        sharesProcessed: result.sharesProcessed,
        investorPayouts: result.investorPayouts,
        totalRevenue: result.totalRevenue,
        tenantsProcessed: result.tenantsProcessed,
      });
    } catch (error) {
      log("error", "payment_generation_failed", {
        referenceMonth,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Verificar pagamentos atrasados a cada 6 horas
  cron.schedule("0 */6 * * *", async () => {
    log("info", "overdue_check_start");
    try {
      await notificationService.checkOverduePayments();
      state.lastOverdueCheck = new Date().toISOString();
      log("info", "overdue_check_complete");
    } catch (error) {
      log("error", "overdue_check_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Verificar manutenção vencida diariamente às 08:00 UTC
  cron.schedule("0 8 * * *", async () => {
    log("info", "maintenance_check_start");
    try {
      await notificationService.checkMaintenanceDue();
      state.lastMaintenanceCheck = new Date().toISOString();
      log("info", "maintenance_check_complete");
    } catch (error) {
      log("error", "maintenance_check_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  // Verificar geofencing GPS a cada 2 horas
  cron.schedule("0 */2 * * *", async () => {
    log("info", "geofence_check_start");
    try {
      await notificationService.checkGeofenceAlerts();
      state.lastGeofenceCheck = new Date().toISOString();
      log("info", "geofence_check_complete");
    } catch (error) {
      log("error", "geofence_check_failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  state.isRunning = true;

  log("info", "scheduler_started", {
    jobs: [
      "Pagamentos mensais: 1º dia de cada mês às 06:00 UTC",
      "Pagamentos atrasados: A cada 6 horas",
      "Manutenção vencida: Diariamente às 08:00 UTC",
      "Geofencing GPS: A cada 2 horas",
    ],
  });
}
