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
  uniqueIndex,
  index,
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
  country: text("country").default("US"), // US, BR, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Trailers (Assets) table
export const trailers = pgTable("trailers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: text("trailer_id").notNull().unique(), // TR001, TR002, etc.
  trailerType: text("trailer_type").notNull().default("Seco"), // Seco, Climatizado, Lonado
  model: text("model").notNull().default("Dry Van 53ft"), // Dry Van 53ft, Refrigerado 48ft, etc.
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
  totalShares: integer("total_shares").notNull().default(1), // Total number of shares available for this trailer
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
  referenceMonth: varchar("reference_month", { length: 7 }).notNull(), // "2025-10" format YYYY-MM
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqShareMonth: uniqueIndex("uniq_payments_share_month").on(t.shareId, t.referenceMonth),
  idxUserMonth: index("idx_payments_user_month").on(t.userId, t.referenceMonth),
}));

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
  month: varchar("month", { length: 7 }).notNull().unique(), // "2025-10" format YYYY-MM
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  investorPayouts: decimal("investor_payouts", { precision: 12, scale: 2 }).notNull().default("0"),
  operationalCosts: decimal("operational_costs", { precision: 12, scale: 2 }).notNull().default("0"),
  companyMargin: decimal("company_margin", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

// GPS Devices table
export const gpsDevices = pgTable("gps_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  deviceId: text("device_id").notNull().unique(), // IMEI or unique device identifier
  provider: text("provider").notNull().default("generic"), // geotab, samsara, traccar, generic
  apiKey: text("api_key"), // Encrypted API key/credentials
  status: text("status").notNull().default("inactive"), // online, offline, inactive
  lastPing: timestamp("last_ping"),
  configData: jsonb("config_data"), // Provider-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rental Clients table (Transportation companies)
export const rentalClients = pgTable("rental_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  companyName: text("company_name").notNull(), // Razão Social
  tradeName: text("trade_name"), // Nome Fantasia
  taxId: text("tax_id").notNull().unique(), // CNPJ/EIN
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  country: text("country").notNull().default("US"),
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Rental Contracts table
export const rentalContracts = pgTable("rental_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractNumber: text("contract_number").notNull().unique(), // RC001, RC002, etc.
  clientId: varchar("client_id").notNull().references(() => rentalClients.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }).notNull(), // $1,500/month
  duration: integer("duration").notNull(), // 3, 6, or 12 months
  status: text("status").notNull().default("active"), // active, expired, cancelled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  idxClientId: index("idx_contracts_client").on(t.clientId),
  idxTrailerId: index("idx_contracts_trailer").on(t.trailerId),
  idxStatus: index("idx_contracts_status").on(t.status),
}));

// Invoices table (Commercial invoices for rental)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(), // INV-001, INV-002, etc.
  contractId: varchar("contract_id").notNull().references(() => rentalContracts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  referenceMonth: varchar("reference_month", { length: 7 }).notNull(), // "2025-11" format YYYY-MM
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqContractMonth: uniqueIndex("uniq_invoices_contract_month").on(t.contractId, t.referenceMonth),
  idxStatus: index("idx_invoices_status").on(t.status),
  idxDueDate: index("idx_invoices_due_date").on(t.dueDate),
}));

// Checklists table (Inspections)
export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  type: text("type").notNull(), // pre_rental, maintenance, arrival
  items: jsonb("items").notNull(), // [{item: "Tires", status: "ok", notes: ""}]
  approved: boolean("approved").notNull().default(false),
  inspector: text("inspector").notNull(),
  photos: jsonb("photos"), // Array of photo URLs
  notes: text("notes"),
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  idxTrailerId: index("idx_checklists_trailer").on(t.trailerId),
  idxType: index("idx_checklists_type").on(t.type),
}));

