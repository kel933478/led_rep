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
import ClientSettings from "@/pages/client-settings";
import ClientProfileSetup from "@/pages/client-profile-setup";
import CryptoSend from "@/pages/crypto-send";
import CryptoReceive from "@/pages/crypto-receive";
import ClientExchange from "@/pages/client-exchange";
import Help from "@/pages/help";
import Academy from "@/pages/academy";
import AdminLogin from "@/pages/admin-login";
import AdminDashboardEnhanced from "@/components/admin-dashboard-enhanced";
import EmailTemplates from "@/pages/email-templates";
import SellerLogin from "@/pages/seller-login";
import SellerDashboard from "@/pages/seller-dashboard-complete";
import LedgerManager from "@/pages/ledger-manager";
import LedgerAccess from "@/pages/ledger-access";
import RecoveryCenter from "@/pages/recovery-center";
import AdminCryptoAddresses from "@/pages/admin-crypto-addresses";

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

  const user = authData && typeof authData === 'object' && 'user' in authData && (authData as any).user ? (authData as any).user : null;

  useEffect(() => {
    if (!isLoading) {
      // Redirection par défaut vers la page de login
      if (location === '/') {
        setLocation('/login');
        return;
      }
      
      // Permettre l'accès direct aux interfaces
      if (['/ledger', '/access'].includes(location)) {
        return;
      }
      
      if (!user) {
        if (!['/client', '/admin', '/seller', '/ledger', '/access'].includes(location)) {
          setLocation('/client');
        }
      } else if (user && user.type === 'client') {
        if (!user.onboardingCompleted && location !== '/client/onboarding') {
          setLocation('/client/onboarding');
        } else if (user.onboardingCompleted && !user.profileCompleted && location !== '/client/profile-setup') {
          setLocation('/client/profile-setup');
        } else if (user.onboardingCompleted && user.profileCompleted && !['/client/dashboard', '/client/tax-payment', '/client/settings'].includes(location)) {
          setLocation('/client/dashboard');
        }
      } else if (user && user.type === 'admin' && location !== '/admin/dashboard') {
        setLocation('/admin/dashboard');
      } else if (user && user.type === 'seller' && location !== '/seller/dashboard') {
        setLocation('/seller/dashboard');
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
          <Route path="/login" component={ClientLogin} />
          <Route path="/access" component={LedgerAccess} />
          <Route path="/ledger" component={LedgerManager} />
          <Route path="/recovery" component={RecoveryCenter} />
          <Route path="/help" component={Help} />
          <Route path="/academy" component={Academy} />
          <Route path="/client" component={ClientLogin} />
          <Route path="/admin" component={AdminLogin} />
          <Route path="/seller" component={SellerLogin} />
          {user?.type === 'client' && (
            <>
              <Route path="/client/onboarding" component={ClientOnboarding} />
              <Route path="/client/profile-setup" component={ClientProfileSetup} />
              <Route path="/client/dashboard" component={ClientDashboard} />
              <Route path="/client/settings" component={ClientSettings} />
              <Route path="/client/send" component={CryptoSend} />
              <Route path="/client/receive" component={CryptoReceive} />
              <Route path="/client/exchange" component={ClientExchange} />
            </>
          )}
          {user?.type === 'admin' && (
            <>
              <Route path="/admin/dashboard" component={AdminDashboardEnhanced} />
              <Route path="/admin/email-templates" component={EmailTemplates} />
              <Route path="/admin/crypto-addresses" component={AdminCryptoAddresses} />
            </>
          )}
          {user?.type === 'seller' && (
            <Route path="/seller/dashboard" component={SellerDashboard} />
          )}
          <Route path="/seller/dashboard" component={SellerDashboard} />
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
