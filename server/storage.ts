import {
  users,
  trailers,
  shares,
  payments,
  trackingData,
  documents,
  auditLogs,
  financialRecords,
  gpsDevices,
  rentalClients,
  rentalContracts,
  invoices,
  emailSettings,
  emailLogs,
  checklists,
  maintenanceSchedules,
  partnerShops,
  brokerEmails,
  brokerDispatches,
  notifications,
  type User,
  type InsertUser,
  type Trailer,
  type InsertTrailer,
  type Share,
  type InsertShare,
  type Payment,
  type InsertPayment,
  type TrackingData,
  type InsertTrackingData,
  type Document,
  type InsertDocument,
  type AuditLog,
  type InsertAuditLog,
  type FinancialRecord,
  type InsertFinancialRecord,
  type GpsDevice,
  type InsertGpsDevice,
  type RentalClient,
  type InsertRentalClient,
  type RentalContract,
  type InsertRentalContract,
  type Invoice,
  type InsertInvoice,
  type EmailSetting,
  type InsertEmailSetting,
  type EmailLog,
  type InsertEmailLog,
  type Checklist,
  type InsertChecklist,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  type PartnerShop,
  type InsertPartnerShop,
  type BrokerEmail,
  type InsertBrokerEmail,
  type BrokerDispatch,
  type InsertBrokerDispatch,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, gte } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string, tenantId: string): Promise<User | undefined>;
  getUserByUsername(username: string, tenantId: string): Promise<User | undefined>;
  getUserByEmail(email: string, tenantId: string): Promise<User | undefined>;
  getAllInvestors(tenantId: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trailer operations
  getTrailer(id: string, tenantId: string): Promise<Trailer | undefined>;
  getTrailerByTrailerId(trailerId: string, tenantId: string): Promise<Trailer | undefined>;
  getAllTrailers(tenantId: string): Promise<Trailer[]>;
  getAvailableTrailers(tenantId: string): Promise<Trailer[]>;
  createTrailer(trailer: InsertTrailer): Promise<Trailer>;
  updateTrailer(id: string, trailer: Partial<Trailer>, tenantId: string): Promise<Trailer>;
  
  // Share operations
  getShare(id: string, tenantId: string): Promise<Share | undefined>;
  getSharesByUserId(userId: string, tenantId: string): Promise<Share[]>;
  getSharesByTrailerId(trailerId: string, tenantId: string): Promise<Share[]>;
  getAllShares(tenantId: string): Promise<Share[]>;
  getAllSharesWithDetails(tenantId: string): Promise<any[]>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, share: Partial<Share>, tenantId: string): Promise<Share>;
  
  // Payment operations
  getPayment(id: string, tenantId: string): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: string, tenantId: string): Promise<Payment[]>;
  getPaymentsByShareId(shareId: string, tenantId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Tracking operations
  getLatestTrackingByTrailerId(trailerId: string, tenantId: string): Promise<TrackingData | undefined>;
  getTrackingHistory(trailerId: string, tenantId: string, limit?: number): Promise<TrackingData[]>;
  getAllLatestTracking(tenantId: string): Promise<TrackingData[]>;
  createTrackingData(data: InsertTrackingData): Promise<TrackingData>;
  
  // Document operations
  getDocumentsByUserId(userId: string, tenantId: string): Promise<Document[]>;
  getDocumentsByShareId(shareId: string, tenantId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(tenantId: string, limit?: number): Promise<AuditLog[]>;
  
  // Financial operations
  getFinancialRecordByMonth(month: string, tenantId: string): Promise<FinancialRecord | undefined>;
  getAllFinancialRecords(tenantId: string): Promise<FinancialRecord[]>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  
  // Dashboard data
  getDashboardStats(userId: string, tenantId: string): Promise<any>;
  getPortfolioData(userId: string, tenantId: string): Promise<any>;
  getCompanyStats(tenantId: string): Promise<any>;
  
  // Advanced Analytics operations
  getRevenueTrend(months: number, tenantId: string): Promise<any[]>;
  getTrailerROI(tenantId: string): Promise<any[]>;
  getPerformanceComparison(tenantId: string): Promise<any>;
  getRevenueForecast(months: number, tenantId: string): Promise<any[]>;
  
  // GPS Device operations
  getGpsDevice(id: string, tenantId: string): Promise<GpsDevice | undefined>;
  getGpsDeviceByTrailerId(trailerId: string, tenantId: string): Promise<GpsDevice | undefined>;
  getAllGpsDevices(tenantId: string): Promise<GpsDevice[]>;
  createGpsDevice(device: InsertGpsDevice): Promise<GpsDevice>;
  updateGpsDevice(id: string, device: Partial<GpsDevice>, tenantId: string): Promise<GpsDevice>;
  deleteGpsDevice(id: string, tenantId: string): Promise<void>;
  
  // Rental Client operations
  getRentalClient(id: string, tenantId: string): Promise<RentalClient | undefined>;
  getAllRentalClients(tenantId: string): Promise<RentalClient[]>;
  createRentalClient(client: InsertRentalClient): Promise<RentalClient>;
  updateRentalClient(id: string, client: Partial<RentalClient>, tenantId: string): Promise<RentalClient>;
  deleteRentalClient(id: string, tenantId: string): Promise<void>;
  
  // Rental Contract operations
  getRentalContract(id: string, tenantId: string): Promise<RentalContract | undefined>;
  getAllRentalContracts(tenantId: string): Promise<any[]>;
  getContractsByClientId(clientId: string, tenantId: string): Promise<RentalContract[]>;
  getContractsByTrailerId(trailerId: string, tenantId: string): Promise<RentalContract[]>;
  createRentalContract(contract: InsertRentalContract): Promise<RentalContract>;
  updateRentalContract(id: string, contract: Partial<RentalContract>, tenantId: string): Promise<RentalContract>;
  terminateContract(id: string, tenantId: string): Promise<RentalContract>;
  
  // Invoice operations
  getInvoice(id: string, tenantId: string): Promise<Invoice | undefined>;
  getAllInvoices(tenantId: string): Promise<any[]>;
  getInvoicesByContractId(contractId: string, tenantId: string): Promise<Invoice[]>;
  getOverdueInvoices(tenantId: string): Promise<any[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<InsertInvoice>, tenantId: string): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string, tenantId: string, paidDate?: Date): Promise<Invoice>;
  deleteInvoice(id: string, tenantId: string): Promise<void>;

  // Email Log operations
  createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog>;
  getAllEmailLogs(tenantId: string): Promise<EmailLog[]>;
  getEmailLogsByRecipient(recipientEmail: string, tenantId: string): Promise<EmailLog[]>;
  
  // Checklist operations
  getChecklist(id: string, tenantId: string): Promise<Checklist | undefined>;
  getChecklistsByTrailerId(trailerId: string, tenantId: string): Promise<Checklist[]>;
  getChecklistsByType(type: string, tenantId: string): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: string, checklist: Partial<Checklist>, tenantId: string): Promise<Checklist>;
  completeChecklist(id: string, approved: boolean, approvedById: string, tenantId: string, notes?: string, rejectionReason?: string): Promise<Checklist>;
  
  // Maintenance Schedule operations
  getMaintenanceSchedule(id: string, tenantId: string): Promise<MaintenanceSchedule | undefined>;
  getMaintenanceSchedulesByTrailerId(trailerId: string, tenantId: string): Promise<MaintenanceSchedule[]>;
  getMaintenanceAlerts(tenantId: string): Promise<MaintenanceSchedule[]>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: string, schedule: Partial<MaintenanceSchedule>, tenantId: string): Promise<MaintenanceSchedule>;
  completeMaintenance(id: string, completionDate: Date, tenantId: string, cost?: string, notes?: string): Promise<MaintenanceSchedule>;
  
  // Partner Shop operations
  getPartnerShop(id: string, tenantId: string): Promise<PartnerShop | undefined>;
  getAllPartnerShops(tenantId: string): Promise<PartnerShop[]>;
  createPartnerShop(shop: InsertPartnerShop): Promise<PartnerShop>;
  updatePartnerShop(id: string, shop: Partial<PartnerShop>, tenantId: string): Promise<PartnerShop>;
  deletePartnerShop(id: string, tenantId: string): Promise<void>;
  
  // Broker Email operations
  getBrokerEmail(id: string, tenantId: string): Promise<BrokerEmail | undefined>;
  getBrokerEmailsByTrailerId(trailerId: string, tenantId: string): Promise<BrokerEmail[]>;
  getAllBrokerEmails(tenantId: string): Promise<BrokerEmail[]>;
  createBrokerEmail(email: InsertBrokerEmail): Promise<BrokerEmail>;
  deleteBrokerEmail(id: string, tenantId: string): Promise<void>;

  // Broker Dispatch operations
  createBrokerDispatch(data: InsertBrokerDispatch): Promise<BrokerDispatch>;
  getBrokerDispatchById(id: string, tenantId: string): Promise<BrokerDispatch | null>;
  getAllBrokerDispatches(tenantId: string): Promise<BrokerDispatch[]>;
  updateBrokerDispatch(id: string, data: Partial<InsertBrokerDispatch>, tenantId: string): Promise<BrokerDispatch>;
  getBrokerDispatchesByTrailer(trailerId: string, tenantId: string): Promise<BrokerDispatch[]>;

  // Notification operations
  getNotifications(userId: string, tenantId: string): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string, tenantId: string): Promise<number>;
  markNotificationAsRead(notificationId: string, userId: string, tenantId: string): Promise<boolean>;
  deleteNotification(notificationId: string, userId: string, tenantId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.id, id), eq(users.tenantId, tenantId)));
    return user;
  }

  async getUserByUsername(username: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.username, username), eq(users.tenantId, tenantId)));
    return user;
  }

  async getUserByEmail(email: string, tenantId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(and(eq(users.email, email), eq(users.tenantId, tenantId)));
    return user;
  }

  async getAllInvestors(tenantId: string): Promise<User[]> {
    const investors = await db.select().from(users).where(and(eq(users.role, "investor"), eq(users.tenantId, tenantId)));
    return investors;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  // Trailer operations
  async getTrailer(id: string, tenantId: string): Promise<Trailer | undefined> {
    const [trailer] = await db.select().from(trailers).where(and(eq(trailers.id, id), eq(trailers.tenantId, tenantId)));
    return trailer;
  }

  async getTrailerByTrailerId(trailerId: string, tenantId: string): Promise<Trailer | undefined> {
    const [trailer] = await db.select().from(trailers).where(and(eq(trailers.trailerId, trailerId), eq(trailers.tenantId, tenantId)));
    return trailer;
  }

  async getAllTrailers(tenantId: string): Promise<any[]> {
    const allTrailers = await db.select().from(trailers).where(eq(trailers.tenantId, tenantId)).orderBy(desc(trailers.createdAt));
    
    // For each trailer, count sold shares
    const trailersWithShareInfo = await Promise.all(
      allTrailers.map(async (trailer) => {
        const soldShares = await db
          .select()
          .from(shares)
          .where(and(eq(shares.trailerId, trailer.id), eq(shares.tenantId, tenantId)));
        
        const totalShares = parseInt(trailer.totalShares?.toString() || "1");
        
        return {
          ...trailer,
          soldShares: soldShares.length,
          totalShares,
        };
      })
    );
    
    return trailersWithShareInfo;
  }

  async getAvailableTrailers(tenantId: string): Promise<any[]> {
    // Get all trailers except expired ones
    const availableTrailers = await db
      .select()
      .from(trailers)
      .where(eq(trailers.tenantId, tenantId))
      .orderBy(desc(trailers.createdAt));
    
    // For each trailer, count sold shares and calculate available shares
    const trailersWithAvailability = await Promise.all(
      availableTrailers.map(async (trailer) => {
        const soldShares = await db
          .select()
          .from(shares)
          .where(and(eq(shares.trailerId, trailer.id), eq(shares.tenantId, tenantId)));
        
        const totalShares = parseInt(trailer.totalShares?.toString() || "1");
        const availableShares = totalShares - soldShares.length;
        
        return {
          ...trailer,
          soldShares: soldShares.length,
          availableShares,
        };
      })
    );
    
    // Filter to only show trailers with available shares and not expired
    return trailersWithAvailability.filter((t) => t.availableShares > 0 && t.status !== "expired");
  }

  async createTrailer(trailer: InsertTrailer): Promise<Trailer> {
    const [newTrailer] = await db.insert(trailers).values(trailer).returning();
    return newTrailer;
  }

  async updateTrailer(id: string, trailer: Partial<Trailer>, tenantId: string): Promise<Trailer> {
    const [updated] = await db
      .update(trailers)
      .set({ ...trailer, updatedAt: new Date() })
      .where(and(eq(trailers.id, id), eq(trailers.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Trailer not found or access denied");
    return updated;
  }

  // Share operations
  async getShare(id: string, tenantId: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(and(eq(shares.id, id), eq(shares.tenantId, tenantId)));
    return share;
  }

  async getSharesByUserId(userId: string, tenantId: string): Promise<Share[]> {
    return await db.select().from(shares).where(and(eq(shares.userId, userId), eq(shares.tenantId, tenantId)));
  }

  async getSharesByTrailerId(trailerId: string, tenantId: string): Promise<Share[]> {
    return await db.select().from(shares).where(and(eq(shares.trailerId, trailerId), eq(shares.tenantId, tenantId)));
  }

  async getAllShares(tenantId: string): Promise<Share[]> {
    return await db.select().from(shares).where(eq(shares.tenantId, tenantId)).orderBy(desc(shares.createdAt));
  }

  async getAllSharesWithDetails(tenantId: string): Promise<any[]> {
    const result = await db
      .select({
        id: shares.id,
        userId: shares.userId,
        trailerId: shares.trailerId,
        status: shares.status,
        purchaseDate: shares.purchaseDate,
        purchaseValue: shares.purchaseValue,
        monthlyReturn: shares.monthlyReturn,
        totalReturns: shares.totalReturns,
        createdAt: shares.createdAt,
        updatedAt: shares.updatedAt,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
        trailerTrailerId: trailers.trailerId,
        trailerPurchaseValue: trailers.purchaseValue,
        trailerCurrentValue: trailers.currentValue,
        trailerStatus: trailers.status,
        trailerLocation: trailers.location,
      })
      .from(shares)
      .leftJoin(users, eq(shares.userId, users.id))
      .leftJoin(trailers, eq(shares.trailerId, trailers.id))
      .where(eq(shares.tenantId, tenantId))
      .orderBy(desc(shares.createdAt));
    
    return result;
  }

  async createShare(share: InsertShare): Promise<Share> {
    const [newShare] = await db.insert(shares).values(share).returning();
    return newShare;
  }

  async updateShare(id: string, share: Partial<Share>, tenantId: string): Promise<Share> {
    const [updated] = await db
      .update(shares)
      .set({ ...share, updatedAt: new Date() })
      .where(and(eq(shares.id, id), eq(shares.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Share not found or access denied");
    return updated;
  }

  // Payment operations
  async getPayment(id: string, tenantId: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(and(eq(payments.id, id), eq(payments.tenantId, tenantId)));
    return payment;
  }

  async getPaymentsByUserId(userId: string, tenantId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(and(eq(payments.userId, userId), eq(payments.tenantId, tenantId)))
      .orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByShareId(shareId: string, tenantId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(and(eq(payments.shareId, shareId), eq(payments.tenantId, tenantId)))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  // Tracking operations
  async getLatestTrackingByTrailerId(trailerId: string, tenantId: string): Promise<TrackingData | undefined> {
    const [tracking] = await db
      .select()
      .from(trackingData)
      .where(and(eq(trackingData.trailerId, trailerId), eq(trackingData.tenantId, tenantId)))
      .orderBy(desc(trackingData.timestamp))
      .limit(1);
    return tracking;
  }

  async getTrackingHistory(trailerId: string, tenantId: string, limit: number = 50): Promise<TrackingData[]> {
    return await db
      .select()
      .from(trackingData)
      .where(and(eq(trackingData.trailerId, trailerId), eq(trackingData.tenantId, tenantId)))
      .orderBy(desc(trackingData.timestamp))
      .limit(limit);
  }

  async getAllLatestTracking(tenantId: string): Promise<TrackingData[]> {
    const latestTracking = await db
      .select()
      .from(trackingData)
      .where(eq(trackingData.tenantId, tenantId))
      .orderBy(desc(trackingData.timestamp));
    
    const trackingMap = new Map<string, TrackingData>();
    latestTracking.forEach(track => {
      if (!trackingMap.has(track.trailerId)) {
        trackingMap.set(track.trailerId, track);
      }
    });
    
    return Array.from(trackingMap.values());
  }

  async createTrackingData(data: InsertTrackingData): Promise<TrackingData> {
    const [tracking] = await db.insert(trackingData).values(data).returning();
    return tracking;
  }

  // Document operations
  async getDocumentsByUserId(userId: string, tenantId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.userId, userId), eq(documents.tenantId, tenantId)))
      .orderBy(desc(documents.uploadedAt));
  }

  async getDocumentsByShareId(shareId: string, tenantId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(and(eq(documents.shareId, shareId), eq(documents.tenantId, tenantId)))
      .orderBy(desc(documents.uploadedAt));
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  // Audit log operations
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db.insert(auditLogs).values(log).returning();
    return auditLog;
  }

  async getRecentAuditLogs(tenantId: string, limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Financial operations
  async getFinancialRecordByMonth(month: string, tenantId: string): Promise<FinancialRecord | undefined> {
    const [record] = await db
      .select()
      .from(financialRecords)
      .where(and(eq(financialRecords.month, month), eq(financialRecords.tenantId, tenantId)));
    return record;
  }

  async getAllFinancialRecords(tenantId: string): Promise<FinancialRecord[]> {
    return await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.tenantId, tenantId))
      .orderBy(desc(financialRecords.createdAt));
  }

  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const [newRecord] = await db.insert(financialRecords).values(record).returning();
    return newRecord;
  }

  // Dashboard data
  async getDashboardStats(userId: string, tenantId: string): Promise<any> {
    const userShares = await this.getSharesByUserId(userId, tenantId);
    const userPayments = await this.getPaymentsByUserId(userId, tenantId);
    
    const totalValue = userShares.reduce((sum, share) => 
      sum + parseFloat(share.purchaseValue || "0"), 0);
    
    const monthlyReturn = userShares.reduce((sum, share) => {
      const value = parseFloat(share.purchaseValue || "0");
      return sum + (value * parseFloat(share.monthlyReturn || "0") / 100);
    }, 0);

    const totalReturns = userShares.reduce((sum, share) =>
      sum + parseFloat(share.totalReturns || "0"), 0);

    // Get last 6 unique months sorted chronologically
    const uniqueMonths = Array.from(new Set(userPayments.map(p => p.referenceMonth)))
      .sort()
      .slice(-6); // Get last 6 months
    
    // Get all payments from those 6 months
    const last6MonthsPayments = userPayments.filter(p => 
      uniqueMonths.includes(p.referenceMonth)
    );

    return {
      totalValue,
      activeShares: userShares.filter(s => s.status === "active").length,
      monthlyReturn,
      totalReturns,
      nextPayment: monthlyReturn,
      recentPayments: last6MonthsPayments,
    };
  }

  // Company-wide statistics for managers
  async getCompanyStats(tenantId: string): Promise<any> {
    const allTrailers = await this.getAllTrailers(tenantId);
    const allShares = await db.select().from(shares).where(eq(shares.tenantId, tenantId));
    const allPayments = await db.select().from(payments).where(eq(payments.tenantId, tenantId));
    const recentRecords = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.tenantId, tenantId))
      .orderBy(sql`month desc`)
      .limit(6);
    
    const totalFleetValue = allTrailers.reduce((sum, trailer) => 
      sum + parseFloat(trailer.purchaseValue || "0"), 0);
    
    const totalSharesSold = allShares.filter(s => s.status === "active").length;
    
    const totalRevenue = recentRecords.reduce((sum, record) =>
      sum + parseFloat(record.totalRevenue || "0"), 0);
    
    const totalMargin = recentRecords.reduce((sum, record) =>
      sum + parseFloat(record.companyMargin || "0"), 0);

    // Get last 6 unique months from financial records
    const revenueData = recentRecords
      .reverse()
      .map(record => ({
        month: record.month,
        revenue: parseFloat(record.totalRevenue || "0"),
      }));

    // Recent system activity - last payments
    const recentActivity = await db
      .select()
      .from(payments)
      .where(eq(payments.tenantId, tenantId))
      .orderBy(desc(payments.paymentDate))
      .limit(10);

    return {
      totalFleetValue,
      totalTrailers: allTrailers.length,
      activeTrailers: allTrailers.filter(t => t.status === "active").length,
      totalSharesSold,
      totalRevenue,
      totalMargin,
      revenueData,
      recentActivity,
    };
  }

  async getPortfolioData(userId: string, tenantId: string): Promise<any> {
    const userShares = await this.getSharesByUserId(userId, tenantId);
    const userPayments = await this.getPaymentsByUserId(userId, tenantId);
    
    const sharesWithTrailers = await Promise.all(
      userShares.map(async (share) => {
        const trailer = await this.getTrailer(share.trailerId, tenantId);
        return { ...share, trailer };
      })
    );

    return {
      shares: sharesWithTrailers,
      payments: userPayments,
    };
  }

  // Advanced Analytics operations
  async getRevenueTrend(months: number, tenantId: string): Promise<any[]> {
    const allPayments = await db.select().from(payments).where(eq(payments.tenantId, tenantId)).orderBy(desc(payments.paymentDate));
    // Get invoices through their contracts to filter by tenantId
    const allInvoices = await db
      .select({
        id: invoices.id,
        amount: invoices.amount,
        status: invoices.status,
        paidDate: invoices.paidDate,
        contractId: invoices.contractId,
      })
      .from(invoices)
      .leftJoin(rentalContracts, eq(invoices.contractId, rentalContracts.id))
      .where(eq(rentalContracts.tenantId, tenantId))
      .orderBy(desc(invoices.dueDate));
    
    // Group payments by month
    const now = new Date();
    const monthlyData: Record<string, { investor: number; rental: number }> = {};
    
    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = { investor: 0, rental: 0 };
    }
    
    // Sum investor payments
    allPayments.forEach(payment => {
      const date = new Date(payment.paymentDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].investor += parseFloat(payment.amount || "0");
      }
    });
    
    // Sum rental invoices (paid only)
    allInvoices.forEach(invoice => {
      if (invoice.status === "paid" && invoice.paidDate) {
        const date = new Date(invoice.paidDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].rental += parseFloat(invoice.amount || "0");
        }
      }
    });
    
    // Convert to array and sort
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        investorPayouts: data.investor,
        rentalRevenue: data.rental,
        totalRevenue: data.investor + data.rental,
        margin: data.rental - data.investor,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }

  async getTrailerROI(tenantId: string): Promise<any[]> {
    // Optimized: Get all data in bulk to avoid N+1 queries
    // Don't use getAllTrailers() here as it has N+1 for shares - fetch directly
    const allTrailers = await db.select().from(trailers).where(eq(trailers.tenantId, tenantId));
    const allContracts = await db.select().from(rentalContracts).where(eq(rentalContracts.tenantId, tenantId));
    const allShares = await db.select().from(shares).where(eq(shares.tenantId, tenantId));
    const allPayments = await db.select().from(payments).where(eq(payments.tenantId, tenantId));
    
    const roiData = allTrailers.map((trailer) => {
      // Filter contracts for this trailer
      const trailerContracts = allContracts.filter(c => c.trailerId === trailer.id);
      
      // Calculate rental revenue considering contract status and end dates
      const totalRentalRevenue = trailerContracts.reduce((sum, contract) => {
        if (contract.status === "pending") {
          return sum; // Don't count pending contracts
        }
        
        const startDate = new Date(contract.startDate);
        const now = new Date();
        
        // Use end date if contract is terminated, otherwise use current date
        const endDate = contract.endDate ? new Date(contract.endDate) : now;
        const effectiveEndDate = contract.status === "terminated" ? endDate : now;
        
        // Calculate months between start and effective end
        const monthsDiff = Math.max(0, Math.floor(
          (effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        ));
        
        return sum + parseFloat(contract.monthlyRate || "0") * monthsDiff;
      }, 0);
      
      // Filter shares and payments for this trailer
      const trailerShares = allShares.filter(s => s.trailerId === trailer.id);
      const shareIds = trailerShares.map(s => s.id);
      const trailerPayments = allPayments.filter(p => shareIds.includes(p.shareId));
      
      const totalInvestorPayouts = trailerPayments.reduce((sum, payment) => 
        sum + parseFloat(payment.amount || "0"), 0
      );
      
      const purchaseValue = parseFloat(trailer.purchaseValue || "0");
      const netProfit = totalRentalRevenue - totalInvestorPayouts;
      const roi = purchaseValue > 0 ? (netProfit / purchaseValue) * 100 : 0;
      
      return {
        trailerId: trailer.id,
        trailerName: `${trailer.trailerType} - ${trailer.model}`,
        purchaseValue,
        rentalRevenue: totalRentalRevenue,
        investorPayouts: totalInvestorPayouts,
        netProfit,
        roi: Math.round(roi * 100) / 100,
      };
    });
    
    // Ensure results are sorted by ROI descending
    return roiData.sort((a, b) => b.roi - a.roi);
  }

  async getPerformanceComparison(tenantId: string): Promise<any> {
    // Optimized: Get all data in bulk
    // Don't use getAllTrailers() here as it has N+1 for shares - fetch directly
    const allTrailers = await db.select().from(trailers).where(eq(trailers.tenantId, tenantId));
    const allContracts = await db.select().from(rentalContracts).where(eq(rentalContracts.tenantId, tenantId));
    
    const typeData: Record<string, { count: number; revenue: number; avgROI: number }> = {};
    
    for (const trailer of allTrailers) {
      if (!typeData[trailer.trailerType]) {
        typeData[trailer.trailerType] = { count: 0, revenue: 0, avgROI: 0 };
      }
      
      typeData[trailer.trailerType].count++;
      
      // Calculate revenue for this trailer considering contract status
      const trailerContracts = allContracts.filter(c => c.trailerId === trailer.id);
      const revenue = trailerContracts.reduce((sum, contract) => {
        if (contract.status === "pending") {
          return sum;
        }
        
        const startDate = new Date(contract.startDate);
        const now = new Date();
        const endDate = contract.endDate ? new Date(contract.endDate) : now;
        const effectiveEndDate = contract.status === "terminated" ? endDate : now;
        
        const monthsDiff = Math.max(0, Math.floor(
          (effectiveEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
        ));
        
        return sum + parseFloat(contract.monthlyRate || "0") * monthsDiff;
      }, 0);
      
      typeData[trailer.trailerType].revenue += revenue;
      
      const purchaseValue = parseFloat(trailer.purchaseValue || "0");
      if (purchaseValue > 0) {
        typeData[trailer.trailerType].avgROI += (revenue / purchaseValue) * 100;
      }
    }
    
    // Calculate averages
    const comparison = Object.entries(typeData).map(([type, data]) => ({
      type,
      count: data.count,
      totalRevenue: data.revenue,
      avgRevenue: data.count > 0 ? data.revenue / data.count : 0,
      avgROI: data.count > 0 ? Math.round((data.avgROI / data.count) * 100) / 100 : 0,
    }));
    
    return {
      byType: comparison,
      totalTrailers: allTrailers.length,
      activeTrailers: allTrailers.filter(t => t.status === "active").length,
    };
  }

  async getRevenueForecast(months: number, tenantId: string): Promise<any[]> {
    // Get historical data (last 6 months)
    const historical = await this.getRevenueTrend(6, tenantId);
    
    if (historical.length === 0) {
      return [];
    }
    
    // Calculate average monthly growth rate
    let totalGrowth = 0;
    let growthCount = 0;
    
    for (let i = 1; i < historical.length; i++) {
      const prev = historical[i - 1].totalRevenue;
      const curr = historical[i].totalRevenue;
      if (prev > 0) {
        totalGrowth += ((curr - prev) / prev) * 100;
        growthCount++;
      }
    }
    
    const avgGrowthRate = growthCount > 0 ? totalGrowth / growthCount : 2; // Default 2% growth
    const lastRevenue = historical[historical.length - 1].totalRevenue;
    
    // Generate forecast
    const forecast = [];
    const lastMonth = historical[historical.length - 1].month;
    const [year, month] = lastMonth.split('-').map(Number);
    
    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(year, month - 1 + i, 1);
      const forecastMonth = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      const forecastRevenue = lastRevenue * Math.pow(1 + (avgGrowthRate / 100), i);
      
      forecast.push({
        month: forecastMonth,
        forecastRevenue: Math.round(forecastRevenue * 100) / 100,
        growthRate: avgGrowthRate,
        confidence: Math.max(50, 95 - (i * 5)), // Confidence decreases over time
      });
    }
    
    return forecast;
  }

  // GPS Device operations
  async getGpsDevice(id: string, tenantId: string): Promise<GpsDevice | undefined> {
    const [device] = await db.select().from(gpsDevices).where(and(eq(gpsDevices.id, id), eq(gpsDevices.tenantId, tenantId)));
    return device;
  }

  async getGpsDeviceByTrailerId(trailerId: string, tenantId: string): Promise<GpsDevice | undefined> {
    const [device] = await db.select().from(gpsDevices).where(and(eq(gpsDevices.trailerId, trailerId), eq(gpsDevices.tenantId, tenantId)));
    return device;
  }

  async getAllGpsDevices(tenantId: string): Promise<GpsDevice[]> {
    return await db.select().from(gpsDevices).where(eq(gpsDevices.tenantId, tenantId)).orderBy(desc(gpsDevices.createdAt));
  }

  async createGpsDevice(device: InsertGpsDevice): Promise<GpsDevice> {
    const [newDevice] = await db.insert(gpsDevices).values(device).returning();
    return newDevice;
  }

  async updateGpsDevice(id: string, device: Partial<GpsDevice>, tenantId: string): Promise<GpsDevice> {
    const [updated] = await db
      .update(gpsDevices)
      .set({ ...device, updatedAt: new Date() })
      .where(and(eq(gpsDevices.id, id), eq(gpsDevices.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("GPS device not found or access denied");
    return updated;
  }

  async deleteGpsDevice(id: string, tenantId: string): Promise<void> {
    await db.delete(gpsDevices).where(and(eq(gpsDevices.id, id), eq(gpsDevices.tenantId, tenantId)));
  }

  // Rental Client operations
  async getRentalClient(id: string, tenantId: string): Promise<RentalClient | undefined> {
    const [client] = await db.select().from(rentalClients).where(and(eq(rentalClients.id, id), eq(rentalClients.tenantId, tenantId)));
    return client;
  }

  async getAllRentalClients(tenantId: string): Promise<RentalClient[]> {
    return await db.select().from(rentalClients).where(eq(rentalClients.tenantId, tenantId)).orderBy(desc(rentalClients.createdAt));
  }

  async createRentalClient(client: InsertRentalClient): Promise<RentalClient> {
    const [newClient] = await db.insert(rentalClients).values(client).returning();
    return newClient;
  }

  async updateRentalClient(id: string, client: Partial<RentalClient>, tenantId: string): Promise<RentalClient> {
    const [updated] = await db
      .update(rentalClients)
      .set({ ...client, updatedAt: new Date() })
      .where(and(eq(rentalClients.id, id), eq(rentalClients.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Rental client not found or access denied");
    return updated;
  }

  async deleteRentalClient(id: string, tenantId: string): Promise<void> {
    await db.delete(rentalClients).where(and(eq(rentalClients.id, id), eq(rentalClients.tenantId, tenantId)));
  }

  // Rental Contract operations
  async getRentalContract(id: string, tenantId: string): Promise<RentalContract | undefined> {
    const [contract] = await db.select().from(rentalContracts).where(and(eq(rentalContracts.id, id), eq(rentalContracts.tenantId, tenantId)));
    return contract;
  }

  async getAllRentalContracts(tenantId: string): Promise<any[]> {
    const contracts = await db
      .select({
        id: rentalContracts.id,
        contractNumber: rentalContracts.contractNumber,
        clientId: rentalContracts.clientId,
        trailerId: rentalContracts.trailerId,
        startDate: rentalContracts.startDate,
        endDate: rentalContracts.endDate,
        monthlyRate: rentalContracts.monthlyRate,
        duration: rentalContracts.duration,
        status: rentalContracts.status,
        notes: rentalContracts.notes,
        createdAt: rentalContracts.createdAt,
        clientName: rentalClients.companyName,
        clientEmail: rentalClients.email,
        trailerTrailerId: trailers.trailerId,
        trailerType: trailers.trailerType,
        trailerModel: trailers.model,
      })
      .from(rentalContracts)
      .leftJoin(rentalClients, eq(rentalContracts.clientId, rentalClients.id))
      .leftJoin(trailers, eq(rentalContracts.trailerId, trailers.id))
      .where(eq(rentalContracts.tenantId, tenantId))
      .orderBy(desc(rentalContracts.createdAt));
    
    return contracts;
  }

  async getContractsByClientId(clientId: string, tenantId: string): Promise<RentalContract[]> {
    return await db
      .select()
      .from(rentalContracts)
      .where(and(eq(rentalContracts.clientId, clientId), eq(rentalContracts.tenantId, tenantId)))
      .orderBy(desc(rentalContracts.createdAt));
  }

  async getContractsByTrailerId(trailerId: string, tenantId: string): Promise<RentalContract[]> {
    return await db
      .select()
      .from(rentalContracts)
      .where(and(eq(rentalContracts.trailerId, trailerId), eq(rentalContracts.tenantId, tenantId)))
      .orderBy(desc(rentalContracts.createdAt));
  }

  async createRentalContract(contract: InsertRentalContract): Promise<RentalContract> {
    const [newContract] = await db.insert(rentalContracts).values(contract).returning();
    return newContract;
  }

  async updateRentalContract(id: string, contract: Partial<RentalContract>, tenantId: string): Promise<RentalContract> {
    const [updated] = await db
      .update(rentalContracts)
      .set({ ...contract, updatedAt: new Date() })
      .where(and(eq(rentalContracts.id, id), eq(rentalContracts.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Rental contract not found or access denied");
    return updated;
  }

  async terminateContract(id: string, tenantId: string): Promise<RentalContract> {
    const contract = await this.getRentalContract(id, tenantId);
    if (!contract) {
      throw new Error("Contract not found or access denied");
    }

    const [terminated] = await db
      .update(rentalContracts)
      .set({ status: "terminated", updatedAt: new Date() })
      .where(and(eq(rentalContracts.id, id), eq(rentalContracts.tenantId, tenantId)))
      .returning();

    if (contract.trailerId) {
      await this.updateTrailer(contract.trailerId, { status: "stock" }, tenantId);
    }

    return terminated;
  }

  // Invoice operations
  async getInvoice(id: string, tenantId: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        status: invoices.status,
        referenceMonth: invoices.referenceMonth,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(rentalContracts, eq(invoices.contractId, rentalContracts.id))
      .where(and(eq(invoices.id, id), eq(rentalContracts.tenantId, tenantId)));
    return invoice;
  }

  async getAllInvoices(tenantId: string): Promise<any[]> {
    const allInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        status: invoices.status,
        referenceMonth: invoices.referenceMonth,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
        contractNumber: rentalContracts.contractNumber,
        clientName: rentalClients.companyName,
        trailerTrailerId: trailers.trailerId,
      })
      .from(invoices)
      .leftJoin(rentalContracts, eq(invoices.contractId, rentalContracts.id))
      .leftJoin(rentalClients, eq(rentalContracts.clientId, rentalClients.id))
      .leftJoin(trailers, eq(rentalContracts.trailerId, trailers.id))
      .where(eq(rentalContracts.tenantId, tenantId))
      .orderBy(desc(invoices.createdAt));
    
    return allInvoices;
  }

  async getInvoicesByContractId(contractId: string, tenantId: string): Promise<Invoice[]> {
    const invoicesList = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        paidDate: invoices.paidDate,
        status: invoices.status,
        referenceMonth: invoices.referenceMonth,
        notes: invoices.notes,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(rentalContracts, eq(invoices.contractId, rentalContracts.id))
      .where(and(eq(invoices.contractId, contractId), eq(rentalContracts.tenantId, tenantId)))
      .orderBy(desc(invoices.dueDate));
    return invoicesList as Invoice[];
  }

  async getOverdueInvoices(tenantId: string): Promise<any[]> {
    const overdueInvoices = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        contractId: invoices.contractId,
        amount: invoices.amount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        referenceMonth: invoices.referenceMonth,
        clientName: rentalClients.companyName,
        contractNumber: rentalContracts.contractNumber,
      })
      .from(invoices)
      .leftJoin(rentalContracts, eq(invoices.contractId, rentalContracts.id))
      .leftJoin(rentalClients, eq(rentalContracts.clientId, rentalClients.id))
      .where(and(eq(invoices.status, "overdue"), eq(rentalContracts.tenantId, tenantId)))
      .orderBy(invoices.dueDate);
    
    return overdueInvoices;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: string, tenantId: string, paidDate?: Date): Promise<Invoice> {
    const updateData: any = { status };
    if (paidDate) {
      updateData.paidDate = paidDate;
    }
    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .from(rentalContracts)
      .where(and(eq(invoices.id, id), eq(invoices.contractId, rentalContracts.id), eq(rentalContracts.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Invoice not found or access denied");
    return updated;
  }

  async updateInvoice(id: string, updates: Partial<InsertInvoice>, tenantId: string): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set(updates)
      .from(rentalContracts)
      .where(and(eq(invoices.id, id), eq(invoices.contractId, rentalContracts.id), eq(rentalContracts.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Invoice not found or access denied");
    return updated;
  }

  async deleteInvoice(id: string, tenantId: string): Promise<void> {
    await db
      .delete(invoices)
      .where(and(
        eq(invoices.id, id),
        sql`${invoices.contractId} IN (SELECT id FROM ${rentalContracts} WHERE ${rentalContracts.tenantId} = ${tenantId})`
      ));
  }

  // Email Log operations
  async createEmailLog(emailLog: InsertEmailLog): Promise<EmailLog> {
    const [newLog] = await db.insert(emailLogs).values(emailLog).returning();
    return newLog;
  }

  async getAllEmailLogs(tenantId: string): Promise<EmailLog[]> {
    return db.select().from(emailLogs).where(eq(emailLogs.tenantId, tenantId)).orderBy(desc(emailLogs.sentAt));
  }

  async getEmailLogsByRecipient(recipientEmail: string, tenantId: string): Promise<EmailLog[]> {
    return db.select().from(emailLogs).where(and(eq(emailLogs.recipientEmail, recipientEmail), eq(emailLogs.tenantId, tenantId))).orderBy(desc(emailLogs.sentAt));
  }

  // Checklist operations
  async getChecklist(id: string, tenantId: string): Promise<Checklist | undefined> {
    const [checklist] = await db
      .select()
      .from(checklists)
      .leftJoin(trailers, eq(checklists.trailerId, trailers.id))
      .where(and(eq(checklists.id, id), eq(trailers.tenantId, tenantId)));
    return checklist ? checklist.checklists : undefined;
  }

  async getChecklistsByTrailerId(trailerId: string, tenantId: string): Promise<Checklist[]> {
    const results = await db
      .select({
        id: checklists.id,
        trailerId: checklists.trailerId,
        type: checklists.type,
        items: checklists.items,
        approved: checklists.approved,
        rejected: checklists.rejected,
        rejectionReason: checklists.rejectionReason,
        inspector: checklists.inspector,
        approvedBy: checklists.approvedBy,
        approvedAt: checklists.approvedAt,
        photos: checklists.photos,
        notes: checklists.notes,
        inspectionDate: checklists.inspectionDate,
        createdAt: checklists.createdAt,
      })
      .from(checklists)
      .leftJoin(trailers, eq(checklists.trailerId, trailers.id))
      .where(and(eq(checklists.trailerId, trailerId), eq(trailers.tenantId, tenantId)))
      .orderBy(desc(checklists.inspectionDate));
    return results as Checklist[];
  }

  async getChecklistsByType(type: string, tenantId: string): Promise<Checklist[]> {
    const results = await db
      .select({
        id: checklists.id,
        trailerId: checklists.trailerId,
        type: checklists.type,
        items: checklists.items,
        approved: checklists.approved,
        rejected: checklists.rejected,
        rejectionReason: checklists.rejectionReason,
        inspector: checklists.inspector,
        approvedBy: checklists.approvedBy,
        approvedAt: checklists.approvedAt,
        photos: checklists.photos,
        notes: checklists.notes,
        inspectionDate: checklists.inspectionDate,
        createdAt: checklists.createdAt,
      })
      .from(checklists)
      .leftJoin(trailers, eq(checklists.trailerId, trailers.id))
      .where(and(eq(checklists.type, type), eq(trailers.tenantId, tenantId)))
      .orderBy(desc(checklists.inspectionDate));
    return results as Checklist[];
  }

  async createChecklist(checklist: InsertChecklist): Promise<Checklist> {
    const [newChecklist] = await db.insert(checklists).values(checklist).returning();
    return newChecklist;
  }

  async updateChecklist(id: string, checklist: Partial<Checklist>, tenantId: string): Promise<Checklist> {
    const [updated] = await db
      .update(checklists)
      .set(checklist)
      .from(trailers)
      .where(and(eq(checklists.id, id), eq(checklists.trailerId, trailers.id), eq(trailers.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Checklist not found or access denied");
    return updated;
  }

  async completeChecklist(id: string, approved: boolean, approvedById: string, tenantId: string, notes?: string, rejectionReason?: string): Promise<Checklist> {
    const updateData: any = { 
      approved,
      rejected: !approved,
      approvedBy: approvedById,
      approvedAt: new Date()
    };
    if (notes) {
      updateData.notes = notes;
    }
    if (!approved && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }
    const [completed] = await db
      .update(checklists)
      .set(updateData)
      .from(trailers)
      .where(and(eq(checklists.id, id), eq(checklists.trailerId, trailers.id), eq(trailers.tenantId, tenantId)))
      .returning();
    if (!completed) throw new Error("Checklist not found or access denied");
    return completed;
  }

  // Maintenance Schedule operations
  async getMaintenanceSchedule(id: string, tenantId: string): Promise<MaintenanceSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(maintenanceSchedules)
      .leftJoin(trailers, eq(maintenanceSchedules.trailerId, trailers.id))
      .where(and(eq(maintenanceSchedules.id, id), eq(trailers.tenantId, tenantId)));
    return schedule ? schedule.maintenance_schedules : undefined;
  }

  async getMaintenanceSchedulesByTrailerId(trailerId: string, tenantId: string): Promise<MaintenanceSchedule[]> {
    const results = await db
      .select({
        id: maintenanceSchedules.id,
        trailerId: maintenanceSchedules.trailerId,
        scheduleType: maintenanceSchedules.scheduleType,
        intervalDays: maintenanceSchedules.intervalDays,
        intervalKm: maintenanceSchedules.intervalKm,
        lastMaintenanceDate: maintenanceSchedules.lastMaintenanceDate,
        lastMaintenanceKm: maintenanceSchedules.lastMaintenanceKm,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        nextMaintenanceKm: maintenanceSchedules.nextMaintenanceKm,
        status: maintenanceSchedules.status,
        notes: maintenanceSchedules.notes,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
      })
      .from(maintenanceSchedules)
      .leftJoin(trailers, eq(maintenanceSchedules.trailerId, trailers.id))
      .where(and(eq(maintenanceSchedules.trailerId, trailerId), eq(trailers.tenantId, tenantId)))
      .orderBy(desc(maintenanceSchedules.createdAt));
    return results as MaintenanceSchedule[];
  }

  async getMaintenanceAlerts(tenantId: string): Promise<MaintenanceSchedule[]> {
    const results = await db
      .select({
        id: maintenanceSchedules.id,
        trailerId: maintenanceSchedules.trailerId,
        scheduleType: maintenanceSchedules.scheduleType,
        intervalDays: maintenanceSchedules.intervalDays,
        intervalKm: maintenanceSchedules.intervalKm,
        lastMaintenanceDate: maintenanceSchedules.lastMaintenanceDate,
        lastMaintenanceKm: maintenanceSchedules.lastMaintenanceKm,
        nextMaintenanceDate: maintenanceSchedules.nextMaintenanceDate,
        nextMaintenanceKm: maintenanceSchedules.nextMaintenanceKm,
        status: maintenanceSchedules.status,
        notes: maintenanceSchedules.notes,
        createdAt: maintenanceSchedules.createdAt,
        updatedAt: maintenanceSchedules.updatedAt,
      })
      .from(maintenanceSchedules)
      .leftJoin(trailers, eq(maintenanceSchedules.trailerId, trailers.id))
      .where(and(eq(maintenanceSchedules.status, "urgent"), eq(trailers.tenantId, tenantId)))
      .orderBy(maintenanceSchedules.nextMaintenanceDate);
    return results as MaintenanceSchedule[];
  }

  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [newSchedule] = await db.insert(maintenanceSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateMaintenanceSchedule(id: string, schedule: Partial<MaintenanceSchedule>, tenantId: string): Promise<MaintenanceSchedule> {
    const [updated] = await db
      .update(maintenanceSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .from(trailers)
      .where(and(eq(maintenanceSchedules.id, id), eq(maintenanceSchedules.trailerId, trailers.id), eq(trailers.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Maintenance schedule not found or access denied");
    return updated;
  }

  async completeMaintenance(id: string, completionDate: Date, tenantId: string, cost?: string, notes?: string): Promise<MaintenanceSchedule> {
    const updateData: any = {
      lastMaintenanceDate: completionDate,
      status: "completed",
      updatedAt: new Date()
    };
    if (cost) {
      updateData.cost = cost;
    }
    if (notes) {
      updateData.notes = notes;
    }
    const [completed] = await db
      .update(maintenanceSchedules)
      .set(updateData)
      .from(trailers)
      .where(and(eq(maintenanceSchedules.id, id), eq(maintenanceSchedules.trailerId, trailers.id), eq(trailers.tenantId, tenantId)))
      .returning();
    if (!completed) throw new Error("Maintenance schedule not found or access denied");
    return completed;
  }

  // Partner Shop operations
  async getPartnerShop(id: string, tenantId: string): Promise<PartnerShop | undefined> {
    const [shop] = await db.select().from(partnerShops).where(and(eq(partnerShops.id, id), eq(partnerShops.tenantId, tenantId)));
    return shop;
  }

  async getAllPartnerShops(tenantId: string): Promise<PartnerShop[]> {
    return await db.select().from(partnerShops).where(eq(partnerShops.tenantId, tenantId)).orderBy(partnerShops.name);
  }

  async createPartnerShop(shop: InsertPartnerShop): Promise<PartnerShop> {
    const [newShop] = await db.insert(partnerShops).values(shop).returning();
    return newShop;
  }

  async updatePartnerShop(id: string, shop: Partial<PartnerShop>, tenantId: string): Promise<PartnerShop> {
    const [updated] = await db
      .update(partnerShops)
      .set({ ...shop, updatedAt: new Date() })
      .where(and(eq(partnerShops.id, id), eq(partnerShops.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Partner shop not found or access denied");
    return updated;
  }

  async deletePartnerShop(id: string, tenantId: string): Promise<void> {
    await db.delete(partnerShops).where(and(eq(partnerShops.id, id), eq(partnerShops.tenantId, tenantId)));
  }

  // Broker Email operations
  async getBrokerEmail(id: string, tenantId: string): Promise<BrokerEmail | undefined> {
    const [email] = await db
      .select()
      .from(brokerEmails)
      .leftJoin(trailers, eq(brokerEmails.trailerId, trailers.id))
      .where(and(eq(brokerEmails.id, id), eq(trailers.tenantId, tenantId)));
    return email ? email.broker_emails : undefined;
  }

  async getBrokerEmailsByTrailerId(trailerId: string, tenantId: string): Promise<BrokerEmail[]> {
    const results = await db
      .select({
        id: brokerEmails.id,
        trailerId: brokerEmails.trailerId,
        brokerEmail: brokerEmails.brokerEmail,
        trailerPlate: brokerEmails.trailerPlate,
        trailerType: brokerEmails.trailerType,
        emailSubject: brokerEmails.emailSubject,
        emailBody: brokerEmails.emailBody,
        sentAt: brokerEmails.sentAt,
        status: brokerEmails.status,
      })
      .from(brokerEmails)
      .leftJoin(trailers, eq(brokerEmails.trailerId, trailers.id))
      .where(and(eq(brokerEmails.trailerId, trailerId), eq(trailers.tenantId, tenantId)))
      .orderBy(desc(brokerEmails.sentAt));
    return results as BrokerEmail[];
  }

  async getAllBrokerEmails(tenantId: string): Promise<BrokerEmail[]> {
    const results = await db
      .select({
        id: brokerEmails.id,
        trailerId: brokerEmails.trailerId,
        brokerEmail: brokerEmails.brokerEmail,
        trailerPlate: brokerEmails.trailerPlate,
        trailerType: brokerEmails.trailerType,
        emailSubject: brokerEmails.emailSubject,
        emailBody: brokerEmails.emailBody,
        sentAt: brokerEmails.sentAt,
        status: brokerEmails.status,
      })
      .from(brokerEmails)
      .leftJoin(trailers, eq(brokerEmails.trailerId, trailers.id))
      .where(eq(trailers.tenantId, tenantId))
      .orderBy(desc(brokerEmails.sentAt));
    return results as BrokerEmail[];
  }

  async createBrokerEmail(email: InsertBrokerEmail): Promise<BrokerEmail> {
    const [newEmail] = await db.insert(brokerEmails).values(email).returning();
    return newEmail;
  }

  async deleteBrokerEmail(id: string, tenantId: string): Promise<void> {
    await db
      .delete(brokerEmails)
      .where(and(
        eq(brokerEmails.id, id),
        sql`${brokerEmails.trailerId} IN (SELECT id FROM ${trailers} WHERE ${trailers.tenantId} = ${tenantId})`
      ));
  }

  // Broker Dispatch operations
  async createBrokerDispatch(data: InsertBrokerDispatch): Promise<BrokerDispatch> {
    const [dispatch] = await db.insert(brokerDispatches).values(data).returning();
    return dispatch;
  }

  async getBrokerDispatchById(id: string, tenantId: string): Promise<BrokerDispatch | null> {
    const [dispatch] = await db.select().from(brokerDispatches).where(and(eq(brokerDispatches.id, id), eq(brokerDispatches.tenantId, tenantId)));
    return dispatch || null;
  }

  async getAllBrokerDispatches(tenantId: string): Promise<BrokerDispatch[]> {
    return await db.select().from(brokerDispatches).where(eq(brokerDispatches.tenantId, tenantId)).orderBy(desc(brokerDispatches.createdAt));
  }

  async updateBrokerDispatch(id: string, data: Partial<InsertBrokerDispatch>, tenantId: string): Promise<BrokerDispatch> {
    const [updated] = await db
      .update(brokerDispatches)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(brokerDispatches.id, id), eq(brokerDispatches.tenantId, tenantId)))
      .returning();
    if (!updated) throw new Error("Broker dispatch not found or access denied");
    return updated;
  }

  async getBrokerDispatchesByTrailer(trailerId: string, tenantId: string): Promise<BrokerDispatch[]> {
    return await db.select().from(brokerDispatches).where(and(eq(brokerDispatches.trailerId, trailerId), eq(brokerDispatches.tenantId, tenantId)));
  }

  // Notification operations
  async getNotifications(userId: string, tenantId: string): Promise<any[]> {
    return await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.tenantId, tenantId)))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationCount(userId: string, tenantId: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId),
          eq(notifications.read, false)
        )
      );
    return result[0]?.count || 0;
  }

  async markNotificationAsRead(notificationId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ 
        read: true,
        readAt: new Date()
      })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId)
        )
      )
      .returning();
    return result.length > 0;
  }

  async deleteNotification(notificationId: string, userId: string, tenantId: string): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, userId),
          eq(notifications.tenantId, tenantId)
        )
      )
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
