import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
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
  check,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tenants table - Multi-tenancy support
export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Company name
  slug: text("slug").notNull().unique(), // URL-friendly identifier (e.g., "opus-rental")
  domain: text("domain"), // Custom domain (e.g., "app.opusrental.com")
  
  // White-label customization
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").default("#2563eb"), // Tailwind blue-600
  secondaryColor: text("secondary_color").default("#3b82f6"), // Tailwind blue-500
  accentColor: text("accent_color").default("#1d4ed8"), // Tailwind blue-700
  
  // Billing configuration
  subscriptionPlan: text("subscription_plan").notNull().default("basic"), // basic, professional, enterprise
  billingEmail: text("billing_email"),
  maxUsers: integer("max_users").default(10),
  maxTrailers: integer("max_trailers").default(50),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),

  // Per-tenant payment method configuration (Template 3)
  pixKey: text("pix_key"),
  pixBeneficiary: text("pix_beneficiary"),
  bankName: text("bank_name"),
  bankAgency: text("bank_agency"),
  bankAccount: text("bank_account"),
  bankAccountHolder: text("bank_account_holder"),
  bankAccountType: text("bank_account_type"), // "checking" | "savings"
  
  // Status
  status: text("status").notNull().default("active"), // active, suspended, cancelled
  trialEndsAt: timestamp("trial_ends_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  username: text("username").notNull(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  role: text("role").notNull().default("investor"), // investor, manager, admin
  country: text("country").default("US"), // US, BR, MX, etc.
  phone: text("phone"), // Phone number with country code
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqTenantUsername: uniqueIndex("uniq_tenant_username").on(t.tenantId, t.username),
  uniqTenantEmail: uniqueIndex("uniq_tenant_email").on(t.tenantId, t.email),
}));

// Trailers (Assets) table
export const trailers = pgTable("trailers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  trailerId: text("trailer_id").notNull(), // TR001, TR002, etc.
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
  // Vehicle identification (all optional — backfilled when known)
  vin: text("vin"),
  year: integer("year"),
  make: text("make"),
  body: text("body"),
  weightLbs: integer("weight_lbs"),
  titleNumber: text("title_number"),
  vehicleUse: text("vehicle_use"), // PRIVATE, COMMERCIAL
  titleDate: date("title_date"),
  imageData: text("image_data"), // URL/object path to vehicle image (no base64)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqTenantTrailerId: uniqueIndex("uniq_tenant_trailer_id").on(t.tenantId, t.trailerId),
}));

// Trailer Documents table — file attachments per trailer, by category
export const trailerDocuments = pgTable("trailer_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id, { onDelete: "cascade" }),
  documentCategory: text("document_category").notNull(), // title, registration, insurance, inspection, purchase_invoice, other
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // Object storage path (e.g. /objects/uploads/<uuid>)
  sortOrder: integer("sort_order").notNull().default(0),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
}, (t) => ({
  idxTenant: index("idx_trailer_documents_tenant").on(t.tenantId),
  idxTrailerId: index("idx_trailer_documents_trailer").on(t.trailerId),
}));

// Shares (Cotas) table
export const shares = pgTable("shares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  purchaseValue: decimal("purchase_value", { precision: 10, scale: 2 }).notNull(),
  purchaseDate: date("purchase_date").notNull(),
  status: text("status").notNull().default("active"), // active, inactive
  monthlyReturn: decimal("monthly_return", { precision: 5, scale: 2 }).notNull().default("2.00"), // 2%
  totalReturns: decimal("total_returns", { precision: 10, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_shares_tenant").on(t.tenantId),
  idxUser: index("idx_shares_user").on(t.userId),
  idxTrailer: index("idx_shares_trailer").on(t.trailerId),
}));

// Payments table
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
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
  idxTenant: index("idx_payments_tenant").on(t.tenantId),
}));

// Tracking data table
export const trackingData = pgTable("tracking_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  speed: decimal("speed", { precision: 5, scale: 2 }),
  location: text("location"),
  status: text("status").notNull().default("moving"), // moving, stopped, maintenance
  distanceToday: decimal("distance_today", { precision: 10, scale: 2 }),
  timestamp: timestamp("timestamp").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_tracking_tenant").on(t.tenantId),
  idxTrailerId: index("idx_tracking_trailer").on(t.trailerId),
}));

// Documents table
export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  shareId: varchar("share_id").references(() => shares.id),
  documentType: text("document_type").notNull(), // contract, kyc, compliance, etc.
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  status: text("status").notNull().default("verified"), // verified, pending, rejected
  uploadedAt: timestamp("uploaded_at").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_documents_tenant").on(t.tenantId),
  idxUser: index("idx_documents_user").on(t.userId),
}));

