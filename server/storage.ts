import {
  users,
  trailers,
  shares,
  payments,
  trackingData,
  documents,
  auditLogs,
  financialRecords,
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
}

export const storage = new DatabaseStorage();
