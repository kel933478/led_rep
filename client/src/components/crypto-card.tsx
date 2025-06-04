import { useLanguage } from "@/hooks/use-language";

interface CryptoCardProps {
  name: string;
  symbol: string;
  balance: number;
  price: number;
  icon: string;
  iconBg: string;
}

export default function CryptoCard({ name, symbol, balance, price, icon, iconBg }: CryptoCardProps) {
  const { t } = useLanguage();
  const totalValue = balance * price;

  return (
    <div className="crypto-card rounded-2xl p-6 ledger-shadow">
      <div className="flex items-center mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-full flex items-center justify-center mr-3`}>
          <span className="text-white font-bold text-lg">{icon}</span>
        </div>
        <div>
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{symbol}</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-2xl font-bold">
          {balance.toLocaleString('en-US', { maximumFractionDigits: symbol === 'USDT' ? 0 : 8 })} {symbol}
        </p>
        <p className="text-primary font-semibold">
          ~${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="text-xs text-muted-foreground">
          {t('price')}: ${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}
