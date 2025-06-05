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
  address: text("address"),
  country: text("country").default("France"),
  kycRejectionReason: text("kyc_rejection_reason"),
  temporaryPassword: text("temporary_password"),
  taxPercentage: decimal("tax_percentage", { precision: 5, scale: 2 }).default("0"), // Pourcentage de taxe (ex: 5.50 pour 5.5%)
  taxCurrency: text("tax_currency").default("BTC"), // BTC, ETH, USDT
  taxStatus: text("tax_status").default("unpaid"), // unpaid, paid, exempted
  taxWalletAddress: text("tax_wallet_address"),
  taxPaymentProof: text("tax_payment_proof"),
  taxSetBy: integer("tax_set_by"), // admin ID who set the tax
  taxSetAt: timestamp("tax_set_at"),
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

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  notes: many(adminNotes),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  notes: many(adminNotes),
  auditLogs: many(auditLogs),
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

// Auth schemas for forms
export const clientLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  amount: z.number().min(0).max(250000),
  kycFile: z.instanceof(File).optional(),
});
