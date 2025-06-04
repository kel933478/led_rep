import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const passwordRecoverySchema = z.object({
  email: z.string().email("Adresse email invalide"),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requis"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type PasswordRecoveryForm = z.infer<typeof passwordRecoverySchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

interface PasswordRecoveryProps {
  userType: 'client' | 'admin';
  onBack: () => void;
}

export default function PasswordRecovery({ userType, onBack }: PasswordRecoveryProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'request' | 'reset' | 'success'>('request');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');

  const requestForm = useForm<PasswordRecoveryForm>({
    resolver: zodResolver(passwordRecoverySchema),
    defaultValues: { email: "" },
  });

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token: "", password: "", confirmPassword: "" },
  });

  const onRequestSubmit = async (data: PasswordRecoveryForm) => {
    setIsLoading(true);
    setEmail(data.email);

    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: data.email, 
          userType 
        }),
      });

      if (response.ok) {
        setStep('reset');
        toast({
          title: "Email envoyé",
          description: "Vérifiez votre boîte mail pour le lien de réinitialisation",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de l'envoi de l'email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: data.token,
          password: data.password,
          userType
        }),
      });

      if (response.ok) {
        setStep('success');
        toast({
          title: "Mot de passe réinitialisé",
          description: "Votre mot de passe a été mis à jour avec succès",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Erreur lors de la réinitialisation",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-gray-800">
        <CardHeader className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <CardTitle className="text-2xl text-white">
              {step === 'request' && 'Récupération du mot de passe'}
              {step === 'reset' && 'Nouveau mot de passe'}
              {step === 'success' && 'Réinitialisation réussie'}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {step === 'request' && (
            <>
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  Entrez votre adresse email pour recevoir un lien de réinitialisation
                </AlertDescription>
              </Alert>

              <Form {...requestForm}>
                <form onSubmit={requestForm.handleSubmit(onRequestSubmit)} className="space-y-4">
                  <FormField
                    control={requestForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Adresse email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="votre@email.com"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {step === 'reset' && (
            <>
              <Alert>
                <Mail className="w-4 h-4" />
                <AlertDescription>
                  Un email a été envoyé à {email}. Copiez le token depuis l'email et définissez votre nouveau mot de passe.
                </AlertDescription>
              </Alert>

              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4">
                  <FormField
                    control={resetForm.control}
                    name="token"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Token de réinitialisation</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Token depuis l'email"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Nouveau mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Minimum 8 caractères"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-200">Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            placeholder="Répétez le mot de passe"
                            className="bg-gray-800 border-gray-700 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-white">
                  Mot de passe réinitialisé !
                </h3>
                <p className="text-gray-400">
                  Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
                </p>
              </div>
              <Button onClick={onBack} className="w-full bg-blue-600 hover:bg-blue-700">
                Retour à la connexion
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}