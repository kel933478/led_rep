import { apiRequest } from './queryClient';

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  email: string;
  type: 'client' | 'admin';
  onboardingCompleted?: boolean;
  kycCompleted?: boolean;
}

export interface CryptoPrices {
  bitcoin: number;
  ethereum: number;
  tether: number;
}

export interface ClientDashboardData {
  client: {
    email: string;
    balances: {
      btc: number;
      eth: number;
      usdt: number;
    };
    amount: number;
  };
  cryptoPrices: CryptoPrices;
  taxRate: number;
}

export interface AdminClient {
  id: number;
  email: string;
  kycCompleted: boolean;
  onboardingCompleted: boolean;
  amount: number;
  lastConnection: string | null;
  lastIp: string | null;
  balances: {
    btc: number;
    eth: number;
    usdt: number;
  };
  kycFileName: string | null;
}

export interface AdminDashboardData {
  clients: AdminClient[];
  taxRate: number;
}

export interface AuditLog {
  id: number;
  adminId: number;
  action: string;
  targetType: string | null;
  targetId: number | null;
  details: Record<string, any> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

// Auth API
export const authApi = {
  clientLogin: async (data: LoginData) => {
    const res = await apiRequest('POST', '/api/client/login', data);
    return res.json();
  },

  adminLogin: async (data: LoginData) => {
    const res = await apiRequest('POST', '/api/admin/login', data);
    return res.json();
  },

  logout: async () => {
    const res = await apiRequest('POST', '/api/auth/logout');
    return res.json();
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const res = await apiRequest('GET', '/api/auth/me');
    return res.json();
  },
};

// Client API
export const clientApi = {
  completeOnboarding: async (formData: FormData) => {
    const res = await fetch('/api/client/onboarding', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || res.statusText);
    }
    
    return res.json();
  },

  getDashboard: async (): Promise<ClientDashboardData> => {
    const res = await apiRequest('GET', '/api/client/dashboard');
    return res.json();
  },
};

// Admin API
export const adminApi = {
  getDashboard: async (): Promise<AdminDashboardData> => {
    const res = await apiRequest('GET', '/api/admin/dashboard');
    return res.json();
  },

  updateTaxRate: async (taxRate: number) => {
    const res = await apiRequest('POST', '/api/admin/tax', { taxRate });
    return res.json();
  },

  exportClients: async () => {
    const res = await fetch('/api/admin/export', {
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Export failed');
    }
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-clients-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getAuditLogs: async (limit: number = 100, adminId?: number): Promise<{ auditLogs: AuditLog[] }> => {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (adminId) params.append('adminId', adminId.toString());
    
    const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  downloadKyc: async (clientId: number) => {
    const res = await fetch(`/api/admin/client/${clientId}/kyc`, {
      credentials: 'include',
    });
    
    if (!res.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await res.blob();
    const contentDisposition = res.headers.get('content-disposition');
    const filename = contentDisposition?.split('filename=')[1] || `kyc-${clientId}.pdf`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/"/g, '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  getClientNotes: async (clientId: number) => {
    const res = await apiRequest('GET', `/api/admin/client/${clientId}/notes`);
    return res.json();
  },

  addClientNote: async (clientId: number, note: string) => {
    const res = await apiRequest('POST', `/api/admin/client/${clientId}/notes`, { note });
    return res.json();
  },
};
