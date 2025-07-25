import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { ArrowUpRight, ArrowDownRight, ArrowLeftRight } from "lucide-react";

interface Asset {
  name: string;
  symbol: string;
  price: number;
  allocation: number;
  amount: number;
  value: number;
  change24h: number;
  icon: string;
  color: string;
}

interface AssetAllocationTableProps {
  assets: Asset[];
  totalValue: number;
}

export default function AssetAllocationTable({ assets, totalValue }: AssetAllocationTableProps) {
  const { t } = useLanguage();
  const [_, setLocation] = useLocation();
  
  const formatCurrency = (value: number) => {
    if (typeof value !== 'number' || isNaN(value)) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {t('assetAllocation')} ({assets.length})
        </h3>
        <div className="flex space-x-2">
          <Button 
            size="sm" 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => setLocation('/client/tax-payment')}
          >
            <ArrowUpRight className="w-4 h-4 mr-2" />
            {t('buy')}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => setLocation('/client/tax-payment')}
          >
            <ArrowDownRight className="w-4 h-4 mr-2" />
            {t('sell')}
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={() => setLocation('/client/tax-payment')}
          >
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            {t('exchange')}
          </Button>
        </div>
      </div>
      
      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-sm font-medium text-gray-400 pb-3">{t('asset')}</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">{t('price')}</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">{t('allocation')}</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">{t('quantity')}</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">{t('value')}</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">{t('actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {assets.map((asset, index) => (
              <tr key={asset.symbol} className="hover:bg-gray-800/50 transition-colors">
                <td className="py-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium"
                      style={{ backgroundColor: asset.color }}
                    >
                      {asset.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium">{asset.name}</div>
                      <div className="text-gray-400 text-sm">{asset.symbol}</div>
                    </div>
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="text-white">{formatCurrency(asset.price)}</div>
                  <div className={`text-sm ${
                    asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {formatPercent(asset.change24h)}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="space-y-2">
                    <div className="text-white font-medium">{(asset.allocation || 0).toFixed(1)}%</div>
                    <Progress 
                      value={asset.allocation} 
                      className="w-16 h-1" 
                      style={{ 
                        backgroundColor: '#374151',
                      }}
                    />
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="text-white">
                    {(asset.amount || 0).toLocaleString(undefined, {
                      maximumFractionDigits: (asset.amount || 0) < 1 ? 6 : 2
                    })} {asset.symbol}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="text-white font-medium">
                    {formatCurrency(asset.value)}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="flex justify-end space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-black hover:text-gray-600 hover:bg-gray-200 px-2"
                      onClick={() => setLocation('/client/dashboard')}
                    >
                      Acheter
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-black hover:text-gray-600 hover:bg-gray-200 px-2"
                      onClick={() => setLocation('/client/dashboard')}
                    >
                      Vendre
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}