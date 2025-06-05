import { clients, admins, adminNotes, settings, auditLogs, type Client, type Admin, type AdminNote, type Setting, type AuditLog, type InsertClient, type InsertAdmin, type InsertAdminNote, type InsertSetting, type InsertAuditLog } from "@shared/schema";
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
}

export const storage = new DatabaseStorage();
