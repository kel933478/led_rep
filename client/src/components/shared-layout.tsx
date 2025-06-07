import { ReactNode } from "react";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Bell, Settings, HelpCircle, LogOut, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/language-switcher";

interface SharedLayoutProps {
  children: ReactNode;
  userType: 'client' | 'admin' | 'seller';
  userName?: string;
  onLogout: () => void;
  notifications?: number;
  quickActions?: ReactNode;
}

export default function SharedLayout({
  children,
  userType,
  userName,
  onLogout,
  notifications = 0,
  quickActions
}: SharedLayoutProps) {
  const { t } = useLanguage();

  const getUserTypeColor = () => {
    switch (userType) {
      case 'client': return 'bg-blue-500';
      case 'admin': return 'bg-red-500';
      case 'seller': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getUserTypeLabel = () => {
    switch (userType) {
      case 'client': return t('clientSpace');
      case 'admin': return t('adminSpace');
      case 'seller': return t('sellerSpace');
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header unifié */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${getUserTypeColor()}`}></div>
              <span className="text-white font-medium">{getUserTypeLabel()}</span>
            </div>
            {userName && (
              <Badge variant="outline" className="text-gray-300">
                <User className="w-3 h-3 mr-1" />
                {userName}
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {quickActions}
            
            <LanguageSwitcher />
            
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-4 h-4" />
              {notifications > 0 && (
                <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center bg-red-500">
                  {notifications}
                </Badge>
              )}
            </Button>
            
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm">
              <HelpCircle className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}