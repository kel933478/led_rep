import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  DollarSign, 
  Settings, 
  Bitcoin, 
  Coins,
  AlertTriangle,
  CheckCircle,
  Copy,
  Shield
} from 'lucide-react';

interface Client {
  id: number;
  email: string;
  fullName?: string;
  amount?: number;
}

interface ClientTaxManagementProps {
  client: Client;
}

export default function ClientTaxManagement({ client }: ClientTaxManagementProps) {
  const [taxForm, setTaxForm] = useState({
    amount: 500,
    currency: 'USDT',
    reason: 'Frais de récupération obligatoires'
  });

  const formatEuroAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  };
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Get admin wallets configuration
  const { data: walletsData } = useQuery({
    queryKey: ['/api/admin/wallets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/wallets');
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    }
  });

  // Get current tax status for this client
  const { data: taxStatus, refetch: refetchTaxStatus } = useQuery({
    queryKey: [`/api/admin/client/${client.id}/tax-status`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/client/${client.id}/tax-status`);
      if (!response.ok) return null;
      return response.json();
    }
  });

  const setTaxMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/admin/client/${client.id}/set-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la configuration');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Taxe configurée",
        description: `Taxe de ${taxForm.amount} ${taxForm.currency} configurée pour ${client.email}`,
      });
      setIsDialogOpen(false);
      refetchTaxStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const exemptTaxMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/client/${client.id}/exempt-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Exemption accordée par admin' })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de l\'exemption');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Exemption accordée",
        description: `${client.email} a été exempté de la taxe de récupération`,
      });
      refetchTaxStatus();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taxForm.amount || taxForm.amount <= 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    // Check if wallet is configured for selected currency
    const walletKey = `${taxForm.currency.toLowerCase()}Wallet`;
    const walletAddress = walletsData?.[walletKey];
    
    if (!walletAddress) {
      toast({
        title: "Erreur",
        description: `Wallet ${taxForm.currency} non configuré. Configurez d'abord les wallets admin.`,
        variant: "destructive",
      });
      return;
    }

    setTaxMutation.mutate(taxForm);
  };

  const copyWalletAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast({
      title: "Copié",
      description: "Adresse wallet copiée dans le presse-papiers",
    });
  };

  const getWalletForCurrency = (currency: string) => {
    if (!walletsData) return null;
    const walletKey = `${currency.toLowerCase()}Wallet`;
    return walletsData[walletKey];
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC': return <Bitcoin className="h-4 w-4 text-orange-500" />;
      case 'ETH': return <Coins className="h-4 w-4 text-blue-500" />;
      case 'USDT': return <Coins className="h-4 w-4 text-green-500" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="destructive">Impayé</Badge>;
      case 'verification':
        return <Badge className="bg-yellow-600">En vérification</Badge>;
      case 'paid':
        return <Badge className="bg-green-600">Payé</Badge>;
      case 'exempt':
        return <Badge variant="outline">Exempté</Badge>;
      default:
        return <Badge variant="secondary">Non configuré</Badge>;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Gestion des Taxes - {client.fullName || client.email}
          </div>
          {taxStatus && getStatusBadge(taxStatus.status)}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Configurer ou modifier la taxe de récupération pour ce client
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Current Tax Status */}
        {taxStatus && taxStatus.status !== 'none' && (
          <div className="bg-gray-900 rounded-lg p-4 space-y-3">
            <h4 className="text-white font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Configuration Actuelle
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-400">Montant</Label>
                <div className="flex items-center gap-2 text-white">
                  {getCurrencyIcon(taxStatus.currency)}
                  <span className="font-mono">{formatEuroAmount(taxStatus.amount)} (via {taxStatus.currency})</span>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-400">Statut</Label>
                <div>{getStatusBadge(taxStatus.status)}</div>
              </div>
              
              {taxStatus.walletAddress && (
                <div className="md:col-span-2">
                  <Label className="text-gray-400">Adresse de Paiement</Label>
                  <div className="flex items-center gap-2 bg-gray-700 p-2 rounded">
                    <code className="text-green-400 font-mono text-sm flex-1">
                      {taxStatus.walletAddress}
                    </code>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyWalletAddress(taxStatus.walletAddress)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              {taxStatus.reason && (
                <div className="md:col-span-2">
                  <Label className="text-gray-400">Motif</Label>
                  <p className="text-gray-300 text-sm">{taxStatus.reason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Settings className="h-4 w-4 mr-2" />
                {taxStatus?.status === 'none' ? 'Configurer Taxe' : 'Modifier Taxe'}
              </Button>
            </DialogTrigger>
            
            <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-white">
                  Configuration de la Taxe de Récupération
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount" className="text-gray-300">Montant de la taxe</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={taxForm.amount}
                      onChange={(e) => setTaxForm({ ...taxForm, amount: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="500"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency" className="text-gray-300">Devise de paiement</Label>
                    <Select value={taxForm.currency} onValueChange={(value) => setTaxForm({ ...taxForm, currency: value })}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="BTC" disabled={!walletsData?.btcWallet}>
                          <div className="flex items-center gap-2">
                            <Bitcoin className="h-4 w-4 text-orange-500" />
                            Bitcoin (BTC)
                            {!walletsData?.btcWallet && <span className="text-red-400 text-xs">(Non configuré)</span>}
                          </div>
                        </SelectItem>
                        <SelectItem value="ETH" disabled={!walletsData?.ethWallet}>
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-blue-500" />
                            Ethereum (ETH)
                            {!walletsData?.ethWallet && <span className="text-red-400 text-xs">(Non configuré)</span>}
                          </div>
                        </SelectItem>
                        <SelectItem value="USDT" disabled={!walletsData?.usdtWallet}>
                          <div className="flex items-center gap-2">
                            <Coins className="h-4 w-4 text-green-500" />
                            USDT ERC20
                            {!walletsData?.usdtWallet && <span className="text-red-400 text-xs">(Non configuré)</span>}
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Wallet Address Preview */}
                {getWalletForCurrency(taxForm.currency) && (
                  <div className="bg-gray-900 rounded-lg p-4">
                    <Label className="text-gray-400">Adresse de réception configurée</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="bg-gray-700 p-2 rounded flex-1 text-green-400 font-mono text-sm">
                        {getWalletForCurrency(taxForm.currency)}
                      </code>
                      <Button 
                        type="button"
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyWalletAddress(getWalletForCurrency(taxForm.currency)!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="reason" className="text-gray-300">Motif de la taxe</Label>
                  <Textarea
                    id="reason"
                    value={taxForm.reason}
                    onChange={(e) => setTaxForm({ ...taxForm, reason: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Frais de récupération obligatoires"
                    rows={3}
                  />
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-yellow-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">Information</span>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    Le client devra payer cette taxe avant de pouvoir accéder à ses fonds récupérés. 
                    La devise sélectionnée détermine automatiquement l'adresse de réception.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={setTaxMutation.isPending || !getWalletForCurrency(taxForm.currency)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {setTaxMutation.isPending ? 'Configuration...' : 'Configurer la Taxe'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {taxStatus && taxStatus.status !== 'exempt' && taxStatus.status !== 'none' && (
            <Button 
              variant="outline" 
              onClick={() => exemptTaxMutation.mutate()}
              disabled={exemptTaxMutation.isPending}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              {exemptTaxMutation.isPending ? 'Exemption...' : 'Exempter de la Taxe'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}