import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const handleClientAccess = () => {
    setLocation('/client');
  };

  const handleAdminAccess = () => {
    setLocation('/admin');
  };

  const handleRecoveryDemo = () => {
    setLocation('/ledger');
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

        {/* Options d'accès */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Accès Client */}
          <Card className="bg-[#1E1F23] border-[#3A3B3F] hover:bg-[#252629] transition-colors cursor-pointer" onClick={handleClientAccess}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#00D4AA] rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={28} className="text-white" />
              </div>
              <CardTitle className="text-white text-xl">Espace Client</CardTitle>
              <CardDescription className="text-gray-400">
                Accédez à votre portefeuille et suivez vos récupérations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#00D4AA]" />
                  Suivi des demandes en temps réel
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#00D4AA]" />
                  Historique des récupérations
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#00D4AA]" />
                  Support client 24/7
                </div>
              </div>
              <Button className="w-full bg-[#00D4AA] hover:bg-[#00C299] text-white">
                Se connecter
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Démo: client@demo.com / demo123
              </p>
            </CardContent>
          </Card>

          {/* Accès Admin */}
          <Card className="bg-[#1E1F23] border-[#3A3B3F] hover:bg-[#252629] transition-colors cursor-pointer" onClick={handleAdminAccess}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#FFB800] rounded-full flex items-center justify-center mx-auto mb-4">
                <Settings size={28} className="text-[#17181C]" />
              </div>
              <CardTitle className="text-white text-xl">Administration</CardTitle>
              <CardDescription className="text-gray-400">
                Gestion des clients et supervision des opérations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FFB800]" />
                  Tableau de bord analytique
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FFB800]" />
                  Gestion des validations KYC
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FFB800]" />
                  Rapports de conformité
                </div>
              </div>
              <Button className="w-full bg-[#FFB800] hover:bg-[#E6A600] text-[#17181C]">
                Accès admin
                <ArrowRight size={16} className="ml-2" />
              </Button>
              <p className="text-xs text-gray-500 text-center">
                Démo: admin@ledger.com / admin123
              </p>
            </CardContent>
          </Card>

          {/* Interface de récupération */}
          <Card className="bg-[#1E1F23] border-[#FF6B00] hover:bg-[#252629] transition-colors cursor-pointer" onClick={handleRecoveryDemo}>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-[#FF6B00] rounded-full flex items-center justify-center mx-auto mb-4">
                <Star size={28} className="text-white" />
              </div>
              <CardTitle className="text-white text-xl">Centre de Récupération</CardTitle>
              <CardDescription className="text-gray-400">
                Interface principale des services de récupération
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className="w-full justify-center bg-[#FF6B00] text-white border-none">
                Accès Direct - Aucune connexion requise
              </Badge>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FF6B00]" />
                  Récupération de wallets
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FF6B00]" />
                  Restauration seed phrases
                </div>
                <div className="flex items-center gap-2 text-gray-300 text-sm">
                  <CheckCircle size={16} className="text-[#FF6B00]" />
                  Récupération mots de passe
                </div>
              </div>
              <Button className="w-full bg-[#FF6B00] hover:bg-[#E55A00] text-white">
                Accéder maintenant
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Statistiques */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFB800]">98.5%</div>
            <div className="text-gray-400 text-sm">Taux de succès</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#00D4AA]">2500+</div>
            <div className="text-gray-400 text-sm">Clients satisfaits</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B00]">24-72h</div>
            <div className="text-gray-400 text-sm">Délai moyen</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-white">24/7</div>
            <div className="text-gray-400 text-sm">Support disponible</div>
          </div>
        </div>
      </div>
    </div>
  );
}