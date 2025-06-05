import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Percent, DollarSign, Bitcoin, Coins, Shield } from "lucide-react";
import type { Client } from "@shared/schema";

interface ClientTaxPercentageProps {
  client: Client;
}

export default function ClientTaxPercentage({ client }: ClientTaxPercentageProps) {
  const [taxForm, setTaxForm] = useState({
    percentage: 5.0,
    currency: 'USDT',
    reason: 'Frais de récupération obligatoires'
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
        description: `Taxe de ${taxForm.percentage}% en ${taxForm.currency} configurée pour ${client.email}`,
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
    
    if (!taxForm.percentage || taxForm.percentage <= 0) {
      toast({
        title: "Erreur",
        description: "Le pourcentage doit être supérieur à 0",
        variant: "destructive",
      });
      return;
    }

    const walletKey = `${taxForm.currency.toLowerCase()}Wallet`;
    const walletAddress = walletsData?.[walletKey];
    
    if (!walletAddress) {
      toast({
        title: "Erreur",
        description: `Wallet ${taxForm.currency} non configuré`,
        variant: "destructive",
      });
      return;
    }

    setTaxMutation.mutate({
      percentage: taxForm.percentage,
      currency: taxForm.currency,
      walletAddress,
      reason: taxForm.reason
    });
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
      case 'paid':
        return <Badge variant="default" className="bg-green-600">Payé</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-orange-500">En vérification</Badge>;
      case 'exempted':
        return <Badge variant="outline" className="border-blue-500 text-blue-500">Exempté</Badge>;
      default:
        return <Badge variant="outline">Aucune</Badge>;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Gestion des Taxes - {client.fullName || client.email}
          </div>
          {taxStatus && getStatusBadge(taxStatus.status)}
        </CardTitle>
        <CardDescription className="text-gray-300">
          Configurer le pourcentage de taxe de récupération pour ce client
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
                <Label className="text-gray-400">Pourcentage</Label>
                <div className="flex items-center gap-2 text-white">
                  <Percent className="h-4 w-4" />
                  <span className="font-mono">{taxStatus.taxPercentage}%</span>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-400">Devise de paiement</Label>
                <div className="flex items-center gap-2 text-white">
                  {getCurrencyIcon(taxStatus.currency)}
                  <span>{taxStatus.currency}</span>
                </div>
              </div>

              {taxStatus.taxAmount && (
                <div>
                  <Label className="text-gray-400">Montant calculé</Label>
                  <div className="text-white font-mono">
                    {parseFloat(taxStatus.taxAmount).toFixed(2)} €
                  </div>
                </div>
              )}

              {taxStatus.portfolioValue && (
                <div>
                  <Label className="text-gray-400">Valeur portfolio</Label>
                  <div className="text-white font-mono">
                    {parseFloat(taxStatus.portfolioValue).toFixed(2)} €
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Percent className="h-4 w-4 mr-2" />
                {taxStatus?.status === 'none' ? 'Configurer Taxe' : 'Modifier Taxe'}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-800 border-gray-700 text-white">
              <DialogHeader>
                <DialogTitle>Configuration Taxe - {client.email}</DialogTitle>
                <DialogDescription className="text-gray-300">
                  Définir le pourcentage de taxe appliqué sur le portfolio total du client
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percentage" className="text-gray-300">Pourcentage de taxe (%)</Label>
                    <Input
                      id="percentage"
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="50"
                      value={taxForm.percentage}
                      onChange={(e) => setTaxForm({ ...taxForm, percentage: parseFloat(e.target.value) || 0 })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="5.0"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Appliqué sur la valeur totale du portfolio
                    </p>
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
                
                <div>
                  <Label htmlFor="reason" className="text-gray-300">Motif</Label>
                  <Input
                    id="reason"
                    value={taxForm.reason}
                    onChange={(e) => setTaxForm({ ...taxForm, reason: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Frais de récupération obligatoires"
                    required
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={setTaxMutation.isPending}>
                    {setTaxMutation.isPending ? 'Configuration...' : 'Configurer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {taxStatus?.status !== 'exempted' && taxStatus?.status !== 'none' && (
            <Button 
              variant="outline" 
              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
              onClick={() => exemptTaxMutation.mutate()}
              disabled={exemptTaxMutation.isPending}
            >
              <Shield className="h-4 w-4 mr-2" />
              {exemptTaxMutation.isPending ? 'Exemption...' : 'Exempter'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}