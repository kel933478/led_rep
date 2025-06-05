import { Link, useLocation } from "wouter";
import { 
  BarChart3, 
  TrendingUp, 
  CreditCard, 
  Compass, 
  Send, 
  Download, 
  ShoppingCart, 
  ArrowLeftRight,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
  {
    icon: BarChart3,
    label: "Portfolio",
    href: "/client/dashboard",
    section: "main"
  },
  {
    icon: TrendingUp,
    label: "Market",
    href: "/client/market",
    section: "main"
  },
  {
    icon: CreditCard,
    label: "Accounts",
    href: "/client/accounts", 
    section: "main"
  },
  {
    icon: Compass,
    label: "Discover",
    href: "/client/discover",
    section: "main"
  },
  {
    icon: Send,
    label: "Send",
    href: "/client/send",
    section: "actions"
  },
  {
    icon: Download,
    label: "Receive",
    href: "/client/receive",
    section: "actions"
  },
  {
    icon: ShoppingCart,
    label: "Buy / Sell",
    href: "/client/buy-sell",
    section: "actions"
  },
  {
    icon: ArrowLeftRight,
    label: "Swap",
    href: "/client/swap",
    section: "actions"
  },
  {
    icon: CreditCard,
    label: "Card",
    href: "/client/card",
    section: "tools"
  },
  {
    icon: Settings,
    label: "Manager",
    href: "/client/manager",
    section: "tools",
    active: true
  }
];

export function LedgerSidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 h-screen bg-[hsl(var(--ledger-bg-main))] border-r border-[hsl(var(--ledger-border))] flex flex-col">
      {/* Header avec MENU */}
      <div className="px-6 py-4 border-b border-[hsl(var(--ledger-border))]">
        <span className="text-xs font-medium text-[hsl(var(--ledger-text-muted))] tracking-wider">
          MENU
        </span>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-1">
          {sidebarItems.map((item) => {
            const isActive = location === item.href || item.active;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-[hsl(var(--ledger-hover))] text-[hsl(var(--ledger-text-primary))]"
                      : "text-[hsl(var(--ledger-text-secondary))] hover:bg-[hsl(var(--ledger-bg-tertiary))] hover:text-[hsl(var(--ledger-text-primary))]"
                  )}
                >
                  <Icon 
                    size={20} 
                    className={cn(
                      "flex-shrink-0",
                      isActive 
                        ? "text-[hsl(var(--ledger-text-primary))]" 
                        : "text-[hsl(var(--ledger-text-muted))]"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}