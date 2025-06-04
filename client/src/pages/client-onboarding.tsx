import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Upload, Check } from "lucide-react";

export default function ClientOnboarding() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [amount, setAmount] = useState([50000]);

  const onboardingMutation = useMutation({
    mutationFn: clientApi.completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: t('success'),
        description: t('onboardingSuccess'),
      });
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: t('fileUploadError'),
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: t('error'),
          description: t('fileTooLarge'),
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: t('error'),
        description: "Veuillez télécharger un document KYC",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('kycFile', selectedFile);
    formData.append('amount', amount[0].toString());

    onboardingMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto py-12 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('onboardingTitle')}</h1>
          <p className="text-muted-foreground">{t('onboardingSubtitle')}</p>
        </div>

        <Card className="bg-card border-border ledger-shadow">
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* KYC Upload */}
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('kycTitle')}</h2>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="kyc-file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  {!selectedFile ? (
                    <label htmlFor="kyc-file" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">{t('uploadDocument')}</p>
                      <p className="text-sm text-muted-foreground">{t('fileRequirements')}</p>
                    </label>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <Check className="w-6 h-6 text-green-400" />
                      <span className="text-green-400 font-medium">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Amount Slider */}
              <div>
                <h2 className="text-xl font-semibold mb-4">{t('amountTitle')}</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0 €</span>
                    <span>250 000 €</span>
                  </div>
                  <Slider
                    value={amount}
                    onValueChange={setAmount}
                    max={250000}
                    step={1000}
                    className="w-full"
                  />
                  <div className="text-center">
                    <span className="text-2xl font-bold text-primary">
                      {amount[0].toLocaleString()} €
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-600 hover:shadow-lg"
                disabled={onboardingMutation.isPending}
              >
                {onboardingMutation.isPending ? t('loading') : t('completeSetup')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
