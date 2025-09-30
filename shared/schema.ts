import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  integer,
  date,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("investor"), // investor, manager, admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trailers (Assets) table
export const trailers = pgTable("trailers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: text("trailer_id").notNull().unique(), // TR001, TR002, etc.
  purchaseValue: decimal("purchase_value", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  status: text("status").notNull().default("stock"), // stock, active, maintenance, expired
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }).notNull().default("0.05"),
  expirationDate: date("expiration_date"),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  lastActivity: timestamp("last_activity"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Shares (Cotas) table
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  purchaseValue: decimal("purchase_value", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  status: text("status").notNull().default("active"), // active, inactive
  monthlyReturn: decimal("monthly_return", { precision: 5, scale: 2 }).notNull().default("2.00"), // 2%
  totalReturns: decimal("total_returns", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareId: varchar("share_id").notNull().references(() => shares.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  status: text("status").notNull().default("paid"), // paid, pending, failed
  referenceMonth: text("reference_month").notNull(), // "January/2024"
  createdAt: timestamp("created_at").defaultNow(),
});

// Tracking data table
export const trackingData = pgTable("tracking_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  location: text("location"),
  status: text("status").notNull().default("moving"), // moving, stopped, maintenance
  distanceToday: decimal("distance_today", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  shareId: varchar("share_id").references(() => shares.id),
  documentType: text("document_type").notNull(), // contract, kyc, compliance, etc.
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("verified"), // verified, pending, rejected
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // user, share, payment, document, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Financial records table
export const financialRecords = pgTable("financial_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  month: text("month").notNull(), // "January/2024"
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).notNull(),
  investorPayouts: decimal("investor_payouts", { precision: 10, scale: 2 }).notNull(),
  operationalCosts: decimal("operational_costs", { precision: 10, scale: 2 }).notNull(),
  companyMargin: decimal("company_margin", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  shares: many(shares),
  payments: many(payments),
  documents: many(documents),
  auditLogs: many(auditLogs),
}));

export const trailersRelations = relations(trailers, ({ many }) => ({
  shares: many(shares),
  trackingData: many(trackingData),
}));

export const sharesRelations = relations(shares, ({ one, many }) => ({
  user: one(users, {
    fields: [shares.userId],
    references: [users.id],
  }),
  trailer: one(trailers, {
    fields: [shares.trailerId],
    references: [trailers.id],
  }),
  payments: many(payments),
  documents: many(documents),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  share: one(shares, {
    fields: [payments.shareId],
    references: [shares.id],
  }),
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const trackingDataRelations = relations(trackingData, ({ one }) => ({
  trailer: one(trailers, {
    fields: [trackingData.trailerId],
    references: [trailers.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  share: one(shares, {
    fields: [documents.shareId],
    references: [shares.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrailerSchema = createInsertSchema(trailers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShareSchema = createInsertSchema(shares).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertTrackingDataSchema = createInsertSchema(trackingData).omit({
  id: true,
  timestamp: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  timestamp: true,
});

export const insertFinancialRecordSchema = createInsertSchema(financialRecords).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trailer = typeof trailers.$inferSelect;
export type InsertTrailer = z.infer<typeof insertTrailerSchema>;

export type Share = typeof shares.$inferSelect;
export type InsertShare = z.infer<typeof insertShareSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type TrackingData = typeof trackingData.$inferSelect;
export type InsertTrackingData = z.infer<typeof insertTrackingDataSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type FinancialRecord = typeof financialRecords.$inferSelect;
export type InsertFinancialRecord = z.infer<typeof insertFinancialRecordSchema>;
