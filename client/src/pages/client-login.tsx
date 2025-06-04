import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clientLoginSchema } from "@shared/schema";
import { authApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import type { z } from "zod";

type LoginForm = z.infer<typeof clientLoginSchema>;

export default function ClientLogin() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoginForm>({
    resolver: zodResolver(clientLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: authApi.clientLogin,
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
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center ledger-shadow">
              <span className="text-primary-foreground font-bold text-2xl">L</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">{t('welcomeTitle')}</h2>
          <p className="text-muted-foreground">{t('welcomeSubtitle')}</p>
        </div>

        <Card className="bg-card/80 backdrop-blur-lg border-border ledger-shadow">
          <CardHeader>
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="client">{t('clientSpace')}</TabsTrigger>
                <TabsTrigger value="admin" asChild>
                  <Link href="/admin">{t('adminSpace')}</Link>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('email')}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="votre@email.com"
                          className="bg-muted border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('password')}</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          className="bg-muted border-border"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? t('loading') : t('login')}
                </Button>
              </form>
            </Form>

            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-600/30 rounded-lg">
              <p className="text-sm text-blue-300 mb-2">{t('demoCredentials')}</p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div><strong>Client:</strong> client@demo.com / demo123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
