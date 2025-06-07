import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import SharedLayout from "@/components/shared-layout";
import DashboardStats from "@/components/dashboard-stats";
import DataTable from "@/components/data-table";
import QuickActions from "@/components/quick-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, DollarSign, TrendingUp, AlertTriangle, 
  UserPlus, Download, Settings, Eye, Edit 
} from "lucide-react";

export default function AdminDashboardImproved() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const handleLogout = () => {
    fetch('/api/admin/logout', { method: 'POST' })
      .then(() => window.location.href = '/admin');
  };

  if (isLoading) {
    return (
      <SharedLayout userType="admin" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
      </SharedLayout>
    );
  }

  if (!dashboardData) {
    return (
      <SharedLayout userType="admin" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">Error loading dashboard</p>
        </div>
      </SharedLayout>
    );
  }

  const { clients, sellers } = dashboardData;

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalClients = clients.length;
    const activeClients = clients.filter((c: any) => c.lastConnection).length;
    const kycCompleted = clients.filter((c: any) => c.kycCompleted).length;
    const totalRevenue = clients.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    
    return {
      totalClients,
      activeClients,
      kycCompleted,
      totalRevenue,
      kycRate: ((kycCompleted / totalClients) * 100).toFixed(1),
      avgPortfolio: (totalRevenue / totalClients).toFixed(2)
    };
  }, [clients]);

  // Quick actions for admin
  const quickActions = [
    {
      label: t('createClient'),
      icon: <UserPlus className="w-4 h-4" />,
      onClick: () => console.log('Create client'),
      variant: 'default' as const
    },
    {
      label: t('exportCsv'),
      icon: <Download className="w-4 h-4" />,
      onClick: () => adminApi.exportClients(),
      variant: 'outline' as const
    },
    {
      label: t('settings'),
      icon: <Settings className="w-4 h-4" />,
      onClick: () => console.log('Settings'),
      variant: 'secondary' as const
    }
  ];

  // Dashboard stats
  const stats = [
    {
      title: t('totalClients'),
      value: metrics.totalClients,
      icon: <Users className="w-4 h-4" />,
      change: 8.2,
      changeType: 'increase' as const
    },
    {
      title: 'Active Clients',
      value: metrics.activeClients,
      icon: <TrendingUp className="w-4 h-4" />,
      change: 12.5,
      changeType: 'increase' as const
    },
    {
      title: 'KYC Rate',
      value: metrics.kycRate,
      format: 'percentage' as const,
      icon: <AlertTriangle className="w-4 h-4" />
    },
    {
      title: 'Total Revenue',
      value: metrics.totalRevenue,
      format: 'currency' as const,
      icon: <DollarSign className="w-4 h-4" />,
      change: 15.3,
      changeType: 'increase' as const
    }
  ];

  // Table columns for clients
  const clientColumns = [
    {
      key: 'email',
      label: t('email'),
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'fullName',
      label: t('fullName'),
      sortable: true
    },
    {
      key: 'amount',
      label: t('amount'),
      sortable: true,
      render: (value: number) => `€${value?.toLocaleString() || 0}`
    },
    {
      key: 'kycCompleted',
      label: t('kycStatus'),
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? t('completed') : t('pending')}
        </Badge>
      )
    },
    {
      key: 'taxStatus',
      label: t('taxStatus'),
      render: (value: string) => {
        const variants = {
          paid: 'default',
          unpaid: 'destructive',
          pending: 'secondary'
        } as const;
        return (
          <Badge variant={variants[value as keyof typeof variants] || 'secondary'}>
            {t(value as any) || value}
          </Badge>
        );
      }
    }
  ];

  // Client actions
  const getClientActions = (client: any) => [
    {
      label: t('view'),
      icon: <Eye className="w-3 h-3" />,
      onClick: () => console.log('View client', client.id)
    },
    {
      label: t('edit'),
      icon: <Edit className="w-3 h-3" />,
      onClick: () => console.log('Edit client', client.id)
    }
  ];

  // Filters for client table
  const clientFilters = [
    {
      key: 'kycCompleted',
      label: 'KYC Status',
      options: [
        { value: 'true', label: 'Completed' },
        { value: 'false', label: 'Pending' }
      ]
    },
    {
      key: 'taxStatus',
      label: 'Tax Status',
      options: [
        { value: 'paid', label: 'Paid' },
        { value: 'unpaid', label: 'Unpaid' },
        { value: 'pending', label: 'Pending' }
      ]
    }
  ];

  return (
    <SharedLayout 
      userType="admin" 
      userName="Administrator"
      onLogout={handleLogout}
      notifications={clients.filter((c: any) => !c.kycCompleted).length}
      quickActions={<QuickActions actions={quickActions} />}
    >
      <div className="p-6 space-y-6">
        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Clients Table */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('clientManagement')}</h2>
          <DataTable
            data={clients}
            columns={clientColumns}
            searchable={true}
            selectable={true}
            actions={getClientActions}
            filters={clientFilters}
          />
        </div>

        {/* Sellers Section */}
        {sellers && sellers.length > 0 && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">{t('sellerManagement')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sellers.map((seller: any) => (
                <div key={seller.id} className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-medium text-white">{seller.fullName}</h3>
                  <p className="text-gray-400 text-sm">{seller.email}</p>
                  <Badge variant={seller.isActive ? 'default' : 'secondary'} className="mt-2">
                    {seller.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SharedLayout>
  );
}