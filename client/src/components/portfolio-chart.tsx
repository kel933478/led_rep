import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { useLanguage } from "@/hooks/use-language";

interface PortfolioChartProps {
  totalValue: number;
  change: number;
  changePercent: number;
}

export default function PortfolioChart({ totalValue, change, changePercent }: PortfolioChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("1Y");
  const { t } = useLanguage();
  
  const periods = ["1D", "1W", "1M", "1Y", "ALL"];
  
  // Generate sample portfolio data for demonstration
  const portfolioData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    value: totalValue * (0.8 + Math.random() * 0.4 + i * 0.01),
  }));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 mb-6">
      {/* Portfolio Value Header */}
      <div className="mb-6">
        <h2 className="text-4xl font-bold text-white mb-2">
          {formatCurrency(totalValue)}
        </h2>
        <p className="text-gray-400 text-sm mb-4">{t('totalBalance')}</p>
        
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-green-400 font-medium">
            {changePercent.toFixed(1)}% (+{formatCurrency(change)})
          </span>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex space-x-2 mb-6">
        {periods.map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? "default" : "ghost"}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
            className={`text-xs ${
              selectedPeriod === period
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={portfolioData}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6B7280' }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              }}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => [formatCurrency(value), 'Portfolio Value']}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3B82F6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}