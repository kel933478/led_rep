import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

interface SessionData {
  userId?: number;
  userType?: 'client' | 'admin';
}

export async function logAuditTrail(
  adminId: number,
  action: string,
  targetType?: string,
  targetId?: number,
  details?: Record<string, any>,
  req?: Request
) {
  try {
    await storage.createAuditLog({
      adminId,
      action,
      targetType: targetType || null,
      targetId: targetId || null,
      details: details || null,
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
      userAgent: req?.get('User-Agent') || null,
    });
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
}

// Middleware to automatically log admin actions
export function auditMiddleware(action: string, targetType?: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log audit trail if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const session = req.session as any;
        const adminId = session?.userId;
        if (adminId && session?.userType === 'admin') {
          const targetId = req.params.id ? parseInt(req.params.id) : undefined;
          
          // Extract relevant details from request
          const details: Record<string, any> = {};
          if (req.body && Object.keys(req.body).length > 0) {
            details.requestBody = req.body;
          }
          if (req.query && Object.keys(req.query).length > 0) {
            details.queryParams = req.query;
          }
          
          logAuditTrail(adminId, action, targetType, targetId, details, req);
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Log admin login separately
export async function logAdminLogin(adminId: number, req: Request) {
  await logAuditTrail(
    adminId,
    'admin_login',
    'system',
    undefined,
    { loginTime: new Date() },
    req
  );
}

// Log admin logout
export async function logAdminLogout(adminId: number, req: Request) {
  await logAuditTrail(
    adminId,
    'admin_logout',
    'system',
    undefined,
    { logoutTime: new Date() },
    req
  );
}