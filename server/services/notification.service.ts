import { db } from "../db";
import { notifications, trailers, invoices, maintenanceSchedules, trackingData, users, rentalContracts, rentalClients } from "../../shared/schema";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";
import { getWebSocketServer } from "../websocket";
import { WhatsAppService } from "./whatsapp.service";

export interface NotificationData {
  userId: string;
  title: string;
  message: string;
  type: 'payment_overdue' | 'maintenance_due' | 'gps_geofence' | 'system_alert' | 'invoice_reminder';
  severity: 'info' | 'warning' | 'critical';
  trailerId?: string;
  metadata?: any;
}

export class NotificationService {
  async createNotification(data: NotificationData): Promise<any> {
    try {
      const [notification] = await db
        .insert(notifications)
        .values({
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          severity: data.severity,
          trailerId: data.trailerId,
          metadata: data.metadata,
          read: false,
        })
        .returning();

      console.log(`[NotificationService] Created notification: ${notification.id} for user: ${data.userId}`);

      try {
        const wsServer = getWebSocketServer();
        wsServer.sendToUser(data.userId, notification);
        console.log(`[NotificationService] Sent real-time notification to user: ${data.userId}`);
      } catch (wsError) {
        console.warn('[NotificationService] WebSocket not available, notification saved to DB only');
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] Error creating notification:', error);
      throw error;
    }
  }

