import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import TaxPaymentSystem from '@/components/tax-payment-system';
import { useLocation } from 'wouter';
import { AlertTriangle, ArrowLeft, Shield } from 'lucide-react';

export default function TaxPayment() {
  const [_, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#17181C] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FF6B00] to-[#FF4500] p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/client/dashboard')}
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au dashboard
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <Shield size={32} className="text-[#FF6B00]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Taxe de Récupération</h1>
              <p className="text-white/80 text-lg">Paiement obligatoire pour accéder à vos fonds récupérés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {/* Alerte importante */}
        <Alert className="border-red-500 bg-red-500/10 mb-6">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">
            <strong>IMPORTANT :</strong> Cette taxe doit être payée avant toute récupération de fonds. 
            Aucun retrait ne sera possible tant que le paiement n'est pas vérifié et validé.
          </AlertDescription>
        </Alert>

        <TaxPaymentSystem />

        {/* Support */}
        <Card className="bg-gray-800 border-gray-700 mt-6">
          <CardHeader>
            <CardTitle className="text-white">Besoin d'aide ?</CardTitle>
            <CardDescription className="text-gray-300">
              Notre équipe support est disponible pour vous accompagner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Chat en direct
              </Button>
              <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                Contacter par email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}