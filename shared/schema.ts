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
  balances: jsonb("balances").$type<{ btc: number; eth: number; usdt: number }>().default({ btc: 0.25, eth: 2.75, usdt: 5000 }),
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

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  notes: many(adminNotes),
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  notes: many(adminNotes),
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

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).pick({
  email: true,
  password: true,
  amount: true,
  kycFileName: true,
  balances: true,
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

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type AdminNote = typeof adminNotes.$inferSelect;
export type InsertAdminNote = z.infer<typeof insertAdminNoteSchema>;
export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;

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
