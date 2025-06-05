import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@/lib/api";

import Header from "@/components/header";
import ClientLogin from "@/pages/client-login";
import ClientOnboarding from "@/pages/client-onboarding";
import ClientDashboard from "@/pages/client-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import LedgerManager from "@/pages/ledger-manager";
import LedgerAccess from "@/pages/ledger-access";
import RecoveryCenter from "@/pages/recovery-center";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/hooks/use-language";

function AuthRouter() {
  const [location, setLocation] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 30000,
  });

  const user = authData && typeof authData === 'object' && 'user' in authData ? authData.user as User : null;

  useEffect(() => {
    if (!isLoading) {
      // Redirection par défaut vers la page d'accès
      if (location === '/') {
        setLocation('/access');
        return;
      }
      
      // Permettre l'accès direct aux interfaces
      if (['/ledger', '/access'].includes(location)) {
        return;
      }
      
      if (!user) {
        if (!['/client', '/admin', '/ledger', '/access'].includes(location)) {
          setLocation('/client');
        }
      } else if (user && user.type === 'client') {
        if (!user.onboardingCompleted && location !== '/client/onboarding') {
          setLocation('/client/onboarding');
        } else if (user.onboardingCompleted && !['/client/dashboard'].includes(location)) {
          setLocation('/client/dashboard');
        }
      } else if (user && user.type === 'admin' && location !== '/admin/dashboard') {
        setLocation('/admin/dashboard');
      }
    }
  }, [user, location, setLocation, isLoading]);

  return (
    <div className="min-h-screen bg-background">
      {/* Afficher uniquement le header pour les pages d'authentification */}
      {(location.includes('/client') || location.includes('/admin')) && <Header />}
      
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Switch>
          <Route path="/access" component={LedgerAccess} />
          <Route path="/ledger" component={LedgerManager} />
          <Route path="/recovery" component={RecoveryCenter} />
          <Route path="/client" component={ClientLogin} />
          <Route path="/admin" component={AdminLogin} />
          {user?.type === 'client' && (
            <>
              <Route path="/client/onboarding" component={ClientOnboarding} />
              <Route path="/client/dashboard" component={ClientDashboard} />
            </>
          )}
          {user?.type === 'admin' && (
            <Route path="/admin/dashboard" component={AdminDashboard} />
          )}
          <Route component={NotFound} />
        </Switch>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <AuthRouter />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
