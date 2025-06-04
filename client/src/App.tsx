import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

import Header from "@/components/header";
import ClientLogin from "@/pages/client-login";
import ClientOnboarding from "@/pages/client-onboarding";
import ClientDashboard from "@/pages/client-dashboard";
import AdminLogin from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { LanguageProvider } from "@/hooks/use-language";

function AuthRouter() {
  const [location] = useLocation();
  
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const user = authData?.user;

  // Redirect logic based on auth state and current path
  useEffect(() => {
    if (!user) {
      // Not authenticated - stay on login pages
      if (!['/client', '/admin'].includes(location)) {
        // Redirect to client login by default
        window.history.replaceState({}, '', '/client');
      }
    } else {
      // Authenticated - redirect based on user type and completion status
      if (user.type === 'client') {
        if (!user.onboardingCompleted && location !== '/client/onboarding') {
          window.history.replaceState({}, '', '/client/onboarding');
        } else if (user.onboardingCompleted && location === '/client/onboarding') {
          window.history.replaceState({}, '', '/client/dashboard');
        } else if (!['/client/onboarding', '/client/dashboard'].includes(location)) {
          window.history.replaceState({}, '', user.onboardingCompleted ? '/client/dashboard' : '/client/onboarding');
        }
      } else if (user.type === 'admin') {
        if (location !== '/admin/dashboard') {
          window.history.replaceState({}, '', '/admin/dashboard');
        }
      }
    }
  }, [user, location]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Switch>
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
