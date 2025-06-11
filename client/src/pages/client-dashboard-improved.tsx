import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import SharedLayout from "@/components/shared-layout";
import DashboardStats from "@/components/dashboard-stats";
import QuickActions from "@/components/quick-actions";
import Sidebar from "@/components/sidebar";
import PortfolioChart from "@/components/portfolio-chart";
import AssetAllocationTable from "@/components/asset-allocation-table";
import { Badge } from "@/components/ui/badge";
import { Send, Download, CreditCard, Wallet, TrendingUp } from "lucide-react";

export default function ClientDashboardImproved() {
  const { t } = useLanguage();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/client/dashboard'],
    queryFn: clientApi.getDashboard,
  });

  const handleLogout = () => {
    fetch('/api/client/logout', { method: 'POST' })
      .then(() => window.location.href = '/client');
  };

  if (isLoading) {
    return (
      <SharedLayout userType="client" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </SharedLayout>
    );
  }

  if (!dashboardData) {
    return (
      <SharedLayout userType="client" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">Error loading dashboard</p>
        </div>
      </SharedLayout>
    );
  }

  const { client, cryptoPrices, taxRate } = dashboardData;

  // Calculate total portfolio value
  const totalValue = Object.entries(client.balances).reduce((total, [symbol, balance]) => {
    const priceKey = symbol === 'btc' ? 'bitcoin' : 
                     symbol === 'eth' ? 'ethereum' : 
                     symbol === 'usdt' ? 'tether' : symbol;
    const price = cryptoPrices[priceKey]?.eur || 0;
    return total + (balance * price);
  }, 0);

  // Quick actions for client
  const quickActions = [
    {
      label: t('send'),
      icon: <Send className="w-4 h-4" />,
      onClick: () => console.log('Send crypto'),
      variant: 'default' as const
    },
    {
      label: t('receive'),
      icon: <Download className="w-4 h-4" />,
      onClick: () => console.log('Receive crypto'),
      variant: 'outline' as const
    },
    {
      label: t('taxPayment'),
      icon: <CreditCard className="w-4 h-4" />,
      onClick: () => window.location.href = '/client/tax-payment',
      variant: 'secondary' as const,
      badge: client.taxStatus === 'unpaid' ? '!' : undefined
    }
  ];

  // Dashboard stats
  const stats = [
    {
      title: t('totalBalance'),
      value: totalValue.toFixed(2),
      format: 'currency' as const,
      icon: <Wallet className="w-4 h-4" />,
      change: 12.5,
      changeType: 'increase' as const
    },
    {
      title: t('taxRate'),
      value: taxRate,
      format: 'percentage' as const,
      icon: <TrendingUp className="w-4 h-4" />
    }
  ];

  return (
    <SharedLayout 
      userType="client" 
      userName={client.fullName || client.email}
      onLogout={handleLogout}
      notifications={client.taxStatus === 'unpaid' ? 1 : 0}
      quickActions={<QuickActions actions={quickActions} />}
    >
      <div className="flex">
        <Sidebar />
        
        <div className="flex-1 p-6 space-y-6">
          {/* Dashboard Stats */}
          <DashboardStats stats={stats} />

          {/* Status Badges */}
          <div className="flex items-center space-x-4">
            <Badge className="bg-green-600 text-white">
              ✓ {t('synchronized')}
            </Badge>
            {client.taxStatus === 'unpaid' && (
              <Badge variant="outline" className="border-black text-black">
                ⚠ {t('taxRequired')}
              </Badge>
            )}
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              ⚡ {t('online')}
            </Badge>
          </div>

          {/* Portfolio Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <PortfolioChart 
                balances={client.balances} 
                prices={cryptoPrices} 
              />
            </div>
            <div>
              <AssetAllocationTable 
                balances={client.balances} 
                prices={cryptoPrices} 
              />
            </div>
          </div>

          {/* Academy Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4">
            <h3 className="text-white font-semibold mb-1">{t('ledgerAcademy')}</h3>
            <p className="text-gray-300 text-sm">
              {t('academyDescription')}
            </p>
          </div>
        </div>
      </div>
    </SharedLayout>
  );
}