  async checkOverduePayments(): Promise<void> {
    try {
      console.log('[NotificationService] Checking for overdue invoices...');
      
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const overdueInvoices = await db
        .select()
        .from(invoices)
        .where(
          and(
            eq(invoices.status, 'pending'),
            lte(invoices.dueDate, now.toISOString().split('T')[0])
          )
        );

      console.log(`[NotificationService] Found ${overdueInvoices.length} overdue invoices`);

      for (const invoice of overdueInvoices) {
        const contract = await db
          .select()
          .from(rentalContracts)
          .where(eq(rentalContracts.id, invoice.contractId))
          .limit(1);

        if (contract.length === 0) continue;

        const client = await db
          .select()
          .from(rentalClients)
          .where(eq(rentalClients.id, contract[0].clientId))
          .limit(1);

        if (client.length === 0) continue;

        const dueDate = new Date(invoice.dueDate);
        const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

        const severity: 'warning' | 'critical' = daysOverdue > 7 ? 'critical' : 'warning';

        const managers = await db.select().from(users).where(eq(users.role, 'manager'));

        for (const manager of managers) {
          const existingNotification = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, manager.id),
                eq(notifications.type, 'payment_overdue'),
                eq(notifications.read, false),
                sql`${notifications.metadata}->>'invoiceId' = ${invoice.id}`
              )
            )
            .limit(1);

          if (existingNotification.length === 0) {
            await this.createNotification({
              userId: manager.id,
              title: `Payment Overdue - ${client[0].companyName}`,
              message: `Invoice #${invoice.invoiceNumber} from ${client[0].companyName} is ${daysOverdue} days overdue. Amount: $${invoice.amount}. Please follow up immediately.`,
              type: 'payment_overdue',
              severity,
              metadata: {
                invoiceId: invoice.id,
                invoiceNumber: invoice.invoiceNumber,
                clientId: client[0].id,
                clientName: client[0].companyName,
                amount: invoice.amount,
                daysOverdue,
                dueDate: invoice.dueDate,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error checking overdue payments:', error);
    }
  }

  async checkMaintenanceDue(): Promise<void> {
    try {
      console.log('[NotificationService] Checking for upcoming maintenance...');
      
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const upcomingMaintenance = await db
        .select()
        .from(maintenanceSchedules)
        .where(
          and(
            eq(maintenanceSchedules.status, 'scheduled'),
            lte(maintenanceSchedules.nextMaintenanceDate, sevenDaysFromNow.toISOString().split('T')[0]),
            gte(maintenanceSchedules.nextMaintenanceDate, now.toISOString().split('T')[0])
          )
        );

      console.log(`[NotificationService] Found ${upcomingMaintenance.length} upcoming maintenance schedules`);

      for (const maintenance of upcomingMaintenance) {
        const trailer = await db
          .select()
          .from(trailers)
          .where(eq(trailers.id, maintenance.trailerId))
          .limit(1);

        if (trailer.length === 0 || !maintenance.nextMaintenanceDate) continue;

        const nextDate = new Date(maintenance.nextMaintenanceDate);
        const daysUntil = Math.floor((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        const allUsers = await db.select().from(users).where(eq(users.role, 'manager'));

        for (const user of allUsers) {
          const existingNotification = await db
            .select()
            .from(notifications)
            .where(
              and(
                eq(notifications.userId, user.id),
                eq(notifications.type, 'maintenance_due'),
                eq(notifications.read, false),
                eq(notifications.trailerId, trailer[0].id),
                sql`${notifications.metadata}->>'maintenanceId' = ${maintenance.id}`
              )
            )
            .limit(1);

          if (existingNotification.length === 0) {
            await this.createNotification({
              userId: user.id,
              title: `Maintenance Due Soon - ${trailer[0].trailerId}`,
              message: `${maintenance.scheduleType} maintenance for ${trailer[0].trailerId} due in ${daysUntil} days on ${nextDate.toLocaleDateString()}. Please schedule service.`,
              type: 'maintenance_due',
              severity: daysUntil <= 2 ? 'warning' : 'info',
              trailerId: trailer[0].id,
              metadata: {
                maintenanceId: maintenance.id,
                scheduleType: maintenance.scheduleType,
                nextMaintenanceDate: maintenance.nextMaintenanceDate,
                daysUntil,
              },
            });

            if (user.phone) {
              await WhatsAppService.sendEvent(
                "maintenance_due",
                {
                  recipientPhone: user.phone,
                  recipientName: user.name,
                  trailerId: trailer[0].trailerId,
                  daysUntil: String(daysUntil),
                },
                user.tenantId
              );
            }
          }
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error checking maintenance due:', error);
    }
  }

  async checkGeofenceAlerts(): Promise<void> {
    try {
      console.log('[NotificationService] Checking for geofence alerts...');
      
      const allTrailers = await db.select().from(trailers);
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      for (const trailer of allTrailers) {
        if (!trailer.latitude || !trailer.longitude) continue;

        const recentTracking = await db
          .select()
          .from(trackingData)
          .where(
            and(
              eq(trackingData.trailerId, trailer.id),
              gte(trackingData.timestamp, twentyFourHoursAgo)
            )
          )
          .orderBy(desc(trackingData.timestamp))
          .limit(1);

        if (recentTracking.length === 0) continue;

        const lastLocation = recentTracking[0];
        
        const trailerLat = parseFloat(trailer.latitude.toString());
        const trailerLon = parseFloat(trailer.longitude.toString());
        const lastLat = parseFloat(lastLocation.latitude.toString());
        const lastLon = parseFloat(lastLocation.longitude.toString());

        const distance = this.calculateDistance(
          trailerLat,
          trailerLon,
          lastLat,
          lastLon
        );

        if (distance > 100) {
          const managers = await db.select().from(users).where(eq(users.role, 'manager'));

          for (const manager of managers) {
            const existingNotification = await db
              .select()
              .from(notifications)
              .where(
                and(
                  eq(notifications.userId, manager.id),
                  eq(notifications.type, 'gps_geofence'),
                  eq(notifications.read, false),
                  eq(notifications.trailerId, trailer.id),
                  sql`${notifications.createdAt} > ${new Date(Date.now() - 6 * 60 * 60 * 1000)}`
                )
              )
              .limit(1);

            if (existingNotification.length === 0) {
              await this.createNotification({
                userId: manager.id,
                title: `Geofence Alert - ${trailer.trailerId}`,
                message: `${trailer.trailerId} has moved ${distance.toFixed(1)} km from expected location. Current location: ${lastLocation.location || 'Unknown'}`,
                type: 'gps_geofence',
                severity: 'warning',
                trailerId: trailer.id,
                metadata: {
                  distance: distance.toFixed(1),
                  expectedLocation: trailer.location,
                  currentLocation: lastLocation.location,
                  latitude: lastLat,
                  longitude: lastLon,
                },
              });

              if (manager.phone) {
                await WhatsAppService.sendEvent(
                  "geofence_alert",
                  {
                    recipientPhone: manager.phone,
                    recipientName: manager.name,
                    trailerId: trailer.trailerId,
                    distance: distance.toFixed(1),
                    location: lastLocation.location || "Desconhecida",
                  },
                  manager.tenantId
                );
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error checking geofence alerts:', error);
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .update(notifications)
        .set({ 
          read: true,
          readAt: new Date()
        })
        .where(
          and(
            eq(notifications.id, notificationId),
            eq(notifications.userId, userId)
          )
        )
        .returning();

      return result.length > 0;
    } catch (error) {
      console.error('[NotificationService] Error marking notification as read:', error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.read, false)
          )
        );

      return result[0]?.count || 0;
    } catch (error) {
      console.error('[NotificationService] Error getting unread count:', error);
      return 0;
    }
  }
}

export const notificationService = new NotificationService();
