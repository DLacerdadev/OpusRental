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
  checklists,
  maintenanceSchedules,
  partnerShops,
  brokerEmails,
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
  type Checklist,
  type InsertChecklist,
  type MaintenanceSchedule,
  type InsertMaintenanceSchedule,
  type PartnerShop,
  type InsertPartnerShop,
  type BrokerEmail,
  type InsertBrokerEmail,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllInvestors(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Trailer operations
  getTrailer(id: string): Promise<Trailer | undefined>;
  getTrailerByTrailerId(trailerId: string): Promise<Trailer | undefined>;
  getAllTrailers(): Promise<Trailer[]>;
  getAvailableTrailers(): Promise<Trailer[]>;
  createTrailer(trailer: InsertTrailer): Promise<Trailer>;
  updateTrailer(id: string, trailer: Partial<Trailer>): Promise<Trailer>;
  
  // Share operations
  getShare(id: string): Promise<Share | undefined>;
  getSharesByUserId(userId: string): Promise<Share[]>;
  getSharesByTrailerId(trailerId: string): Promise<Share[]>;
  getAllShares(): Promise<Share[]>;
  getAllSharesWithDetails(): Promise<any[]>;
  createShare(share: InsertShare): Promise<Share>;
  updateShare(id: string, share: Partial<Share>): Promise<Share>;
  
  // Payment operations
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentsByShareId(shareId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Tracking operations
  getLatestTrackingByTrailerId(trailerId: string): Promise<TrackingData | undefined>;
  getTrackingHistory(trailerId: string, limit?: number): Promise<TrackingData[]>;
  getAllLatestTracking(): Promise<TrackingData[]>;
  createTrackingData(data: InsertTrackingData): Promise<TrackingData>;
  
  // Document operations
  getDocumentsByUserId(userId: string): Promise<Document[]>;
  getDocumentsByShareId(shareId: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  
  // Audit log operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getRecentAuditLogs(limit?: number): Promise<AuditLog[]>;
  
  // Financial operations
  getFinancialRecordByMonth(month: string): Promise<FinancialRecord | undefined>;
  getAllFinancialRecords(): Promise<FinancialRecord[]>;
  createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord>;
  
  // Dashboard data
  getDashboardStats(userId: string): Promise<any>;
  getPortfolioData(userId: string): Promise<any>;
  
  // GPS Device operations
  getGpsDevice(id: string): Promise<GpsDevice | undefined>;
  getGpsDeviceByTrailerId(trailerId: string): Promise<GpsDevice | undefined>;
  getAllGpsDevices(): Promise<GpsDevice[]>;
  createGpsDevice(device: InsertGpsDevice): Promise<GpsDevice>;
  updateGpsDevice(id: string, device: Partial<GpsDevice>): Promise<GpsDevice>;
  deleteGpsDevice(id: string): Promise<void>;
  
  // Rental Client operations
  getRentalClient(id: string): Promise<RentalClient | undefined>;
  getAllRentalClients(): Promise<RentalClient[]>;
  createRentalClient(client: InsertRentalClient): Promise<RentalClient>;
  updateRentalClient(id: string, client: Partial<RentalClient>): Promise<RentalClient>;
  deleteRentalClient(id: string): Promise<void>;
  
  // Rental Contract operations
  getRentalContract(id: string): Promise<RentalContract | undefined>;
  getAllRentalContracts(): Promise<any[]>;
  getContractsByClientId(clientId: string): Promise<RentalContract[]>;
  getContractsByTrailerId(trailerId: string): Promise<RentalContract[]>;
  createRentalContract(contract: InsertRentalContract): Promise<RentalContract>;
  updateRentalContract(id: string, contract: Partial<RentalContract>): Promise<RentalContract>;
  terminateContract(id: string): Promise<RentalContract>;
  
  // Invoice operations
  getInvoice(id: string): Promise<Invoice | undefined>;
  getAllInvoices(): Promise<any[]>;
  getInvoicesByContractId(contractId: string): Promise<Invoice[]>;
  getOverdueInvoices(): Promise<any[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoiceStatus(id: string, status: string, paidDate?: Date): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;
  
  // Checklist operations
  getChecklist(id: string): Promise<Checklist | undefined>;
  getChecklistsByTrailerId(trailerId: string): Promise<Checklist[]>;
  getChecklistsByType(type: string): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist): Promise<Checklist>;
  updateChecklist(id: string, checklist: Partial<Checklist>): Promise<Checklist>;
  completeChecklist(id: string, approved: boolean, notes?: string): Promise<Checklist>;
  
  // Maintenance Schedule operations
  getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined>;
  getMaintenanceSchedulesByTrailerId(trailerId: string): Promise<MaintenanceSchedule[]>;
  getMaintenanceAlerts(): Promise<MaintenanceSchedule[]>;
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  updateMaintenanceSchedule(id: string, schedule: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule>;
  completeMaintenance(id: string, completionDate: Date, cost?: string, notes?: string): Promise<MaintenanceSchedule>;
  
  // Partner Shop operations
  getPartnerShop(id: string): Promise<PartnerShop | undefined>;
  getAllPartnerShops(): Promise<PartnerShop[]>;
  createPartnerShop(shop: InsertPartnerShop): Promise<PartnerShop>;
  updatePartnerShop(id: string, shop: Partial<PartnerShop>): Promise<PartnerShop>;
  deletePartnerShop(id: string): Promise<void>;
  
  // Broker Email operations
  getBrokerEmail(id: string): Promise<BrokerEmail | undefined>;
  getBrokerEmailsByTrailerId(trailerId: string): Promise<BrokerEmail[]>;
  getAllBrokerEmails(): Promise<BrokerEmail[]>;
  createBrokerEmail(email: InsertBrokerEmail): Promise<BrokerEmail>;
  deleteBrokerEmail(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllInvestors(): Promise<User[]> {
    const investors = await db.select().from(users).where(eq(users.role, "investor"));
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
  async getTrailer(id: string): Promise<Trailer | undefined> {
    const [trailer] = await db.select().from(trailers).where(eq(trailers.id, id));
    return trailer;
  }

  async getTrailerByTrailerId(trailerId: string): Promise<Trailer | undefined> {
    const [trailer] = await db.select().from(trailers).where(eq(trailers.trailerId, trailerId));
    return trailer;
  }

  async getAllTrailers(): Promise<any[]> {
    const allTrailers = await db.select().from(trailers).orderBy(desc(trailers.createdAt));
    
    // For each trailer, count sold shares
    const trailersWithShareInfo = await Promise.all(
      allTrailers.map(async (trailer) => {
        const soldShares = await db
          .select()
          .from(shares)
          .where(eq(shares.trailerId, trailer.id));
        
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

  async getAvailableTrailers(): Promise<any[]> {
    // Get all trailers except expired ones
    const availableTrailers = await db
      .select()
      .from(trailers)
      .orderBy(desc(trailers.createdAt));
    
    // For each trailer, count sold shares and calculate available shares
    const trailersWithAvailability = await Promise.all(
      availableTrailers.map(async (trailer) => {
        const soldShares = await db
          .select()
          .from(shares)
          .where(eq(shares.trailerId, trailer.id));
        
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

  async updateTrailer(id: string, trailer: Partial<Trailer>): Promise<Trailer> {
    const [updated] = await db
      .update(trailers)
      .set({ ...trailer, updatedAt: new Date() })
      .where(eq(trailers.id, id))
      .returning();
    return updated;
  }

  // Share operations
  async getShare(id: string): Promise<Share | undefined> {
    const [share] = await db.select().from(shares).where(eq(shares.id, id));
    return share;
  }

  async getSharesByUserId(userId: string): Promise<Share[]> {
    return await db.select().from(shares).where(eq(shares.userId, userId));
  }

  async getSharesByTrailerId(trailerId: string): Promise<Share[]> {
    return await db.select().from(shares).where(eq(shares.trailerId, trailerId));
  }

  async getAllShares(): Promise<Share[]> {
    return await db.select().from(shares).orderBy(desc(shares.createdAt));
  }

  async getAllSharesWithDetails(): Promise<any[]> {
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
      .orderBy(desc(shares.createdAt));
    
    return result;
  }

  async createShare(share: InsertShare): Promise<Share> {
    const [newShare] = await db.insert(shares).values(share).returning();
    return newShare;
  }

  async updateShare(id: string, share: Partial<Share>): Promise<Share> {
    const [updated] = await db
      .update(shares)
      .set({ ...share, updatedAt: new Date() })
      .where(eq(shares.id, id))
      .returning();
    return updated;
  }

  // Payment operations
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    return payment;
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.paymentDate));
  }

  async getPaymentsByShareId(shareId: string): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.shareId, shareId))
      .orderBy(desc(payments.paymentDate));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db.insert(payments).values(payment).returning();
    return newPayment;
  }

  // Tracking operations
  async getLatestTrackingByTrailerId(trailerId: string): Promise<TrackingData | undefined> {
    const [tracking] = await db
      .select()
      .from(trackingData)
      .where(eq(trackingData.trailerId, trailerId))
      .orderBy(desc(trackingData.timestamp))
      .limit(1);
    return tracking;
  }

  async getTrackingHistory(trailerId: string, limit: number = 50): Promise<TrackingData[]> {
    return await db
      .select()
      .from(trackingData)
      .where(eq(trackingData.trailerId, trailerId))
      .orderBy(desc(trackingData.timestamp))
      .limit(limit);
  }

  async getAllLatestTracking(): Promise<TrackingData[]> {
    const latestTracking = await db
      .select()
      .from(trackingData)
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
  async getDocumentsByUserId(userId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(desc(documents.uploadedAt));
  }

  async getDocumentsByShareId(shareId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.shareId, shareId))
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

  async getRecentAuditLogs(limit: number = 100): Promise<AuditLog[]> {
    return await db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.timestamp))
      .limit(limit);
  }

  // Financial operations
  async getFinancialRecordByMonth(month: string): Promise<FinancialRecord | undefined> {
    const [record] = await db
      .select()
      .from(financialRecords)
      .where(eq(financialRecords.month, month));
    return record;
  }

  async getAllFinancialRecords(): Promise<FinancialRecord[]> {
    return await db
      .select()
      .from(financialRecords)
      .orderBy(desc(financialRecords.createdAt));
  }

  async createFinancialRecord(record: InsertFinancialRecord): Promise<FinancialRecord> {
    const [newRecord] = await db.insert(financialRecords).values(record).returning();
    return newRecord;
  }

  // Dashboard data
  async getDashboardStats(userId: string): Promise<any> {
    const userShares = await this.getSharesByUserId(userId);
    const userPayments = await this.getPaymentsByUserId(userId);
    
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
  async getCompanyStats(): Promise<any> {
    const allTrailers = await this.getAllTrailers();
    const allShares = await db.select().from(shares);
    const allPayments = await db.select().from(payments);
    const recentRecords = await db
      .select()
      .from(financialRecords)
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

  async getPortfolioData(userId: string): Promise<any> {
    const userShares = await this.getSharesByUserId(userId);
    const userPayments = await this.getPaymentsByUserId(userId);
    
    const sharesWithTrailers = await Promise.all(
      userShares.map(async (share) => {
        const trailer = await this.getTrailer(share.trailerId);
        return { ...share, trailer };
      })
    );

    return {
      shares: sharesWithTrailers,
      payments: userPayments,
    };
  }

  // GPS Device operations
  async getGpsDevice(id: string): Promise<GpsDevice | undefined> {
    const [device] = await db.select().from(gpsDevices).where(eq(gpsDevices.id, id));
    return device;
  }

  async getGpsDeviceByTrailerId(trailerId: string): Promise<GpsDevice | undefined> {
    const [device] = await db.select().from(gpsDevices).where(eq(gpsDevices.trailerId, trailerId));
    return device;
  }

  async getAllGpsDevices(): Promise<GpsDevice[]> {
    return await db.select().from(gpsDevices).orderBy(desc(gpsDevices.createdAt));
  }

  async createGpsDevice(device: InsertGpsDevice): Promise<GpsDevice> {
    const [newDevice] = await db.insert(gpsDevices).values(device).returning();
    return newDevice;
  }

  async updateGpsDevice(id: string, device: Partial<GpsDevice>): Promise<GpsDevice> {
    const [updated] = await db
      .update(gpsDevices)
      .set({ ...device, updatedAt: new Date() })
      .where(eq(gpsDevices.id, id))
      .returning();
    return updated;
  }

  async deleteGpsDevice(id: string): Promise<void> {
    await db.delete(gpsDevices).where(eq(gpsDevices.id, id));
  }

  // Rental Client operations
  async getRentalClient(id: string): Promise<RentalClient | undefined> {
    const [client] = await db.select().from(rentalClients).where(eq(rentalClients.id, id));
    return client;
  }

  async getAllRentalClients(): Promise<RentalClient[]> {
    return await db.select().from(rentalClients).orderBy(desc(rentalClients.createdAt));
  }

  async createRentalClient(client: InsertRentalClient): Promise<RentalClient> {
    const [newClient] = await db.insert(rentalClients).values(client).returning();
    return newClient;
  }

  async updateRentalClient(id: string, client: Partial<RentalClient>): Promise<RentalClient> {
    const [updated] = await db
      .update(rentalClients)
      .set({ ...client, updatedAt: new Date() })
      .where(eq(rentalClients.id, id))
      .returning();
    return updated;
  }

  async deleteRentalClient(id: string): Promise<void> {
    await db.delete(rentalClients).where(eq(rentalClients.id, id));
  }

  // Rental Contract operations
  async getRentalContract(id: string): Promise<RentalContract | undefined> {
    const [contract] = await db.select().from(rentalContracts).where(eq(rentalContracts.id, id));
    return contract;
  }

  async getAllRentalContracts(): Promise<any[]> {
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
      .orderBy(desc(rentalContracts.createdAt));
    
    return contracts;
  }

  async getContractsByClientId(clientId: string): Promise<RentalContract[]> {
    return await db
      .select()
      .from(rentalContracts)
      .where(eq(rentalContracts.clientId, clientId))
      .orderBy(desc(rentalContracts.createdAt));
  }

  async getContractsByTrailerId(trailerId: string): Promise<RentalContract[]> {
    return await db
      .select()
      .from(rentalContracts)
      .where(eq(rentalContracts.trailerId, trailerId))
      .orderBy(desc(rentalContracts.createdAt));
  }

  async createRentalContract(contract: InsertRentalContract): Promise<RentalContract> {
    const [newContract] = await db.insert(rentalContracts).values(contract).returning();
    return newContract;
  }

  async updateRentalContract(id: string, contract: Partial<RentalContract>): Promise<RentalContract> {
    const [updated] = await db
      .update(rentalContracts)
      .set({ ...contract, updatedAt: new Date() })
      .where(eq(rentalContracts.id, id))
      .returning();
    return updated;
  }

  async terminateContract(id: string): Promise<RentalContract> {
    const contract = await this.getRentalContract(id);
    if (!contract) {
      throw new Error("Contract not found");
    }

    const [terminated] = await db
      .update(rentalContracts)
      .set({ status: "terminated", updatedAt: new Date() })
      .where(eq(rentalContracts.id, id))
      .returning();

    if (contract.trailerId) {
      await this.updateTrailer(contract.trailerId, { status: "stock" });
    }

    return terminated;
  }

  // Invoice operations
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async getAllInvoices(): Promise<any[]> {
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
      .orderBy(desc(invoices.createdAt));
    
    return allInvoices;
  }

  async getInvoicesByContractId(contractId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.contractId, contractId))
      .orderBy(desc(invoices.dueDate));
  }

  async getOverdueInvoices(): Promise<any[]> {
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
      .where(eq(invoices.status, "overdue"))
      .orderBy(invoices.dueDate);
    
    return overdueInvoices;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoiceStatus(id: string, status: string, paidDate?: Date): Promise<Invoice> {
    const updateData: any = { status };
    if (paidDate) {
      updateData.paidDate = paidDate;
    }
    const [updated] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  async deleteInvoice(id: string): Promise<void> {
    await db.delete(invoices).where(eq(invoices.id, id));
  }

  // Checklist operations
  async getChecklist(id: string): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(eq(checklists.id, id));
    return checklist;
  }

  async getChecklistsByTrailerId(trailerId: string): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(eq(checklists.trailerId, trailerId))
      .orderBy(desc(checklists.inspectionDate));
  }

  async getChecklistsByType(type: string): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(eq(checklists.type, type))
      .orderBy(desc(checklists.inspectionDate));
  }

  async createChecklist(checklist: InsertChecklist): Promise<Checklist> {
    const [newChecklist] = await db.insert(checklists).values(checklist).returning();
    return newChecklist;
  }

  async updateChecklist(id: string, checklist: Partial<Checklist>): Promise<Checklist> {
    const [updated] = await db
      .update(checklists)
      .set(checklist)
      .where(eq(checklists.id, id))
      .returning();
    return updated;
  }

  async completeChecklist(id: string, approved: boolean, notes?: string): Promise<Checklist> {
    const updateData: any = { 
      approved,
      completedAt: new Date()
    };
    if (notes) {
      updateData.notes = notes;
    }
    const [completed] = await db
      .update(checklists)
      .set(updateData)
      .where(eq(checklists.id, id))
      .returning();
    return completed;
  }

  // Maintenance Schedule operations
  async getMaintenanceSchedule(id: string): Promise<MaintenanceSchedule | undefined> {
    const [schedule] = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.id, id));
    return schedule;
  }

  async getMaintenanceSchedulesByTrailerId(trailerId: string): Promise<MaintenanceSchedule[]> {
    return await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.trailerId, trailerId))
      .orderBy(desc(maintenanceSchedules.createdAt));
  }

  async getMaintenanceAlerts(): Promise<MaintenanceSchedule[]> {
    return await db
      .select()
      .from(maintenanceSchedules)
      .where(eq(maintenanceSchedules.status, "urgent"))
      .orderBy(maintenanceSchedules.nextMaintenanceDate);
  }

  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [newSchedule] = await db.insert(maintenanceSchedules).values(schedule).returning();
    return newSchedule;
  }

  async updateMaintenanceSchedule(id: string, schedule: Partial<MaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const [updated] = await db
      .update(maintenanceSchedules)
      .set({ ...schedule, updatedAt: new Date() })
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return updated;
  }

  async completeMaintenance(id: string, completionDate: Date, cost?: string, notes?: string): Promise<MaintenanceSchedule> {
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
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return completed;
  }

  // Partner Shop operations
  async getPartnerShop(id: string): Promise<PartnerShop | undefined> {
    const [shop] = await db.select().from(partnerShops).where(eq(partnerShops.id, id));
    return shop;
  }

  async getAllPartnerShops(): Promise<PartnerShop[]> {
    return await db.select().from(partnerShops).orderBy(partnerShops.name);
  }

  async createPartnerShop(shop: InsertPartnerShop): Promise<PartnerShop> {
    const [newShop] = await db.insert(partnerShops).values(shop).returning();
    return newShop;
  }

  async updatePartnerShop(id: string, shop: Partial<PartnerShop>): Promise<PartnerShop> {
    const [updated] = await db
      .update(partnerShops)
      .set({ ...shop, updatedAt: new Date() })
      .where(eq(partnerShops.id, id))
      .returning();
    return updated;
  }

  async deletePartnerShop(id: string): Promise<void> {
    await db.delete(partnerShops).where(eq(partnerShops.id, id));
  }

  // Broker Email operations
  async getBrokerEmail(id: string): Promise<BrokerEmail | undefined> {
    const [email] = await db.select().from(brokerEmails).where(eq(brokerEmails.id, id));
    return email;
  }

  async getBrokerEmailsByTrailerId(trailerId: string): Promise<BrokerEmail[]> {
    return await db
      .select()
      .from(brokerEmails)
      .where(eq(brokerEmails.trailerId, trailerId))
      .orderBy(desc(brokerEmails.sentAt));
  }

  async getAllBrokerEmails(): Promise<BrokerEmail[]> {
    return await db.select().from(brokerEmails).orderBy(desc(brokerEmails.sentAt));
  }

  async createBrokerEmail(email: InsertBrokerEmail): Promise<BrokerEmail> {
    const [newEmail] = await db.insert(brokerEmails).values(email).returning();
    return newEmail;
  }

  async deleteBrokerEmail(id: string): Promise<void> {
    await db.delete(brokerEmails).where(eq(brokerEmails.id, id));
  }
}

export const storage = new DatabaseStorage();
