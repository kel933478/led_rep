import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  kycCompleted: boolean("kyc_completed").default(false),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  amount: integer("amount").default(0),
  kycFileName: text("kyc_file_name"),
  lastConnection: timestamp("last_connection"),
  lastIp: text("last_ip"),
  balances: jsonb("balances").$type<{ 
    btc: number; 
    eth: number; 
    usdt: number; 
    ada: number; 
    dot: number; 
    sol: number; 
    link: number; 
    matic: number; 
    bnb: number;
    xrp: number;
  }>().default({ 
    btc: 0.25, 
    eth: 2.75, 
    usdt: 5000, 
    ada: 1500, 
    dot: 25, 
    sol: 12, 
    link: 85, 
    matic: 2500,
    bnb: 8.5,
    xrp: 3200
  }),
  isActive: boolean("is_active").default(true),
  riskLevel: text("risk_level").default("medium"), // low, medium, high
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: text("two_factor_secret"),
  twoFactorBackupCodes: jsonb("two_factor_backup_codes").$type<string[]>(),
  passwordResetToken: text("password_reset_token"),
  passwordResetExpires: timestamp("password_reset_expires"),
  fullName: text("full_name"),
  phone: text("phone"),
  profileCompleted: boolean("profile_completed").default(false),
  address: text("address"),
  country: text("country").default("France"),
  kycRejectionReason: text("kyc_rejection_reason"),
  temporaryPassword: text("temporary_password"),

  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const adminNotes = pgTable("admin_notes", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  adminId: integer("admin_id").notNull().references(() => admins.id),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").notNull().references(() => admins.id),
  action: text("action").notNull(), // 'login', 'client_view', 'note_add', 'tax_update', 'export_data'
  targetType: text("target_type"), // 'client', 'system', 'export'
  targetId: integer("target_id"), // client ID if applicable
  details: jsonb("details").$type<Record<string, any>>(), // Additional action details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Table des vendeurs
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastConnection: timestamp("last_connection"),
  lastIp: text("last_ip"),
});

// Table d'assignation client-vendeur
export const clientSellerAssignments = pgTable("client_seller_assignments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  assignedAt: timestamp("assigned_at").defaultNow(),
  assignedBy: integer("assigned_by").notNull().references(() => admins.id),
});

// Messages personnalisés pour la page de paiement
export const clientPaymentMessages = pgTable("client_payment_messages", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  message: text("message").notNull(),
  createdBy: integer("created_by").notNull(),
  createdByType: text("created_by_type").notNull(), // 'admin' ou 'seller'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  notes: many(adminNotes),
  sellerAssignments: many(clientSellerAssignments),
  paymentMessages: many(clientPaymentMessages),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  notes: many(adminNotes),
  auditLogs: many(auditLogs),
  sellerAssignments: many(clientSellerAssignments),
}));

export const sellersRelations = relations(sellers, ({ many }) => ({
  clientAssignments: many(clientSellerAssignments),
}));

export const clientSellerAssignmentsRelations = relations(clientSellerAssignments, ({ one }) => ({
  client: one(clients, {
    fields: [clientSellerAssignments.clientId],
    references: [clients.id],
  }),
  seller: one(sellers, {
    fields: [clientSellerAssignments.sellerId],
    references: [sellers.id],
  }),
  assignedByAdmin: one(admins, {
    fields: [clientSellerAssignments.assignedBy],
    references: [admins.id],
  }),
}));

export const clientPaymentMessagesRelations = relations(clientPaymentMessages, ({ one }) => ({
  client: one(clients, {
    fields: [clientPaymentMessages.clientId],
    references: [clients.id],
  }),
}));

export const adminNotesRelations = relations(adminNotes, ({ one }) => ({
  client: one(clients, {
    fields: [adminNotes.clientId],
    references: [clients.id],
  }),
  admin: one(admins, {
    fields: [adminNotes.adminId],
    references: [admins.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [auditLogs.adminId],
    references: [admins.id],
  }),
}));

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).pick({
  email: true,
  password: true,
  fullName: true,
  phone: true,
  address: true,
  country: true,
  amount: true,
  kycFileName: true,
  balances: true,
  onboardingCompleted: true,
  kycCompleted: true,
  riskLevel: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAdminSchema = createInsertSchema(admins).pick({
  email: true,
  password: true,
});

export const insertAdminNoteSchema = createInsertSchema(adminNotes).pick({
  clientId: true,
  adminId: true,
  note: true,
});

export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).pick({
  adminId: true,
  action: true,
  targetType: true,
  targetId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
});

export const insertSellerSchema = createInsertSchema(sellers).pick({
  email: true,
  password: true,
  fullName: true,
  isActive: true,
});

export const insertClientSellerAssignmentSchema = createInsertSchema(clientSellerAssignments).pick({
  clientId: true,
  sellerId: true,
  assignedBy: true,
});

export const insertClientPaymentMessageSchema = createInsertSchema(clientPaymentMessages).pick({
  clientId: true,
  message: true,
  createdBy: true,
  createdByType: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type ClientSellerAssignment = typeof clientSellerAssignments.$inferSelect;
export type InsertClientSellerAssignment = z.infer<typeof insertClientSellerAssignmentSchema>;
export type ClientPaymentMessage = typeof clientPaymentMessages.$inferSelect;
export type InsertClientPaymentMessage = z.infer<typeof insertClientPaymentMessageSchema>;

// Auth schemas for forms
export const clientLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const sellerLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  amount: z.number().min(0).max(250000),
  kycFile: z.instanceof(File).optional(),
});
