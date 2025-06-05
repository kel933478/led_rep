import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminLoginSchema } from "@shared/schema";
import { authApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Link } from "wouter";
import { Eye, EyeOff, Shield } from "lucide-react";
import ledgerLogoPath from "@assets/ledger-logo-black-and-white_1749131962438.png";
import type { z } from "zod";

type LoginForm = z.infer<typeof adminLoginSchema>;

export default function AdminLogin() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.adminLogin,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: t('success'),
        description: t('loginSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('invalidCredentials'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <img 
            src={ledgerLogoPath} 
            alt="Ledger" 
            className="h-12 mx-auto mb-8 filter invert"
          />
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="h-6 w-6 text-blue-400" />
              <h1 className="text-2xl font-semibold text-white">
                {t('adminAccess')}
              </h1>
            </div>
            <p className="text-gray-400 text-sm">
              {t('secureAdminLogin')}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('emailAdmin')}
                        className="h-12 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-blue-500 focus:ring-0"
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder={t('password')}
                          className="h-12 bg-gray-900 border-gray-700 text-white placeholder-gray-500 rounded-lg focus:border-blue-500 focus:ring-0 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-12 bg-blue-600 text-white hover:bg-blue-700 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="h-4 w-4" />
                {loginMutation.isPending ? t('loading') : t('adminAccess')}
              </Button>
            </form>
          </Form>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              {t('clientAccess')} {' '}
              <Link href="/client-login">
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                  {t('connectHere')}
                </span>
              </Link>
            </p>
          </div>

          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mt-6">
            <p className="text-xs text-gray-400 text-center">
              {t('secureAccess')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}