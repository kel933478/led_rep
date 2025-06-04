import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import CryptoCard from "@/components/crypto-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function ClientDashboard() {
  const { t } = useLanguage();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/client/dashboard'],
    queryFn: clientApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des données</p>
      </div>
    );
  }

  const { client, cryptoPrices, taxRate } = dashboardData;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('dashboardTitle')}</h1>
          <p className="text-muted-foreground">{t('dashboardSubtitle')}</p>
        </div>

        {/* Crypto Portfolio */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          <CryptoCard
            name={t('bitcoin')}
            symbol="BTC"
            balance={client.balances.btc}
            price={cryptoPrices.bitcoin}
            icon="₿"
            iconBg="bg-orange-500"
          />
          <CryptoCard
            name={t('ethereum')}
            symbol="ETH"
            balance={client.balances.eth}
            price={cryptoPrices.ethereum}
            icon="Ξ"
            iconBg="bg-purple-500"
          />
          <CryptoCard
            name={t('tether')}
            symbol="USDT"
            balance={client.balances.usdt}
            price={cryptoPrices.tether}
            icon="₮"
            iconBg="bg-green-500"
          />
          <CryptoCard
            name="Cardano"
            symbol="ADA"
            balance={client.balances.ada}
            price={cryptoPrices.cardano}
            icon="₳"
            iconBg="bg-blue-500"
          />
          <CryptoCard
            name="Polkadot"
            symbol="DOT"
            balance={client.balances.dot}
            price={cryptoPrices.polkadot}
            icon="●"
            iconBg="bg-pink-500"
          />
          <CryptoCard
            name="Solana"
            symbol="SOL"
            balance={client.balances.sol}
            price={cryptoPrices.solana}
            icon="◎"
            iconBg="bg-gradient-to-r from-purple-400 to-pink-400"
          />
          <CryptoCard
            name="Chainlink"
            symbol="LINK"
            balance={client.balances.link}
            price={cryptoPrices.chainlink}
            icon="⧫"
            iconBg="bg-blue-600"
          />
          <CryptoCard
            name="Polygon"
            symbol="MATIC"
            balance={client.balances.matic}
            price={cryptoPrices.polygon}
            icon="⬢"
            iconBg="bg-purple-600"
          />
          <CryptoCard
            name="Binance Coin"
            symbol="BNB"
            balance={client.balances.bnb}
            price={cryptoPrices.binancecoin}
            icon="◆"
            iconBg="bg-yellow-500"
          />
          <CryptoCard
            name="XRP"
            symbol="XRP"
            balance={client.balances.xrp}
            price={cryptoPrices.ripple}
            icon="◉"
            iconBg="bg-blue-400"
          />
        </div>

        {/* Tax Information */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('taxInfo')}</h2>
                <p className="text-muted-foreground">{t('taxDescription')}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-orange-400">{taxRate}%</p>
                <p className="text-sm text-muted-foreground">{t('taxRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Message */}
        <Card className="bg-green-900/20 border-green-600/30">
          <CardContent className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-green-400 mb-2">{t('successTitle')}</h2>
            <p className="text-green-300">{t('successMessage')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
