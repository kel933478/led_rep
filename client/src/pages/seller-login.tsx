import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerLoginSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff, Shield, Users } from "lucide-react";
import { z } from "zod";
import ledgerLogoPath from "@assets/ledger-logo-black-and-white_1749131962438.png";

type SellerLoginForm = z.infer<typeof sellerLoginSchema>;

interface SellerLoginProps {
  onLogin: (user: { id: number; email: string; type: string; fullName?: string }) => void;
}

export default function SellerLogin({ onLogin }: SellerLoginProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t, language } = useLanguage();

  const form = useForm<SellerLoginForm>({
    resolver: zodResolver(sellerLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: SellerLoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/seller/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        onLogin(result.user);
        toast({
          title: t('success'),
          description: language === 'fr' ? 'Connexion réussie' : 'Login successful',
        });
      } else {
        toast({
          title: t('error'),
          description: language === 'fr' ? 'Email ou mot de passe incorrect' : 'Invalid email or password',
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t('error'),
        description: language === 'fr' ? 'Erreur de connexion' : 'Connection error',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo et titre */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <img 
              src={ledgerLogoPath} 
              alt="Ledger"
              className="h-16 w-auto"
            />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {language === 'fr' ? 'Espace Vendeur' : 'Seller Portal'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {language === 'fr' 
                ? 'Gestion des clients assignés' 
                : 'Assigned client management'
              }
            </p>
          </div>
        </div>

        {/* Carte de connexion */}
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Users className="h-5 w-5" />
              <span className="font-semibold">
                {language === 'fr' ? 'Connexion Vendeur' : 'Seller Login'}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'fr' ? 'Adresse email' : 'Email address'}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder={language === 'fr' ? 'vendeur@entreprise.com' : 'seller@company.com'}
                          className="h-11 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {language === 'fr' ? 'Mot de passe' : 'Password'}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder={language === 'fr' ? 'Votre mot de passe' : 'Your password'}
                            className="h-11 pr-10 border-gray-300 dark:border-gray-600 focus:border-primary focus:ring-primary"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                            disabled={isLoading}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-400" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>
                        {language === 'fr' ? 'Connexion...' : 'Signing in...'}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>
                        {language === 'fr' ? 'Se connecter' : 'Sign in'}
                      </span>
                    </div>
                  )}
                </Button>
              </form>
            </Form>

            {/* Informations de sécurité */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-3 text-xs text-gray-500 dark:text-gray-400">
                <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-500" />
                <div className="space-y-1">
                  <p className="font-medium">
                    {language === 'fr' ? 'Accès sécurisé' : 'Secure access'}
                  </p>
                  <p>
                    {language === 'fr' 
                      ? 'Interface dédiée à la gestion de vos clients assignés'
                      : 'Dedicated interface for managing your assigned clients'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {language === 'fr' 
              ? 'Ledger Recovery - Plateforme de récupération professionnelle'
              : 'Ledger Recovery - Professional recovery platform'
            }
          </p>
        </div>
      </div>
    </div>
  );
}