// Audit logs table
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(), // user, share, payment, document, etc.
  entityId: varchar("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_audit_logs_tenant").on(t.tenantId),
}));

// Financial records table
export const financialRecords = pgTable("financial_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  month: varchar("month", { length: 7 }).notNull(), // "2025-10" format YYYY-MM
  totalRevenue: decimal("total_revenue", { precision: 12, scale: 2 }).notNull().default("0"),
  investorPayouts: decimal("investor_payouts", { precision: 12, scale: 2 }).notNull().default("0"),
  operationalCosts: decimal("operational_costs", { precision: 12, scale: 2 }).notNull().default("0"),
  companyMargin: decimal("company_margin", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqTenantMonth: uniqueIndex("uniq_tenant_month").on(t.tenantId, t.month),
}));

// GPS Devices table
export const gpsDevices = pgTable("gps_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  deviceId: text("device_id").notNull(), // IMEI or unique device identifier
  provider: text("provider").notNull().default("generic"), // geotab, samsara, traccar, generic
  apiKey: text("api_key"), // Encrypted API key/credentials
  status: text("status").notNull().default("inactive"), // online, offline, inactive
  lastPing: timestamp("last_ping"),
  configData: jsonb("config_data"), // Provider-specific configuration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqTenantDeviceId: uniqueIndex("uniq_tenant_device_id").on(t.tenantId, t.deviceId),
}));

// Rental Clients table (Transportation companies)
export const rentalClients = pgTable("rental_clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  companyName: text("company_name").notNull(), // Razão Social
  tradeName: text("trade_name"), // Nome Fantasia
  taxId: text("tax_id").notNull(), // CNPJ/EIN
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
}, (t) => ({
  uniqTenantTaxId: uniqueIndex("uniq_tenant_tax_id").on(t.tenantId, t.taxId),
}));

// Rental Contracts table
export const rentalContracts = pgTable("rental_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  contractNumber: text("contract_number").notNull(), // RC001, RC002, etc.
  clientId: varchar("client_id").notNull().references(() => rentalClients.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  monthlyRate: decimal("monthly_rate", { precision: 10, scale: 2 }).notNull(), // $1,500/month
  duration: integer("duration").notNull(), // 3, 6, or 12 months
  status: text("status").notNull().default("active"), // active, expired, cancelled
  autoGenerateInvoices: boolean("auto_generate_invoices").notNull().default(true), // Auto-generate monthly invoices
  invoiceDayOfMonth: integer("invoice_day_of_month").notNull().default(1), // Day of month to generate invoice (1-28)
  paymentDueDays: integer("payment_due_days").notNull().default(15), // Days after invoice generation until due
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqTenantContractNumber: uniqueIndex("uniq_tenant_contract_number").on(t.tenantId, t.contractNumber),
  idxClientId: index("idx_contracts_client").on(t.clientId),
  idxTrailerId: index("idx_contracts_trailer").on(t.trailerId),
  idxStatus: index("idx_contracts_status").on(t.status),
}));

// Invoices table (Commercial invoices for rental)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  // Per-tenant invoice number (e.g. INV-000001). Uniqueness is enforced at
  // the (tenant_id, invoice_number) level so each tenant can have its own
  // independent sequence without colliding with other tenants.
  invoiceNumber: text("invoice_number").notNull(),
  contractId: varchar("contract_id").notNull().references(() => rentalContracts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled, reissued
  referenceMonth: varchar("reference_month", { length: 7 }).notNull(), // "2025-11" format YYYY-MM
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  uniqContractMonth: uniqueIndex("uniq_invoices_contract_month").on(t.contractId, t.referenceMonth),
  uniqTenantInvoiceNumber: uniqueIndex("uniq_invoices_tenant_invoice_number").on(t.tenantId, t.invoiceNumber),
  idxTenant: index("idx_invoices_tenant").on(t.tenantId),
  idxStatus: index("idx_invoices_status").on(t.status),
  idxDueDate: index("idx_invoices_due_date").on(t.dueDate),
  statusCheck: check("invoices_status_check", sql`${t.status} IN ('pending', 'paid', 'overdue', 'cancelled', 'reissued')`),
}));

