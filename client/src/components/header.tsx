import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import LanguageSwitcher from "./language-switcher";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: authData } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: t('success'),
        description: t('logoutSuccess'),
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('logoutError'),
        variant: "destructive",
      });
    },
  });

  const user = authData?.user;

  return (
    <header className="bg-black border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-black border border-white rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <span className="text-xl font-semibold text-white">{t('appTitle')}</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            
            {user && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-300">{user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-red-500 hover:text-red-400 hover:bg-gray-800"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
