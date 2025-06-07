import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: ReactNode;
  format?: 'currency' | 'percentage' | 'number';
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon, 
  format = 'number' 
}: StatCardProps) {
  const formatValue = (val: string | number) => {
    if (format === 'currency') {
      return `€${typeof val === 'number' ? val.toLocaleString() : val}`;
    }
    if (format === 'percentage') {
      return `${val}%`;
    }
    return val;
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return <TrendingUp className="w-3 h-3 text-green-500" />;
      case 'decrease': return <TrendingDown className="w-3 h-3 text-red-500" />;
      default: return <Minus className="w-3 h-3 text-gray-500" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-500';
      case 'decrease': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
        {icon && <div className="text-gray-400">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white mb-1">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getChangeColor()}`}>
            {getChangeIcon()}
            <span className="ml-1">
              {change > 0 ? '+' : ''}{change}% vs last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DashboardStatsProps {
  stats: StatCardProps[];
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}