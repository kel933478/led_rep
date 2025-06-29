import { 
  clients, 
  admins, 
  adminNotes, 
  settings, 
  auditLogs,
  sellers,
  clientSellerAssignments,
  clientPaymentMessages,
  type Client, 
  type Admin, 
  type AdminNote, 
  type Setting, 
  type AuditLog,
  type Seller,
  type ClientSellerAssignment,
  type ClientPaymentMessage,
  type InsertClient, 
  type InsertAdmin, 
  type InsertAdminNote, 
  type InsertSetting, 
  type InsertAuditLog,
  type InsertSeller,
  type InsertClientSellerAssignment,
  type InsertClientPaymentMessage
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Client operations
  getClient(id: number): Promise<Client | undefined>;
  getClientByEmail(email: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;

  // Admin operations
  getAdmin(id: number): Promise<Admin | undefined>;
  getAdminByEmail(email: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Admin notes operations
  getNotesForClient(clientId: number): Promise<AdminNote[]>;
  createAdminNote(note: InsertAdminNote): Promise<AdminNote>;
  getClientTax(clientId: number): Promise<any>;
  getClientNotes(clientId: number): Promise<any[]>;
  addClientNote(clientId: number, note: string, authorId: number, authorType: string): Promise<any>;

  // Settings operations
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;

  // Audit log operations
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(adminId?: number, limit?: number): Promise<AuditLog[]>;

  // Tax management operations
  setClientTax(clientId: number, taxConfig: any): Promise<void>;
  exemptClientTax(clientId: number, reason: string): Promise<void>;
  getClientTaxStatus(clientId: number): Promise<any>;
  submitTaxPaymentProof(clientId: number, proofData: any): Promise<void>;
  validateTaxPayment(clientId: number, status: string, rejectionReason?: string): Promise<void>;
  getPendingTaxPayments(): Promise<any[]>;

  // Seller operations
  getSeller(id: number): Promise<Seller | undefined>;
  getSellerByEmail(email: string): Promise<Seller | undefined>;
  createSeller(seller: InsertSeller): Promise<Seller>;
  updateSeller(id: number, updates: Partial<Seller>): Promise<Seller | undefined>;
  getAllSellers(): Promise<Seller[]>;

  // Client-Seller assignment operations
  assignClientToSeller(clientId: number, sellerId: number, assignedBy: number): Promise<ClientSellerAssignment>;
  removeClientFromSeller(clientId: number, sellerId: number): Promise<void>;
  getSellerClients(sellerId: number): Promise<Client[]>;
  getClientSeller(clientId: number): Promise<Seller | undefined>;
  getAllClientSellerAssignments(): Promise<ClientSellerAssignment[]>;

  // Payment message operations
  setClientPaymentMessage(clientId: number, message: string, createdBy: number, createdByType: 'admin' | 'seller'): Promise<ClientPaymentMessage>;
  getClientPaymentMessage(clientId: number): Promise<ClientPaymentMessage | undefined>;
  updateClientPaymentMessage(clientId: number, message: string, updatedBy: number, updatedByType: 'admin' | 'seller'): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientByEmail(email: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.email, email));
    return client || undefined;
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, updates: Partial<Client>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({ ...updates, lastConnection: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients).orderBy(desc(clients.createdAt));
  }

  async getAdmin(id: number): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.id, id));
    return admin || undefined;
  }

  async getAdminByEmail(email: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.email, email));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db
      .insert(admins)
      .values(insertAdmin)
      .returning();
    return admin;
  }

  async getNotesForClient(clientId: number): Promise<AdminNote[]> {
    return await db
      .select()
      .from(adminNotes)
      .where(eq(adminNotes.clientId, clientId))
      .orderBy(desc(adminNotes.createdAt));
  }

  async createAdminNote(note: InsertAdminNote): Promise<AdminNote> {
    const [adminNote] = await db
      .insert(adminNotes)
      .values(note)
      .returning();
    return adminNote;
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(insertSetting: InsertSetting): Promise<Setting> {
    const [setting] = await db
      .insert(settings)
      .values(insertSetting)
      .onConflictDoUpdate({
        target: settings.key,
        set: { value: insertSetting.value, updatedAt: new Date() }
      })
      .returning();
    return setting;
  }

  async createAuditLog(insertAuditLog: InsertAuditLog): Promise<AuditLog> {
    const [auditLog] = await db
      .insert(auditLogs)
      .values(insertAuditLog)
      .returning();
    return auditLog;
  }

  async getAuditLogs(adminId?: number, limit: number = 100): Promise<AuditLog[]> {
    const query = db
      .select()
      .from(auditLogs)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit);
    
    if (adminId) {
      return await query.where(eq(auditLogs.adminId, adminId));
    }
    
    return await query;
  }

  // Tax management implementations
  async setClientTax(clientId: number, taxConfig: any): Promise<void> {
    await db.update(clients)
      .set({
        taxPercentage: taxConfig.percentage.toString(),
        taxCurrency: taxConfig.currency,
        taxStatus: 'unpaid',
        taxWalletAddress: taxConfig.walletAddress,
        taxSetBy: taxConfig.adminId,
        taxSetAt: new Date(),
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId));
  }

  async exemptClientTax(clientId: number, reason: string): Promise<void> {
    await db.update(clients)
      .set({
        taxStatus: 'exempted',
        updatedAt: new Date()
      })
      .where(eq(clients.id, clientId));
  }

  async getClientTaxStatus(clientId: number): Promise<any> {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
    
    if (!client) {
      return { status: 'none', message: 'Client non trouvé' };
    }
    
    if (!client.taxPercentage || parseFloat(client.taxPercentage) === 0) {
      return { status: 'none', message: 'Aucune taxe configurée' };
    }
    
    // Calculate tax amount based on percentage and portfolio value
    const portfolioValue = client.amount || 0;
    const taxPercentage = parseFloat(client.taxPercentage);
    const calculatedAmount = (portfolioValue * taxPercentage) / 100;
    
    return {
      status: client.taxStatus,
      taxPercentage: taxPercentage,
      taxAmount: calculatedAmount.toFixed(2),
      currency: client.taxCurrency,
      walletAddress: client.taxWalletAddress,
      portfolioValue: portfolioValue,
      setAt: client.taxSetAt,
      setBy: client.taxSetBy
    };
  }

  async logEmailActivity(data: {
    senderType: string;
    senderId: number;
    recipientCount: number;
    subject: string;
    sentAt: Date;
    success: number;
    failed: number;
  }): Promise<void> {
    // Log email activity in settings for audit purposes
    await this.setSetting({
      key: `email_log_${Date.now()}`,
      value: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      })
    });
  }

  async submitTaxPaymentProof(clientId: number, proofData: any): Promise<void> {
    const proofKey = `client_tax_proof_${clientId}`;
    await this.setSetting({
      key: proofKey,
      value: JSON.stringify({
        ...proofData,
        clientId,
        status: 'pending_verification'
      })
    });

    // Update tax status to verification
    const taxKey = `client_tax_${clientId}`;
    const currentTax = await this.getSetting(taxKey);
    if (currentTax) {
      const taxData = JSON.parse(currentTax.value);
      taxData.status = 'verification';
      taxData.proofSubmittedAt = new Date();
      await this.setSetting({
        key: taxKey,
        value: JSON.stringify(taxData)
      });
    }
  }

  async validateTaxPayment(clientId: number, status: string, rejectionReason?: string): Promise<void> {
    const taxKey = `client_tax_${clientId}`;
    const proofKey = `client_tax_proof_${clientId}`;
    
    const currentTax = await this.getSetting(taxKey);
    if (currentTax) {
      const taxData = JSON.parse(currentTax.value);
      taxData.status = status === 'approved' ? 'paid' : 'rejected';
      taxData.validatedAt = new Date();
      if (rejectionReason) {
        taxData.rejectionReason = rejectionReason;
      }
      
      await this.setSetting({
        key: taxKey,
        value: JSON.stringify(taxData)
      });
    }

    // Update proof status
    const currentProof = await this.getSetting(proofKey);
    if (currentProof) {
      const proofData = JSON.parse(currentProof.value);
      proofData.status = status === 'approved' ? 'verified' : 'rejected';
      proofData.validatedAt = new Date();
      if (rejectionReason) {
        proofData.rejectionReason = rejectionReason;
      }
      
      await this.setSetting({
        key: proofKey,
        value: JSON.stringify(proofData)
      });
    }
  }

  async getPendingTaxPayments(): Promise<any[]> {
    const allSettings = await db.select().from(settings);
    const pendingTaxes = [];
    
    for (const setting of allSettings) {
      if (setting.key.startsWith('client_tax_proof_')) {
        try {
          const proofData = JSON.parse(setting.value);
          if (proofData.status === 'pending_verification') {
            const clientId = proofData.clientId;
            const client = await this.getClient(clientId);
            
            pendingTaxes.push({
              ...proofData,
              clientEmail: client?.email || 'Unknown',
              settingKey: setting.key
            });
          }
        } catch (error) {
          console.error('Error parsing tax proof data:', error);
        }
      }
    }
    
    return pendingTaxes;
  }

  // Seller operations
  async getSeller(id: number): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.id, id));
    return seller || undefined;
  }

  async getSellerByEmail(email: string): Promise<Seller | undefined> {
    const [seller] = await db.select().from(sellers).where(eq(sellers.email, email));
    return seller || undefined;
  }



  async createSeller(insertSeller: InsertSeller): Promise<Seller> {
    const [seller] = await db
      .insert(sellers)
      .values(insertSeller)
      .returning();
    return seller;
  }

  async updateSeller(id: number, updates: Partial<Seller>): Promise<Seller | undefined> {
    const [seller] = await db
      .update(sellers)
      .set({ ...updates, lastConnection: new Date() })
      .where(eq(sellers.id, id))
      .returning();
    return seller || undefined;
  }

  async getAllSellers(): Promise<Seller[]> {
    return await db.select().from(sellers);
  }

  // Client-Seller assignment operations
  async assignClientToSeller(clientId: number, sellerId: number, assignedBy: number): Promise<ClientSellerAssignment> {
    // Remove existing assignment if any
    await db.delete(clientSellerAssignments).where(eq(clientSellerAssignments.clientId, clientId));
    
    const [assignment] = await db
      .insert(clientSellerAssignments)
      .values({
        clientId,
        sellerId,
        assignedBy
      })
      .returning();
    return assignment;
  }

  async removeClientFromSeller(clientId: number, sellerId: number): Promise<void> {
    await db.delete(clientSellerAssignments)
      .where(eq(clientSellerAssignments.clientId, clientId));
  }

  async getSellerClients(sellerId: number): Promise<Client[]> {
    const assignments = await db.select()
      .from(clientSellerAssignments)
      .where(eq(clientSellerAssignments.sellerId, sellerId));
    
    const clientIds = assignments.map(a => a.clientId);
    if (clientIds.length === 0) return [];
    
    const sellerClients = [];
    for (const clientId of clientIds) {
      const client = await this.getClient(clientId);
      if (client) sellerClients.push(client);
    }
    
    return sellerClients;
  }

  // Client detail methods for admin/seller access
  async getClientTax(clientId: number): Promise<any> {
    const taxKey = `client_tax_${clientId}`;
    const setting = await this.getSetting(taxKey);
    
    if (!setting) {
      return null;
    }
    
    try {
      return JSON.parse(setting.value);
    } catch {
      return null;
    }
  }

  async getClientNotes(clientId: number): Promise<any[]> {
    const notes = await db.select()
      .from(adminNotes)
      .where(eq(adminNotes.clientId, clientId))
      .orderBy(desc(adminNotes.createdAt));
    
    return notes || [];
  }

  async addClientNote(clientId: number, note: string, authorId: number, authorType: string): Promise<any> {
    const [newNote] = await db
      .insert(adminNotes)
      .values({
        clientId,
        note,
        adminId: authorType === 'admin' ? authorId : null,
        sellerId: authorType === 'seller' ? authorId : null
      })
      .returning();
    
    return newNote;
  }

  async getClientSeller(clientId: number): Promise<Seller | undefined> {
    const [assignment] = await db.select()
      .from(clientSellerAssignments)
      .where(eq(clientSellerAssignments.clientId, clientId));
    
    if (!assignment) return undefined;
    
    return await this.getSeller(assignment.sellerId);
  }

  async getAllClientSellerAssignments(): Promise<ClientSellerAssignment[]> {
    return await db.select().from(clientSellerAssignments);
  }

  // Payment message operations
  async setClientPaymentMessage(clientId: number, message: string, createdBy: number, createdByType: 'admin' | 'seller'): Promise<ClientPaymentMessage> {
    // Remove existing message if any
    await db.delete(clientPaymentMessages).where(eq(clientPaymentMessages.clientId, clientId));
    
    const [paymentMessage] = await db
      .insert(clientPaymentMessages)
      .values({
        clientId,
        message,
        createdBy,
        createdByType
      })
      .returning();
    return paymentMessage;
  }

  async getClientPaymentMessage(clientId: number): Promise<ClientPaymentMessage | undefined> {
    const [message] = await db.select()
      .from(clientPaymentMessages)
      .where(eq(clientPaymentMessages.clientId, clientId));
    return message || undefined;
  }

  async updateClientPaymentMessage(clientId: number, message: string, updatedBy: number, updatedByType: 'admin' | 'seller'): Promise<void> {
    await db.update(clientPaymentMessages)
      .set({
        message,
        createdBy: updatedBy,
        createdByType: updatedByType,
        updatedAt: new Date()
      })
      .where(eq(clientPaymentMessages.clientId, clientId));
  }

  // Seller-specific methods (removing duplicates)

  async getSellerAssignedClients(sellerId: number): Promise<any[]> {
    const assignments = await db.select()
      .from(clientSellerAssignments)
      .where(eq(clientSellerAssignments.sellerId, sellerId));

    const assignedClients = [];
    for (const assignment of assignments) {
      const client = await this.getClient(assignment.clientId);
      if (client) {
        const taxStatus = await this.getClientTaxStatus(client.id);
        assignedClients.push({
          ...client,
          taxStatus: taxStatus.status || 'pending',
          taxRate: taxStatus.taxRate || 15
        });
      }
    }
    
    return assignedClients;
  }

  async updateClientAmount(clientId: number, amount: number): Promise<void> {
    await db.update(clients)
      .set({ amount })
      .where(eq(clients.id, clientId));
  }

  async sendPaymentMessage(clientId: number, sellerId: number, message: string): Promise<void> {
    await this.setClientPaymentMessage(clientId, message, sellerId, 'seller');
  }

  // Mise à jour automatique des wallets pour tous les clients
  async updateAllClientsWallets(btcWallet: string, ethWallet: string, usdtWallet: string): Promise<void> {
    const allClients = await db.select().from(clients);
    
    for (const client of allClients) {
      let walletToUpdate = '';
      
      // Déterminer le wallet selon la devise de taxe du client
      const taxCurrency = client.taxCurrency || 'BTC';
      if (taxCurrency === 'BTC') {
        walletToUpdate = btcWallet;
      } else if (taxCurrency === 'ETH') {
        walletToUpdate = ethWallet;
      } else if (taxCurrency === 'USDT') {
        walletToUpdate = usdtWallet;
      }
      
      // Mettre à jour le wallet du client
      if (walletToUpdate) {
        await db.update(clients)
          .set({ taxWalletAddress: walletToUpdate })
          .where(eq(clients.id, client.id));
      }
    }
  }
}

export const storage = new DatabaseStorage();