// Invoice Line Items (per-row breakdown of an invoice — one trailer, add-on,
// insurance pass-through, etc.). When an invoice has rows here, the PDF and
// the Preview dialog render those rows; otherwise the legacy single-row
// "Locação Mensal" line is synthesized from the contract — this keeps every
// existing invoice rendering identically.
export const invoiceItems = pgTable("invoice_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  invoiceId: varchar("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull().default("1"),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  idxInvoiceId: index("idx_invoice_items_invoice").on(t.invoiceId),
  idxTenant: index("idx_invoice_items_tenant").on(t.tenantId),
}));

// Email Settings table (Global email configuration)
export const emailSettings = pgTable("email_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(), // smtp_host, smtp_port, smtp_user, from_email, etc.
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email Logs table (Track all emails sent)
export const emailLogs = pgTable("email_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  emailType: text("email_type").notNull(), // invoice, payment_reminder, overdue_notice, etc.
  entityType: text("entity_type"), // invoice, payment, etc.
  entityId: varchar("entity_id"), // Reference to invoice ID, payment ID, etc.
  status: text("status").notNull().default("sent"), // sent, failed, bounced
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_email_logs_tenant").on(t.tenantId),
  idxRecipient: index("idx_email_logs_recipient").on(t.recipientEmail),
  idxType: index("idx_email_logs_type").on(t.emailType),
  idxEntity: index("idx_email_logs_entity").on(t.entityType, t.entityId),
}));

// WhatsApp enums
export const whatsappEventEnum = pgEnum("whatsapp_event", [
  "payment_generated",
  "invoice_issued",
  "invoice_overdue",
  "maintenance_due",
  "geofence_alert",
]);

export const whatsappStatusEnum = pgEnum("whatsapp_status", [
  "sent",
  "failed",
  "retrying",
]);

export const whatsappProviderEnum = pgEnum("whatsapp_provider", [
  "twilio",
  "meta",
  "mock",
]);

// WhatsApp Logs table (Track all WhatsApp messages sent)
export const whatsappLogs = pgTable("whatsapp_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  event: whatsappEventEnum("event").notNull(),
  recipientPhone: text("recipient_phone").notNull(),
  recipientName: text("recipient_name"),
  status: whatsappStatusEnum("status").notNull().default("sent"),
  provider: whatsappProviderEnum("provider").notNull().default("mock"),
  messageId: text("message_id"),
  retries: integer("retries").notNull().default(0),
  error: text("error"),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  idxWhatsappTenant: index("idx_whatsapp_logs_tenant").on(t.tenantId),
  idxWhatsappEvent: index("idx_whatsapp_logs_event").on(t.event),
  idxWhatsappStatus: index("idx_whatsapp_logs_status").on(t.status),
}));

// Checklists table (Inspections)
export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  type: text("type").notNull(), // pre_rental, maintenance, arrival
  items: jsonb("items").notNull(), // [{item: "Tires", status: "ok", notes: ""}]
  approved: boolean("approved").notNull().default(false),
  rejected: boolean("rejected").notNull().default(false),
  rejectionReason: text("rejection_reason"),
  inspector: text("inspector").notNull(),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  photos: jsonb("photos"), // Array of photo URLs
  notes: text("notes"),
  inspectionDate: timestamp("inspection_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => ({
  idxTenant: index("idx_checklists_tenant").on(t.tenantId),
  idxTrailerId: index("idx_checklists_trailer").on(t.trailerId),
  idxType: index("idx_checklists_type").on(t.type),
  idxApproved: index("idx_checklists_approved").on(t.approved),
}));

// Maintenance Schedules table
export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
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
  idxTenant: index("idx_maintenance_tenant").on(t.tenantId),
  idxTrailerId: index("idx_maintenance_trailer").on(t.trailerId),
  idxStatus: index("idx_maintenance_status").on(t.status),
}));

// Partner Shops table (Maintenance partner workshops)
export const partnerShops = pgTable("partner_shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
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
}, (t) => ({
  idxTenant: index("idx_partner_shops_tenant").on(t.tenantId),
}));

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

