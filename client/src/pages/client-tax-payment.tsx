import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CreditCard, AlertTriangle, CheckCircle, Euro, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function ClientTaxPayment() {
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/client/dashboard'],
    queryFn: clientApi.getDashboard,
  });

  const handlePayment = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    alert("Paiement effectué avec succès!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const { client, taxRate } = dashboardData || {};
  const taxAmount = client ? (client.amount * (taxRate || 15)) / 100 : 0;

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/client/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour au Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Paiement des Taxes</h1>
        </div>

        {/* Tax Information */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Euro className="w-5 h-5 mr-2 text-blue-400" />
              Informations Fiscales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Valeur du Portfolio</p>
                <p className="text-white text-xl font-bold">{client?.amount?.toLocaleString()} €</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Taux de Taxe</p>
                <p className="text-white text-xl font-bold">{taxRate || 15}%</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Montant à Payer</p>
                <p className="text-blue-400 text-xl font-bold">{taxAmount?.toLocaleString()} €</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-orange-400" />
                Statut du Paiement
              </span>
              <Badge className="bg-orange-600 text-white">En Attente</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-orange-900/20 border border-orange-600 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-orange-200 font-medium">Paiement Requis</p>
                  <p className="text-orange-300 text-sm mt-1">
                    Votre paiement de taxes est en attente. Veuillez procéder au paiement pour maintenir votre compte en règle.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Date d'échéance:</span>
                <span className="text-white">31 Décembre 2024</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Méthode de paiement:</span>
                <span className="text-white">Virement bancaire</span>
              </div>
              <div className="flex justify-between items-center font-semibold">
                <span className="text-gray-400">Total à payer:</span>
                <span className="text-blue-400 text-lg">{taxAmount?.toLocaleString()} €</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-green-400" />
              Procéder au Paiement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-gray-800 p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Coordonnées Bancaires</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Bénéficiaire:</span>
                  <span className="text-white">Ledger Recovery Services</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">IBAN:</span>
                  <span className="text-white font-mono">FR76 1234 5678 9012 3456 7890 123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">BIC:</span>
                  <span className="text-white font-mono">EXAMPLE123</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Référence:</span>
                  <span className="text-white font-mono">TAX-{client?.email?.replace('@', '-')}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Traitement...
                  </div>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Confirmer le Paiement
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-gray-600 text-white">
                Télécharger la Facture
              </Button>
            </div>

            <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
              <p className="text-blue-200 text-sm">
                <strong>Note:</strong> Une fois le paiement effectué, il peut prendre jusqu'à 2-3 jours ouvrables pour être traité. 
                Vous recevrez une confirmation par email.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}