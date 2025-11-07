import { db } from "../db";
import { auditLogs, users } from "../../shared/schema";
import { desc, eq, and, gte, lte, sql, or, like, inArray } from "drizzle-orm";

export interface LogFilter {
  startDate?: string;
  endDate?: string;
  userId?: string;
  action?: string;
  entityType?: string;
  ipAddress?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface SuspiciousActivity {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  userId?: string;
  userEmail?: string;
  count: number;
  timeWindow: string;
  details: any;
  firstOccurrence: Date;
  lastOccurrence: Date;
}

export class MonitoringService {
  static async getFilteredLogs(filter: LogFilter) {
    let query = db
      .select({
        id: auditLogs.id,
        userId: auditLogs.userId,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        timestamp: auditLogs.timestamp,
        username: users.username,
        email: users.email,
        role: users.role,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .$dynamic();

    const conditions = [];

    if (filter.startDate) {
      conditions.push(gte(auditLogs.timestamp, new Date(filter.startDate)));
    }

    if (filter.endDate) {
      conditions.push(lte(auditLogs.timestamp, new Date(filter.endDate)));
    }

    if (filter.userId) {
      conditions.push(eq(auditLogs.userId, filter.userId));
    }

    if (filter.action) {
      conditions.push(eq(auditLogs.action, filter.action));
    }

    if (filter.entityType) {
      conditions.push(eq(auditLogs.entityType, filter.entityType));
    }

    if (filter.ipAddress) {
      conditions.push(eq(auditLogs.ipAddress, filter.ipAddress));
    }

    if (filter.search) {
      conditions.push(
        or(
          like(auditLogs.action, `%${filter.search}%`),
          like(auditLogs.entityType, `%${filter.search}%`),
          sql`${auditLogs.details}::text LIKE ${`%${filter.search}%`}`
        )!
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const logs = await query
      .orderBy(desc(auditLogs.timestamp))
      .limit(filter.limit || 100)
      .offset(filter.offset || 0);

    let totalQuery = db
      .select({ count: sql<number>`count(*)::int` })
      .from(auditLogs)
      .$dynamic();

    if (conditions.length > 0) {
      totalQuery = totalQuery.where(and(...conditions)) as any;
    }

    const totalResult = await totalQuery;
    const total = totalResult[0]?.count || 0;

    return {
      logs,
      total,
      limit: filter.limit || 100,
      offset: filter.offset || 0,
    };
  }

  static async detectSuspiciousActivities(lookbackHours: number = 24): Promise<SuspiciousActivity[]> {
    const suspiciousActivities: SuspiciousActivity[] = [];
    const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000);

    const recentLogs = await db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, since))
      .orderBy(desc(auditLogs.timestamp));

    const failedLoginsByUser = new Map<string, { count: number; ips: Set<string>; timestamps: Date[] }>();
    const actionsByUser = new Map<string, { count: number; actions: string[]; timestamps: Date[] }>();
    const actionsByIP = new Map<string, { count: number; actions: string[]; timestamps: Date[] }>();
    const deletionEvents: typeof recentLogs = [];
    const exportEvents: typeof recentLogs = [];
    const bulkImports: typeof recentLogs = [];

    for (const log of recentLogs) {
      if (log.action.includes("login_fail") || log.action.includes("auth_fail")) {
        const key = log.userId || log.ipAddress || "unknown";
        if (!failedLoginsByUser.has(key)) {
          failedLoginsByUser.set(key, { count: 0, ips: new Set(), timestamps: [] });
        }
        const entry = failedLoginsByUser.get(key)!;
        entry.count++;
        if (log.ipAddress) entry.ips.add(log.ipAddress);
        if (log.timestamp) entry.timestamps.push(log.timestamp);
      }

      if (log.userId) {
        if (!actionsByUser.has(log.userId)) {
          actionsByUser.set(log.userId, { count: 0, actions: [], timestamps: [] });
        }
        const userEntry = actionsByUser.get(log.userId)!;
        userEntry.count++;
        userEntry.actions.push(log.action);
        if (log.timestamp) userEntry.timestamps.push(log.timestamp);
      }

      if (log.ipAddress) {
        if (!actionsByIP.has(log.ipAddress)) {
          actionsByIP.set(log.ipAddress, { count: 0, actions: [], timestamps: [] });
        }
        const ipEntry = actionsByIP.get(log.ipAddress)!;
        ipEntry.count++;
        ipEntry.actions.push(log.action);
        if (log.timestamp) ipEntry.timestamps.push(log.timestamp);
      }

      if (log.action.includes("delete")) {
        deletionEvents.push(log);
      }

      if (log.action.includes("export")) {
        exportEvents.push(log);
      }

      if (log.action.includes("import")) {
        bulkImports.push(log);
      }
    }

    for (const [userIdOrIp, data] of Array.from(failedLoginsByUser.entries())) {
      if (data.count >= 5) {
        const user = await db.select().from(users).where(eq(users.id, userIdOrIp)).limit(1);
        suspiciousActivities.push({
          type: "multiple_failed_logins",
          severity: data.count >= 10 ? "critical" : "high",
          userId: user.length > 0 ? userIdOrIp : undefined,
          userEmail: user.length > 0 ? user[0].email : undefined,
          count: data.count,
          timeWindow: `${lookbackHours}h`,
          details: {
            ipAddresses: Array.from(data.ips),
            attempts: data.count,
          },
          firstOccurrence: data.timestamps[data.timestamps.length - 1],
          lastOccurrence: data.timestamps[0],
        });
      }
    }

    for (const [userId, data] of Array.from(actionsByUser.entries())) {
      if (data.count > 100) {
        const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
        suspiciousActivities.push({
          type: "excessive_activity",
          severity: data.count > 500 ? "critical" : data.count > 200 ? "high" : "medium",
          userId,
          userEmail: user.length > 0 ? user[0].email : undefined,
          count: data.count,
          timeWindow: `${lookbackHours}h`,
          details: {
            totalActions: data.count,
            uniqueActions: new Set(data.actions).size,
            topActions: this.getTopActions(data.actions, 5),
          },
          firstOccurrence: data.timestamps[data.timestamps.length - 1],
          lastOccurrence: data.timestamps[0],
        });
      }
    }

    for (const [ip, data] of Array.from(actionsByIP.entries())) {
      if (data.count > 200) {
        suspiciousActivities.push({
          type: "suspicious_ip_activity",
          severity: data.count > 1000 ? "critical" : "high",
          count: data.count,
          timeWindow: `${lookbackHours}h`,
          details: {
            ipAddress: ip,
            totalActions: data.count,
            uniqueActions: new Set(data.actions).size,
            topActions: this.getTopActions(data.actions, 5),
          },
          firstOccurrence: data.timestamps[data.timestamps.length - 1],
          lastOccurrence: data.timestamps[0],
        });
      }
    }

    if (deletionEvents.length >= 5) {
      const byUser = new Map<string, number>();
      deletionEvents.forEach(log => {
        if (log.userId) {
          byUser.set(log.userId, (byUser.get(log.userId) || 0) + 1);
        }
      });

      for (const [userId, count] of Array.from(byUser.entries())) {
        if (count >= 5) {
          const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          suspiciousActivities.push({
            type: "mass_deletion",
            severity: count >= 20 ? "critical" : "high",
            userId,
            userEmail: user.length > 0 ? user[0].email : undefined,
            count,
            timeWindow: `${lookbackHours}h`,
            details: {
              deletionCount: count,
              entities: deletionEvents
                .filter(e => e.userId === userId)
                .map(e => ({ type: e.entityType, id: e.entityId })),
            },
            firstOccurrence: deletionEvents[deletionEvents.length - 1].timestamp!,
            lastOccurrence: deletionEvents[0].timestamp!,
          });
        }
      }
    }

    if (exportEvents.length >= 10) {
      const byUser = new Map<string, number>();
      exportEvents.forEach(log => {
        if (log.userId) {
          byUser.set(log.userId, (byUser.get(log.userId) || 0) + 1);
        }
      });

      for (const [userId, count] of Array.from(byUser.entries())) {
        if (count >= 10) {
          const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
          suspiciousActivities.push({
            type: "excessive_data_export",
            severity: "high",
            userId,
            userEmail: user.length > 0 ? user[0].email : undefined,
            count,
            timeWindow: `${lookbackHours}h`,
            details: {
              exportCount: count,
              types: exportEvents
                .filter(e => e.userId === userId)
                .map(e => e.action),
            },
            firstOccurrence: exportEvents[exportEvents.length - 1].timestamp!,
            lastOccurrence: exportEvents[0].timestamp!,
          });
        }
      }
    }

    return suspiciousActivities.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  static async getActivityStatistics(hours: number = 24) {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await db
      .select()
      .from(auditLogs)
      .where(gte(auditLogs.timestamp, since));

    const actionCounts = new Map<string, number>();
    const userCounts = new Map<string, number>();
    const entityTypeCounts = new Map<string, number>();
    const hourlyActivity = new Map<number, number>();

    logs.forEach(log => {
      actionCounts.set(log.action, (actionCounts.get(log.action) || 0) + 1);
      if (log.userId) {
        userCounts.set(log.userId, (userCounts.get(log.userId) || 0) + 1);
      }
      entityTypeCounts.set(log.entityType, (entityTypeCounts.get(log.entityType) || 0) + 1);

      if (log.timestamp) {
        const hour = log.timestamp.getHours();
        hourlyActivity.set(hour, (hourlyActivity.get(hour) || 0) + 1);
      }
    });

    return {
      totalEvents: logs.length,
      timeWindow: `${hours}h`,
      topActions: this.getTopEntries(actionCounts, 10),
      topUsers: this.getTopEntries(userCounts, 10),
      topEntityTypes: this.getTopEntries(entityTypeCounts, 10),
      hourlyDistribution: Array.from(hourlyActivity.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([hour, count]) => ({ hour, count })),
    };
  }

  private static getTopActions(actions: string[], limit: number): Array<{ action: string; count: number }> {
    const counts = new Map<string, number>();
    actions.forEach(action => {
      counts.set(action, (counts.get(action) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([action, count]) => ({ action, count }));
  }

  private static getTopEntries<K>(map: Map<K, number>, limit: number): Array<{ key: K; count: number }> {
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([key, count]) => ({ key, count }));
  }
}
