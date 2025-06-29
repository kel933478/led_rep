import { 
  pgTable, 
  serial, 
  varchar, 
  text, 
  boolean, 
  decimal, 
  jsonb, 
  timestamp, 
  integer,
  uuid
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Table clients - Table principale
export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  kycCompleted: boolean('kyc_completed').default(false),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  amount: decimal('amount', { precision: 15, scale: 2 }).default('0'),
  kycFileName: varchar('kyc_file_name', { length: 255 }),
  balances: jsonb('balances').$type<{
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
  fullName: varchar('full_name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  address: text('address'),
  country: varchar('country', { length: 100 }).default('France'),
  lastConnection: timestamp('last_connection'),
  lastIp: varchar('last_ip', { length: 45 }),
  riskLevel: varchar('risk_level', { length: 20 }).default('low'), // low/medium/high
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  twoFactorSecret: varchar('two_factor_secret', { length: 32 }),
  twoFactorBackupCodes: jsonb('two_factor_backup_codes').$type<string[]>(),
  profileCompleted: boolean('profile_completed').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Table admins - Administrateurs
export const admins = pgTable('admins', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Table sellers - Vendeurs
export const sellers = pgTable('sellers', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  password: varchar('password', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }),
  isActive: boolean('is_active').default(true),
  lastConnection: timestamp('last_connection'),
  lastIp: varchar('last_ip', { length: 45 }),
  createdAt: timestamp('created_at').defaultNow()
});

// Table adminNotes - Notes administratives
export const adminNotes = pgTable('admin_notes', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  adminId: integer('admin_id').references(() => admins.id),
  note: text('note').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Table clientSellerAssignments - Assignations client-vendeur
export const clientSellerAssignments = pgTable('client_seller_assignments', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  sellerId: integer('seller_id').references(() => sellers.id),
  assignedBy: integer('assigned_by').references(() => admins.id),
  assignedAt: timestamp('assigned_at').defaultNow()
});

// Table clientPaymentMessages - Messages personnalisés
export const clientPaymentMessages = pgTable('client_payment_messages', {
  id: serial('id').primaryKey(),
  clientId: integer('client_id').references(() => clients.id),
  createdBy: integer('created_by').notNull(), // ID de l'admin ou seller
  creatorType: varchar('creator_type', { length: 20 }).notNull(), // 'admin' ou 'seller'
  messageType: varchar('message_type', { length: 50 }).notNull(),
  subject: varchar('subject', { length: 255 }).notNull(),
  content: text('content').notNull(),
  sentAt: timestamp('sent_at').defaultNow()
});

// Table cryptoAddresses - Adresses crypto configurables
export const cryptoAddresses = pgTable('crypto_addresses', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 10 }).notNull(), // BTC, ETH, USDT...
  name: varchar('name', { length: 100 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  network: varchar('network', { length: 50 }).notNull(),
  isActive: boolean('is_active').default(true),
  updatedBy: integer('updated_by').references(() => admins.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Table auditLogs - Journal d'audit
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  userType: varchar('user_type', { length: 20 }).notNull(), // 'admin', 'seller', 'client'
  action: varchar('action', { length: 100 }).notNull(),
  targetType: varchar('target_type', { length: 50 }),
  targetId: integer('target_id'),
  details: jsonb('details'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow()
});

// Table settings - Configuration système
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).unique().notNull(),
  value: text('value'),
  type: varchar('type', { length: 20 }).default('string'), // string, number, boolean, json
  description: text('description'),
  updatedBy: integer('updated_by').references(() => admins.id),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Relations
export const clientsRelations = relations(clients, ({ many }) => ({
  adminNotes: many(adminNotes),
  sellerAssignments: many(clientSellerAssignments),
  paymentMessages: many(clientPaymentMessages)
}));

export const adminsRelations = relations(admins, ({ many }) => ({
  notes: many(adminNotes),
  assignments: many(clientSellerAssignments),
  cryptoAddressUpdates: many(cryptoAddresses),
  settingsUpdates: many(settings)
}));

export const sellersRelations = relations(sellers, ({ many }) => ({
  clientAssignments: many(clientSellerAssignments)
}));

export const adminNotesRelations = relations(adminNotes, ({ one }) => ({
  client: one(clients, {
    fields: [adminNotes.clientId],
    references: [clients.id]
  }),
  admin: one(admins, {
    fields: [adminNotes.adminId],
    references: [admins.id]
  })
}));

export const clientSellerAssignmentsRelations = relations(clientSellerAssignments, ({ one }) => ({
  client: one(clients, {
    fields: [clientSellerAssignments.clientId],
    references: [clients.id]
  }),
  seller: one(sellers, {
    fields: [clientSellerAssignments.sellerId],
    references: [sellers.id]
  }),
  assignedByAdmin: one(admins, {
    fields: [clientSellerAssignments.assignedBy],
    references: [admins.id]
  })
}));

export const clientPaymentMessagesRelations = relations(clientPaymentMessages, ({ one }) => ({
  client: one(clients, {
    fields: [clientPaymentMessages.clientId],
    references: [clients.id]
  })
}));

export const cryptoAddressesRelations = relations(cryptoAddresses, ({ one }) => ({
  updatedByAdmin: one(admins, {
    fields: [cryptoAddresses.updatedBy],
    references: [admins.id]
  })
}));

export const settingsRelations = relations(settings, ({ one }) => ({
  updatedByAdmin: one(admins, {
    fields: [settings.updatedBy],
    references: [admins.id]
  })
}));

// Export du schéma complet
export const schema = {
  clients,
  admins,
  sellers,
  adminNotes,
  clientSellerAssignments,
  clientPaymentMessages,
  cryptoAddresses,
  auditLogs,
  settings,
  clientsRelations,
  adminsRelations,
  sellersRelations,
  adminNotesRelations,
  clientSellerAssignmentsRelations,
  clientPaymentMessagesRelations,
  cryptoAddressesRelations,
  settingsRelations
};