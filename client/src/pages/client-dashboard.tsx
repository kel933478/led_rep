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
import { Button } from "@/components/ui/button";
import { Send, Download, Plus, CreditCard, TrendingUp, Wallet, Search, Bell, HelpCircle, Settings, Maximize2 } from "lucide-react";

export default function ClientDashboard() {
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
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  if (!dashboardData) {
    return (
      <SharedLayout userType="client" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-400">Error loading dashboard data</p>
          </div>
        </div>
      </SharedLayout>
    );
  }

  const { client, cryptoPrices, taxRate } = dashboardData;

  // Calculate portfolio totals
  const totalValue = Object.entries(client.balances).reduce((total, [symbol, balance]) => {
    const priceKey = symbol === 'btc' ? 'bitcoin' : 
                     symbol === 'eth' ? 'ethereum' :
                     symbol === 'usdt' ? 'tether' :
                     symbol === 'ada' ? 'cardano' :
                     symbol === 'dot' ? 'polkadot' :
                     symbol === 'sol' ? 'solana' :
                     symbol === 'link' ? 'chainlink' :
                     symbol === 'matic' ? 'polygon' :
                     symbol === 'bnb' ? 'binancecoin' :
                     symbol === 'xrp' ? 'ripple' : 'bitcoin';
    
    const price = cryptoPrices[priceKey as keyof typeof cryptoPrices] || 0;
    return total + (balance * price);
  }, 0);

  const portfolioChange = totalValue * 0.863;
  const portfolioChangePercent = 86.3;

  // Prepare assets for allocation table
  const assets = [
    {
      name: "Bitcoin",
      symbol: "BTC", 
      price: cryptoPrices.bitcoin,
      allocation: (client.balances.btc * cryptoPrices.bitcoin / totalValue) * 100,
      amount: client.balances.btc,
      value: client.balances.btc * cryptoPrices.bitcoin,
      change24h: 2.45,
      icon: "₿",
      color: "#F59E0B"
    },
    {
      name: "Ethereum",
      symbol: "ETH",
      price: cryptoPrices.ethereum,
      allocation: (client.balances.eth * cryptoPrices.ethereum / totalValue) * 100,
      amount: client.balances.eth,
      value: client.balances.eth * cryptoPrices.ethereum,
      change24h: 1.23,
      icon: "Ξ",
      color: "#8B5CF6"
    },
    {
      name: "Tether",
      symbol: "USDT",
      price: cryptoPrices.tether,
      allocation: (client.balances.usdt * cryptoPrices.tether / totalValue) * 100,
      amount: client.balances.usdt,
      value: client.balances.usdt * cryptoPrices.tether,
      change24h: 0.01,
      icon: "₮",
      color: "#10B981"
    },
    {
      name: "Cardano",
      symbol: "ADA",
      price: cryptoPrices.cardano,
      allocation: (client.balances.ada * cryptoPrices.cardano / totalValue) * 100,
      amount: client.balances.ada,
      value: client.balances.ada * cryptoPrices.cardano,
      change24h: -0.85,
      icon: "₳",
      color: "#3B82F6"
    },
    {
      name: "Solana",
      symbol: "SOL",
      price: cryptoPrices.solana,
      allocation: (client.balances.sol * cryptoPrices.solana / totalValue) * 100,
      amount: client.balances.sol,
      value: client.balances.sol * cryptoPrices.solana,
      change24h: 3.21,
      icon: "◎",
      color: "#A855F7"
    }
  ].sort((a, b) => b.allocation - a.allocation);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Badge className="bg-green-600 text-white">
                ✓ {t('synchronized')}
              </Badge>
              <Badge variant="outline" className="border-black text-black">
                ⚠ {t('taxRequired')}
              </Badge>
              <Badge variant="outline" className="border-gray-600 text-gray-400">
                ⚡ {t('online')}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => console.log('Search clicked')}>
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => console.log('Notifications clicked')}>
                <Bell className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => window.open('/help', '_blank')}>
                <HelpCircle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => window.location.href = '/client/settings'}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Ledger Academy Banner */}
          <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-4 flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold mb-1">{t('academy').toUpperCase()}</h3>
              <p className="text-gray-300 text-sm">
                {t('academyDescription')}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
              <Button variant="ghost" size="sm" className="text-white" onClick={() => window.open('/academy', '_blank')}>
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Portfolio Chart */}
          <PortfolioChart 
            totalValue={totalValue}
            change={portfolioChange}
            changePercent={portfolioChangePercent}
          />

          {/* Asset Allocation Table */}
          <AssetAllocationTable 
            assets={assets}
            totalValue={totalValue}
          />
        </main>
      </div>
    </div>
  );
}
