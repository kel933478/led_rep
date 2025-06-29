import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/use-language";
import { 
  Shield, 
  Users, 
  Settings, 
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react";

export default function LedgerAccess() {
  const [_, setLocation] = useLocation();
  const { t } = useLanguage();

  const handleRecoveryDemo = () => {
    setLocation('/recovery');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#17181C] to-[#2A2B2F] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* En-tête */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#FFB800] rounded-lg flex items-center justify-center">
              <Shield size={24} className="text-[#17181C]" />
            </div>
            <h1 className="text-3xl font-bold text-white">
              Ledger Récupération
            </h1>
          </div>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Centre professionnel de récupération de cryptomonnaies. 
            Accédez à votre espace ou découvrez nos services de récupération sécurisés.
          </p>
        </div>

        {/* Interface de récupération centralisée */}
        <div className="max-w-md mx-auto">
          <Card className="bg-[#1E1F23] border-[#FF6B00] hover:bg-[#252629] transition-colors cursor-pointer" onClick={handleRecoveryDemo}>
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-6">
                <Star size={32} className="text-white" />
              </div>
              <CardTitle className="text-white text-2xl mb-2">Centre de Récupération</CardTitle>
              <CardDescription className="text-gray-400 text-lg">
                Récupérez vos cryptomonnaies perdues de manière sécurisée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Badge className="w-full justify-center bg-[#FF6B00] text-white border-none py-2 text-sm">
                Accès Direct - Aucune connexion requise
              </Badge>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle size={18} className="text-[#FF6B00]" />
                  <span>Récupération de wallets corrompus</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle size={18} className="text-[#FF6B00]" />
                  <span>Restauration de phrases de récupération</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle size={18} className="text-[#FF6B00]" />
                  <span>Récupération de mots de passe oubliés</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <CheckCircle size={18} className="text-[#FF6B00]" />
                  <span>Support technique 24/7</span>
                </div>
              </div>
              <Button className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white py-3 text-lg">
                Commencer la récupération
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Accès rapides */}
        <div className="mt-12 flex justify-center gap-6">
          <Button 
            variant="outline" 
            onClick={() => setLocation('/client')}
            className="border-[#00D4AA] text-[#00D4AA] hover:bg-[#00D4AA] hover:text-white"
          >
            <Users size={16} className="mr-2" />
{t('clientAccess')}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation('/admin')}
            className="border-[#FFB800] text-[#FFB800] hover:bg-[#FFB800] hover:text-[#17181C]"
          >
            <Settings size={16} className="mr-2" />
{t('administration')}
          </Button>
        </div>

        {/* Statistiques */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFB800]">98.5%</div>
            <div className="text-gray-400 text-sm">{t('successRate')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00D4AA]">2500+</div>
            <div className="text-gray-400 text-sm">{t('satisfiedClients')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B00]">24-72h</div>
            <div className="text-gray-400 text-sm">{t('averageDelay')}</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">24/7</div>
            <div className="text-gray-400 text-sm">{t('supportAvailable')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}