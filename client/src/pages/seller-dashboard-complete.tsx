import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  AlertCircle,
  User,
  Wallet,
  Settings,
  MessageSquare,
  Edit
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface AssignedClient {
  id: number;
  email: string;
  fullName?: string;
  amount: number;
  balances: Record<string, number>;
  taxStatus: 'paid' | 'pending' | 'overdue' | 'exempt';
  taxRate: number;
  kycCompleted: boolean;
  lastConnection?: string;
}

interface SellerDashboardData {
  seller: {
    id: number;
    email: string;
    name?: string;
  };
  assignedClients: AssignedClient[];
  totalPortfolioValue: number;
  totalCommissions: number;
  taxCollectionRate: number;
}

export default function SellerDashboardComplete() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<AssignedClient | null>(null);
  const [editingAmount, setEditingAmount] = useState<{ clientId: number; amount: string } | null>(null);
  const [paymentMessage, setPaymentMessage] = useState('');

  // Logout function
  const handleLogout = async () => {
    try {
      await fetch('/api/seller/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      // Clear cache and redirect to login
      queryClient.clear();
      window.location.href = '/seller';
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if API call fails
      window.location.href = '/seller';
    }
  };

  // Fetch seller dashboard data
  const { data: dashboardData, isLoading, error } = useQuery<SellerDashboardData>({
    queryKey: ['/api/seller/dashboard'],
    retry: 3,
  });

  // Update client amount mutation
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
      toast({
        title: 'Succès',
        description: 'Montant mis à jour avec succès',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le montant',
        variant: 'destructive',
      });
    },
  });

  // Send payment message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ clientId, message }: { clientId: number; message: string }) => {
      const response = await fetch(`/api/seller/client/${clientId}/payment-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setPaymentMessage('');
      setSelectedClient(null);
      toast({
        title: 'Message envoyé',
        description: 'Le message de paiement a été envoyé au client',
      });
    },
    onError: () => {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer le message',
        variant: 'destructive',
      });
    },
  });

  const handleUpdateAmount = () => {
    if (editingAmount) {
      const amount = parseFloat(editingAmount.amount);
      if (!isNaN(amount) && amount > 0) {
        updateAmountMutation.mutate({
          clientId: editingAmount.clientId,
          amount,
        });
      }
    }
  };

  const handleSendPaymentMessage = () => {
    if (selectedClient && paymentMessage.trim()) {
      sendMessageMutation.mutate({
        clientId: selectedClient.id,
        message: paymentMessage,
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTaxStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'overdue': return 'bg-red-500';
      case 'exempt': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getTaxStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Payé';
      case 'pending': return 'En attente';
      case 'overdue': return 'En retard';
      case 'exempt': return 'Exempté';
      default: return 'Inconnu';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement du tableau de bord vendeur...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur d'accès</CardTitle>
            <CardDescription>
              Impossible de charger le tableau de bord vendeur. Veuillez vous reconnecter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/seller'} className="w-full">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Aucune donnée</CardTitle>
            <CardDescription>
              Aucun client assigné trouvé. Contactez l'administrateur.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/api/placeholder/120/40" 
                alt="Ledger"
                className="h-8 w-auto"
              />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Dashboard Vendeur
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {dashboardData.seller.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              Déconnexion
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clients Assignés</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.assignedClients.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valeur Portfolio Total</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalPortfolioValue)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Commissions Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalCommissions)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux Collection Taxes</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.taxCollectionRate.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList>
            <TabsTrigger value="clients">Gestion Clients</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Clients Assignés</CardTitle>
                <CardDescription>
                  Gérez les portfolios et les paiements de vos clients assignés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.assignedClients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{client.fullName || client.email}</p>
                          <p className="text-sm text-gray-500">{client.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(client.amount)}</p>
                          <Badge className={getTaxStatusColor(client.taxStatus)}>
                            {getTaxStatusText(client.taxStatus)}
                          </Badge>
                        </div>

                        <div className="flex space-x-2">
                          {editingAmount?.clientId === client.id ? (
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                value={editingAmount.amount}
                                onChange={(e) => setEditingAmount({
                                  ...editingAmount,
                                  amount: e.target.value
                                })}
                                className="w-32"
                                placeholder="Nouveau montant"
                              />
                              <Button
                                size="sm"
                                onClick={handleUpdateAmount}
                                disabled={updateAmountMutation.isPending}
                              >
                                {updateAmountMutation.isPending ? 'Mise à jour...' : 'Confirmer'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingAmount(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingAmount({
                                  clientId: client.id,
                                  amount: client.amount.toString()
                                })}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setSelectedClient(client)}
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages">
            <Card>
              <CardHeader>
                <CardTitle>Messages de Paiement</CardTitle>
                <CardDescription>
                  Envoyez des messages aux clients concernant leurs paiements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedClient ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="font-medium">Client sélectionné:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedClient.fullName || selectedClient.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Message de paiement
                      </label>
                      <textarea
                        value={paymentMessage}
                        onChange={(e) => setPaymentMessage(e.target.value)}
                        className="w-full h-32 p-3 border rounded-lg resize-none"
                        placeholder="Rédigez votre message concernant le paiement..."
                      />
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        onClick={handleSendPaymentMessage}
                        disabled={!paymentMessage.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? 'Envoi...' : 'Envoyer Message'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedClient(null);
                          setPaymentMessage('');
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">
                    Sélectionnez un client dans l'onglet "Gestion Clients" pour envoyer un message.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Paramètres Vendeur</CardTitle>
                <CardDescription>
                  Gérez vos préférences et paramètres de compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-4">Informations du Compte</h3>
                    <div className="space-y-2">
                      <p><strong>Email:</strong> {dashboardData.seller.email}</p>
                      <p><strong>Nom:</strong> {dashboardData.seller.name || 'Non défini'}</p>
                      <p><strong>Clients assignés:</strong> {dashboardData.assignedClients.length}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-4">Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start">
                        <Settings className="h-4 w-4 mr-2" />
                        Modifier le profil
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Historique des messages
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}