// Broker Dispatches table (Trailer dispatch to brokers)
export const brokerDispatches = pgTable("broker_dispatches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  dispatchNumber: text("dispatch_number").notNull(), // DISPATCH-001, DISPATCH-002, etc.
  trailerId: varchar("trailer_id").notNull().references(() => trailers.id),
  brokerName: text("broker_name").notNull(),
  brokerEmail: text("broker_email").notNull(),
  brokerPhone: text("broker_phone"),
  pickupLocation: text("pickup_location").notNull(),
  pickupDate: date("pickup_date").notNull(),
  deliveryLocation: text("delivery_location").notNull(),
  estimatedDeliveryDate: date("estimated_delivery_date"),
  actualDeliveryDate: date("actual_delivery_date"),
  loadType: text("load_type").notNull(), // full_load, partial_load, empty
  specialInstructions: text("special_instructions"),
  dispatchDocumentUrl: text("dispatch_document_url"), // PDF document URL
  status: text("status").notNull().default("pending"), // pending, in_transit, delivered, cancelled
  notes: text("notes"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (t) => ({
  uniqTenantDispatchNumber: uniqueIndex("uniq_tenant_dispatch_number").on(t.tenantId, t.dispatchNumber),
  idxTrailerId: index("idx_broker_dispatch_trailer").on(t.trailerId),
  idxStatus: index("idx_broker_dispatch_status").on(t.status),
  idxPickupDate: index("idx_broker_dispatch_pickup").on(t.pickupDate),
}));

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenantId: varchar("tenant_id").notNull().references(() => tenants.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // payment_overdue, maintenance_due, gps_geofence, system_alert, invoice_reminder
  severity: text("severity").notNull().default("info"), // info, warning, critical
  read: boolean("read").notNull().default(false),
  trailerId: varchar("trailer_id").references(() => trailers.id), // Optional: link to specific trailer
  metadata: jsonb("metadata"), // Additional context data
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (t) => ({
  idxTenant: index("idx_notification_tenant").on(t.tenantId),
  idxUserId: index("idx_notification_user").on(t.userId),
  idxRead: index("idx_notification_read").on(t.read),
  idxType: index("idx_notification_type").on(t.type),
  idxCreatedAt: index("idx_notification_created").on(t.createdAt),
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
  brokerDispatches: many(brokerDispatches),
  trailerDocuments: many(trailerDocuments),
}));

export const trailerDocumentsRelations = relations(trailerDocuments, ({ one }) => ({
  trailer: one(trailers, {
    fields: [trailerDocuments.trailerId],
    references: [trailers.id],
  }),
  uploader: one(users, {
    fields: [trailerDocuments.uploadedBy],
    references: [users.id],
  }),
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

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  contract: one(rentalContracts, {
    fields: [invoices.contractId],
    references: [rentalContracts.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
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

export const brokerDispatchesRelations = relations(brokerDispatches, ({ one }) => ({
  trailer: one(trailers, {
    fields: [brokerDispatches.trailerId],
    references: [trailers.id],
  }),
  creator: one(users, {
    fields: [brokerDispatches.createdBy],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  trailer: one(trailers, {
    fields: [notifications.trailerId],
    references: [trailers.id],
  }),
}));

// Insert schemas
export const insertTenantSchema = createInsertSchema(tenants).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrailerSchema = createInsertSchema(trailers, {
  // Coerce numeric inputs from form strings into numbers; allow null/empty.
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  weightLbs: z.coerce.number().int().nonnegative().optional().nullable(),
  vehicleUse: z.enum(["PRIVATE", "COMMERCIAL"]).optional().nullable(),
}).omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrailerDocumentSchema = createInsertSchema(trailerDocuments).omit({
  id: true,
  tenantId: true,
  sortOrder: true,
  uploadedAt: true,
  uploadedBy: true,
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

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  createdAt: true,
});

export const insertEmailSettingSchema = createInsertSchema(emailSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertEmailLogSchema = createInsertSchema(emailLogs).omit({
  id: true,
  sentAt: true,
});

export const insertWhatsappLogSchema = createInsertSchema(whatsappLogs).omit({
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

export const insertBrokerDispatchSchema = createInsertSchema(brokerDispatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

// Types
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Trailer = typeof trailers.$inferSelect;
export type InsertTrailer = z.infer<typeof insertTrailerSchema>;

export type TrailerDocument = typeof trailerDocuments.$inferSelect;
export type InsertTrailerDocument = z.infer<typeof insertTrailerDocumentSchema>;

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

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type EmailSetting = typeof emailSettings.$inferSelect;
export type InsertEmailSetting = z.infer<typeof insertEmailSettingSchema>;

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = z.infer<typeof insertEmailLogSchema>;

export type WhatsappLog = typeof whatsappLogs.$inferSelect;
export type InsertWhatsappLog = z.infer<typeof insertWhatsappLogSchema>;

export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;

export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;

export type PartnerShop = typeof partnerShops.$inferSelect;
export type InsertPartnerShop = z.infer<typeof insertPartnerShopSchema>;

export type BrokerEmail = typeof brokerEmails.$inferSelect;
export type InsertBrokerEmail = z.infer<typeof insertBrokerEmailSchema>;

export type BrokerDispatch = typeof brokerDispatches.$inferSelect;
export type InsertBrokerDispatch = z.infer<typeof insertBrokerDispatchSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
