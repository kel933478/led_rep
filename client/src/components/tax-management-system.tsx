import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { admin } from '@/lib/api';
import { 
  Receipt, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Wallet,
  Calculator,
  Clock,
  Shield
} from 'lucide-react';

interface TaxFormData {
  amount: number;
  currency: string;
  walletAddress: string;
  reason: string;
}

interface TaxManagementProps {
  client: any;
  onClose: () => void;
}

const SUPPORTED_CURRENCIES = [
  { value: 'BTC', label: 'Bitcoin (BTC)', icon: '₿' },
  { value: 'ETH', label: 'Ethereum (ETH)', icon: 'Ξ' },
  { value: 'USDT', label: 'Tether (USDT)', icon: '$' }
];

export default function TaxManagementSystem({ client, onClose }: TaxManagementProps) {
  const [taxForm, setTaxForm] = useState<TaxFormData>({
    amount: client.taxAmount || 0,
    currency: client.taxCurrency || 'BTC',
    walletAddress: client.taxWalletAddress || '',
    reason: ''
  });
  const { toast } = useToast();

  const setTaxMutation = useMutation({
    mutationFn: (data: any) => admin.setClientTax(client.id, data),
    onSuccess: () => {
      toast({
        title: "Taxe configurée",
        description: "La taxe de récupération a été configurée avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la configuration de la taxe",
        variant: "destructive",
      });
    }
  });

  const exemptTaxMutation = useMutation({
    mutationFn: () => admin.exemptClientTax(client.id),
    onSuccess: () => {
      toast({
        title: "Exemption accordée",
        description: "Le client a été exempté de la taxe de récupération",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin'] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'exemption de la taxe",
        variant: "destructive",
      });
    }
  });

  const handleSetTax = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taxForm.amount || !taxForm.walletAddress || !taxForm.reason) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    await setTaxMutation.mutateAsync({
      amount: taxForm.amount,
      currency: taxForm.currency,
      walletAddress: taxForm.walletAddress,
      reason: taxForm.reason
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="secondary" className="bg-red-500 text-white"><AlertTriangle size={12} className="mr-1" />Non payée</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-500 text-white"><CheckCircle size={12} className="mr-1" />Payée</Badge>;
      case 'exempted':
        return <Badge variant="secondary" className="bg-blue-500 text-white"><Shield size={12} className="mr-1" />Exemptée</Badge>;
      default:
        return <Badge variant="outline">Aucune</Badge>;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    const curr = SUPPORTED_CURRENCIES.find(c => c.value === currency);
    return curr?.icon || '$';
  };

  return (
    <div className="space-y-6">
      {/* Statut actuel */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Taxe de Récupération - {client.email}
          </CardTitle>
          <CardDescription className="text-gray-300">
            Gestion de la taxe obligatoire pour la récupération des fonds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <DollarSign className="h-8 w-8 text-[#FFB800] mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {getCurrencyIcon(client.taxCurrency)} {client.taxAmount || '0'}
              </div>
              <div className="text-gray-400 text-sm">{client.taxCurrency || 'Aucune devise'}</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <Clock className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-medium text-white">Statut</div>
              <div className="mt-1">{getStatusBadge(client.taxStatus || 'unpaid')}</div>
            </div>
            <div className="text-center p-4 bg-gray-700 rounded-lg">
              <Wallet className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-medium text-white">Wallet</div>
              <div className="text-gray-400 text-xs mt-1 truncate">
                {client.taxWalletAddress || 'Non configuré'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration de la taxe */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Configurer la Taxe
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetTax} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-gray-300">Montant de la taxe *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.000001"
                  value={taxForm.amount}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="0.001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Devise de paiement *</Label>
                <Select value={taxForm.currency} onValueChange={(value) => setTaxForm(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sélectionnez la devise" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {SUPPORTED_CURRENCIES.map(currency => (
                      <SelectItem key={currency.value} value={currency.value} className="text-white">
                        <span className="flex items-center gap-2">
                          <span className="font-mono">{currency.icon}</span>
                          {currency.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="walletAddress" className="text-gray-300">Adresse de réception *</Label>
              <Input
                id="walletAddress"
                value={taxForm.walletAddress}
                onChange={(e) => setTaxForm(prev => ({ ...prev, walletAddress: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
              />
              <p className="text-xs text-gray-400">
                Adresse {taxForm.currency} où le client devra envoyer la taxe
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason" className="text-gray-300">Motif de la taxe *</Label>
              <Textarea
                id="reason"
                value={taxForm.reason}
                onChange={(e) => setTaxForm(prev => ({ ...prev, reason: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
                placeholder="Frais de récupération et traitement administratif..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={setTaxMutation.isPending}
                className="bg-[#FFB800] hover:bg-[#FFB800]/90 text-black flex-1"
              >
                {setTaxMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Configuration...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Configurer la taxe
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => exemptTaxMutation.mutate()}
                disabled={exemptTaxMutation.isPending}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                {exemptTaxMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Exemption...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Exempter
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Informations importantes */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Informations Importantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#FFB800] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm">
              La taxe doit être payée avant toute récupération ou retrait de fonds
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#FFB800] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm">
              Le client recevra automatiquement les instructions de paiement
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-[#FFB800] rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm">
              Une fois la taxe payée et vérifiée, les fonds pourront être libérés
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-gray-300 text-sm">
              L'exemption supprime définitivement l'obligation de taxe pour ce client
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}