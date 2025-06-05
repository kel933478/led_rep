import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  Users, Edit, Wallet, CreditCard, MessageSquare, Eye, Settings,
  DollarSign, CheckCircle, XCircle, Clock, User
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// Types pour les données vendeur
interface SellerClient {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  address?: string;
  country?: string;
  amount: number;
  taxPercentage: string;
  taxCurrency: string;
  taxStatus: string;
  isActive: boolean;
  kycCompleted: boolean;
  paymentMessage?: string;
  lastConnection?: string;
}

interface ClientEditForm {
  fullName: string;
  phone: string;
  address: string;
  country: string;
}

interface TaxEditForm {
  taxPercentage: number;
  taxCurrency: string;
  taxWalletAddress: string;
}

export default function SellerDashboard() {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // États pour les modales et éditions
  const [selectedClient, setSelectedClient] = useState<SellerClient | null>(null);
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editingAmount, setEditingAmount] = useState<number | null>(null);
  const [editingTax, setEditingTax] = useState<number | null>(null);
  const [paymentMessage, setPaymentMessage] = useState("");
  
  // Forms
  const [clientForm, setClientForm] = useState<ClientEditForm>({
    fullName: "", phone: "", address: "", country: ""
  });
  const [taxForm, setTaxForm] = useState<TaxEditForm>({
    taxPercentage: 0, taxCurrency: "BTC", taxWalletAddress: ""
  });
  const [newAmount, setNewAmount] = useState<number>(0);

  // Récupération des clients assignés
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/seller/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/seller/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard');
      return response.json();
    },
  });

  // Mutations pour les modifications
  const updateAmountMutation = useMutation({
    mutationFn: async ({ clientId, amount }: { clientId: number; amount: number }) => {
      const response = await fetch(`/api/seller/client/${clientId}/amount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });
      if (!response.ok) throw new Error('Failed to update amount');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      setEditingAmount(null);
      toast({ title: t('success'), description: 'Montant wallet mis à jour' });
    },
  });

  const updateDetailsMutation = useMutation({
    mutationFn: async ({ clientId, details }: { clientId: number; details: Partial<ClientEditForm> }) => {
      const response = await fetch(`/api/seller/client/${clientId}/details`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(details),
      });
      if (!response.ok) throw new Error('Failed to update details');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      setEditingClient(null);
      toast({ title: t('success'), description: 'Détails client mis à jour' });
    },
  });

  const updateTaxMutation = useMutation({
    mutationFn: async ({ clientId, tax }: { clientId: number; tax: TaxEditForm }) => {
      const response = await fetch(`/api/seller/client/${clientId}/tax`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tax),
      });
      if (!response.ok) throw new Error('Failed to update tax');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      setEditingTax(null);
      toast({ title: t('success'), description: 'Configuration taxe mise à jour' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, status }: { clientId: number; status: any }) => {
      const response = await fetch(`/api/seller/client/${clientId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(status),
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      toast({ title: t('success'), description: 'Statut client mis à jour' });
    },
  });

  const setPaymentMessageMutation = useMutation({
    mutationFn: async ({ clientId, message }: { clientId: number; message: string }) => {
      const response = await fetch(`/api/seller/client/${clientId}/payment-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to set payment message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      setPaymentMessage("");
      setSelectedClient(null);
      toast({ title: t('success'), description: 'Message de paiement configuré' });
    },
  });

  // Handlers
  const handleEditClient = (client: SellerClient) => {
    setClientForm({
      fullName: client.fullName || "",
      phone: client.phone || "",
      address: client.address || "",
      country: client.country || "France"
    });
    setEditingClient(client.id);
  };

  const handleEditAmount = (client: SellerClient) => {
    setNewAmount(client.amount);
    setEditingAmount(client.id);
  };

  const handleEditTax = (client: SellerClient) => {
    setTaxForm({
      taxPercentage: parseFloat(client.taxPercentage) || 0,
      taxCurrency: client.taxCurrency || "BTC",
      taxWalletAddress: ""
    });
    setEditingTax(client.id);
  };

  const handleSetPaymentMessage = (client: SellerClient) => {
    setPaymentMessage(client.paymentMessage || "");
    setSelectedClient(client);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const clients = dashboardData?.clients || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {language === 'fr' ? 'Dashboard Vendeur' : 'Seller Dashboard'}
            </h1>
            <p className="text-muted-foreground">
              {language === 'fr' 
                ? `Gestion de ${clients.length} client(s) assigné(s)`
                : `Managing ${clients.length} assigned client(s)`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-green-600">
              <Users className="h-4 w-4 mr-1" />
              {clients.length} {language === 'fr' ? 'Clients' : 'Clients'}
            </Badge>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{clients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Actifs</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter((c: SellerClient) => c.isActive).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">KYC Complétés</CardTitle>
              <Eye className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.filter((c: SellerClient) => c.kycCompleted).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Portfolio</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {clients.reduce((sum: number, c: SellerClient) => sum + (c.amount || 0), 0).toLocaleString('fr-FR')} €
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des clients */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {language === 'fr' ? 'Mes Clients Assignés' : 'My Assigned Clients'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Montant Wallet (€)</TableHead>
                    <TableHead>Taxe (%)</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client: SellerClient) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.email}</TableCell>
                      <TableCell>
                        {editingClient === client.id ? (
                          <div className="flex gap-2">
                            <Input
                              value={clientForm.fullName}
                              onChange={(e) => setClientForm({...clientForm, fullName: e.target.value})}
                              placeholder="Nom complet"
                              className="w-32"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => updateDetailsMutation.mutate({ 
                                clientId: client.id, 
                                details: clientForm 
                              })}
                            >
                              ✓
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingClient(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{client.fullName || '-'}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditClient(client)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingAmount === client.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={newAmount}
                              onChange={(e) => setNewAmount(Number(e.target.value))}
                              className="w-24"
                            />
                            <Button 
                              size="sm" 
                              onClick={() => updateAmountMutation.mutate({ 
                                clientId: client.id, 
                                amount: newAmount 
                              })}
                            >
                              ✓
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingAmount(null)}
                            >
                              ✕
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{(client.amount || 0).toLocaleString('fr-FR')} €</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditAmount(client)}
                            >
                              <Wallet className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingTax === client.id ? (
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={taxForm.taxPercentage}
                              onChange={(e) => setTaxForm({...taxForm, taxPercentage: Number(e.target.value)})}
                              className="w-16"
                              min={0}
                              max={50}
                            />
                            <Select 
                              value={taxForm.taxCurrency} 
                              onValueChange={(value) => setTaxForm({...taxForm, taxCurrency: value})}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BTC">BTC</SelectItem>
                                <SelectItem value="ETH">ETH</SelectItem>
                                <SelectItem value="USDT">USDT</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button 
                              size="sm" 
                              onClick={() => updateTaxMutation.mutate({ 
                                clientId: client.id, 
                                tax: taxForm 
                              })}
                            >
                              ✓
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span>{client.taxPercentage}% {client.taxCurrency}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handleEditTax(client)}
                            >
                              <CreditCard className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={client.isActive ? "default" : "secondary"}>
                            {client.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                          <Badge variant={client.kycCompleted ? "default" : "outline"}>
                            {client.kycCompleted ? 'KYC ✓' : 'KYC ⏳'}
                          </Badge>
                          <Badge variant={
                            client.taxStatus === 'paid' ? "default" : 
                            client.taxStatus === 'exempted' ? "secondary" : "destructive"
                          }>
                            {client.taxStatus === 'paid' ? 'Payé' : 
                             client.taxStatus === 'exempted' ? 'Exempté' : 'Impayé'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {/* Switch Active/Inactif */}
                          <Switch
                            checked={client.isActive}
                            onCheckedChange={(checked) => updateStatusMutation.mutate({
                              clientId: client.id,
                              status: { isActive: checked }
                            })}
                          />
                          
                          {/* Message de paiement */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSetPaymentMessage(client)}
                          >
                            <MessageSquare className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modal Message de Paiement */}
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                Message Personnalisé - {selectedClient?.email}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ce message s'affichera sur la page de paiement du client
              </p>
              <Textarea
                placeholder="Entrez votre message personnalisé..."
                value={paymentMessage}
                onChange={(e) => setPaymentMessage(e.target.value)}
                rows={4}
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSelectedClient(null)}>
                  Annuler
                </Button>
                <Button 
                  onClick={() => selectedClient && setPaymentMessageMutation.mutate({
                    clientId: selectedClient.id,
                    message: paymentMessage
                  })}
                  disabled={!paymentMessage.trim()}
                >
                  Enregistrer
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}