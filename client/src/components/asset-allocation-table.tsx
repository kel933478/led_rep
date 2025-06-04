import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">
        Asset allocation ({assets.length})
      </h3>
      
      <div className="overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left text-sm font-medium text-gray-400 pb-3">Asset</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">Price</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">Allocation</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">Amount</th>
              <th className="text-right text-sm font-medium text-gray-400 pb-3">Value</th>
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
                    <div className="text-white font-medium">{asset.allocation.toFixed(1)}%</div>
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
                    {asset.amount.toLocaleString(undefined, {
                      maximumFractionDigits: asset.amount < 1 ? 6 : 2
                    })} {asset.symbol}
                  </div>
                </td>
                <td className="py-4 text-right">
                  <div className="text-white font-medium">
                    {formatCurrency(asset.value)}
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