// Maintenance Schedules table
export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  scheduleType: text("schedule_type").notNull(), // time_based, km_based
  intervalDays: integer("interval_days"), // For time-based: every X days
  intervalKm: decimal("interval_km", { precision: 10, scale: 2 }), // For km-based: every X km
  lastMaintenanceDate: date("last_maintenance_date"),
  lastMaintenanceKm: decimal("last_maintenance_km", { precision: 10, scale: 2 }),
  nextMaintenanceDate: date("next_maintenance_date"),
  nextMaintenanceKm: decimal("next_maintenance_km", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("scheduled"), // scheduled, urgent, completed
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  idxTrailerId: index("idx_maintenance_trailer").on(t.trailerId),
  idxStatus: index("idx_maintenance_status").on(t.status),
}));

// Partner Shops table (Maintenance partner workshops)
export const partnerShops = pgTable("partner_shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code"),
  country: text("country").notNull().default("US"),
  phone: text("phone").notNull(),
  email: text("email"),
  specialties: jsonb("specialties"), // ["refrigeration", "tires", "brakes"]
  status: text("status").notNull().default("active"), // active, inactive
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Broker Emails table (Email templates and history)
export const brokerEmails = pgTable("broker_emails", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  brokerEmail: text("broker_email").notNull(),
  trailerPlate: text("trailer_plate").notNull(),
  trailerType: text("trailer_type").notNull(),
  currentLocation: text("current_location").notNull(),
  destination: text("destination").notNull(),
  estimatedDate: date("estimated_date"),
  emailBody: text("email_body").notNull(),
  status: text("status").notNull().default("sent"), // sent, delivered, failed
  sentAt: timestamp("sent_at").defaultNow(),
}, (t) => ({
  idxTrailerId: index("idx_broker_emails_trailer").on(t.trailerId),
  idxStatus: index("idx_broker_emails_status").on(t.status),
}));

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
  gpsDevices: many(gpsDevices),
  rentalContracts: many(rentalContracts),
  checklists: many(checklists),
  maintenanceSchedules: many(maintenanceSchedules),
  brokerEmails: many(brokerEmails),
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

export const gpsDevicesRelations = relations(gpsDevices, ({ one }) => ({
  trailer: one(trailers, {
    fields: [gpsDevices.trailerId],
    references: [trailers.id],
  }),
}));

export const rentalClientsRelations = relations(rentalClients, ({ many }) => ({
  contracts: many(rentalContracts),
}));

export const rentalContractsRelations = relations(rentalContracts, ({ one, many }) => ({
  client: one(rentalClients, {
    fields: [rentalContracts.clientId],
    references: [rentalClients.id],
  }),
  trailer: one(trailers, {
    fields: [rentalContracts.trailerId],
    references: [trailers.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  contract: one(rentalContracts, {
    fields: [invoices.contractId],
    references: [rentalContracts.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one }) => ({
  trailer: one(trailers, {
    fields: [checklists.trailerId],
    references: [trailers.id],
  }),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one }) => ({
  trailer: one(trailers, {
    fields: [maintenanceSchedules.trailerId],
    references: [trailers.id],
  }),
}));

export const brokerEmailsRelations = relations(brokerEmails, ({ one }) => ({
  trailer: one(trailers, {
    fields: [brokerEmails.trailerId],
    references: [trailers.id],
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
  userId: true,
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

export const insertGpsDeviceSchema = createInsertSchema(gpsDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRentalClientSchema = createInsertSchema(rentalClients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRentalContractSchema = createInsertSchema(rentalContracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
});

export const insertChecklistSchema = createInsertSchema(checklists).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartnerShopSchema = createInsertSchema(partnerShops).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBrokerEmailSchema = createInsertSchema(brokerEmails).omit({
  id: true,
  sentAt: true,
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

export type GpsDevice = typeof gpsDevices.$inferSelect;
export type InsertGpsDevice = z.infer<typeof insertGpsDeviceSchema>;

export type RentalClient = typeof rentalClients.$inferSelect;
export type InsertRentalClient = z.infer<typeof insertRentalClientSchema>;

export type RentalContract = typeof rentalContracts.$inferSelect;
export type InsertRentalContract = z.infer<typeof insertRentalContractSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;

export type PartnerShop = typeof partnerShops.$inferSelect;
export type InsertPartnerShop = z.infer<typeof insertPartnerShopSchema>;

export type BrokerEmail = typeof brokerEmails.$inferSelect;
export type InsertBrokerEmail = z.infer<typeof insertBrokerEmailSchema>;
