import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Wallet, 
  CreditCard, 
  Send, 
  Download, 
  ArrowLeftRight, 
  Landmark,
  Settings,
  Star,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function Sidebar() {
  const { t } = useLanguage();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { 
      name: t('portfolio'), 
      href: "/client/dashboard", 
      icon: Wallet, 
      current: location === "/client/dashboard",
      action: () => window.location.href = "/client/dashboard"
    },
    { 
      name: t('send'), 
      href: "/client/send", 
      icon: Send, 
      current: location === "/client/send",
      action: () => window.location.href = "/client/send"
    },
    { 
      name: t('receive'), 
      href: "/client/receive", 
      icon: Download, 
      current: location === "/client/receive",
      action: () => window.location.href = "/client/receive"
    },
    { 
      name: t('exchange'), 
      href: "/client/exchange", 
      icon: ArrowLeftRight, 
      current: location === "/client/exchange",
      action: () => window.location.href = "/client/exchange"
    },
    { 
      name: t('manager'), 
      href: "/client/settings", 
      icon: Settings, 
      current: location === "/client/settings",
      action: () => window.location.href = "/client/settings"
    },
  ];

  return (
    <div className={`bg-gray-950 border-r border-gray-800 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="text-white font-semibold">{t('appTitle')}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-gray-400 hover:text-white"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Menu Label */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">MENU</span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={item.action}
              className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                item.current
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className={`flex-shrink-0 w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">{item.name}</span>
                  {item.badge && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </button>
          );
        })}
      </nav>

      {/* Starred Accounts Section */}
      {!isCollapsed && (
        <div className="border-t border-gray-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
              STARRED ACCOUNTS
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400 text-sm">
            <Star className="w-4 h-4" />
            <span>Star an account to display it here.</span>
          </div>
        </div>
      )}
    </div>
  );
}