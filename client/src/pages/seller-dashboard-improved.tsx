import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import SharedLayout from "@/components/shared-layout";
import DashboardStats from "@/components/dashboard-stats";
import DataTable from "@/components/data-table";
import QuickActions from "@/components/quick-actions";
import ActionMenu from "@/components/action-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, DollarSign, TrendingUp, MessageSquare,
  Edit, CreditCard, Settings as SettingsIcon
} from "lucide-react";

export default function SellerDashboardImproved() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/seller/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/seller/dashboard');
      if (!response.ok) throw new Error('Failed to fetch');
      return response.json();
    }
  });

  const updateAmountMutation = useMutation({
    mutationFn: async ({ clientId, amount }: { clientId: number; amount: number }) => {
      const response = await fetch(`/api/seller/client/${clientId}/amount`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      toast({ title: t('amountUpdated') });
    }
  });

  const setMessageMutation = useMutation({
    mutationFn: async ({ clientId, message }: { clientId: number; message: string }) => {
      const response = await fetch(`/api/seller/client/${clientId}/payment-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      if (!response.ok) throw new Error('Failed to set message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/seller/dashboard'] });
      toast({ title: t('messageSet') });
      setMessageText("");
      setSelectedClient(null);
    }
  });

  const handleLogout = () => {
    fetch('/api/seller/logout', { method: 'POST' })
      .then(() => window.location.href = '/seller');
  };

  if (isLoading) {
    return (
      <SharedLayout userType="seller" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
        </div>
      </SharedLayout>
    );
  }

  if (!dashboardData?.clients) {
    return (
      <SharedLayout userType="seller" onLogout={handleLogout}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-gray-400">{t('noClientsAssigned')}</p>
        </div>
      </SharedLayout>
    );
  }

  const { clients } = dashboardData;

  // Calculate seller metrics
  const totalClients = clients.length;
  const totalRevenue = clients.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const avgPortfolio = totalClients > 0 ? (totalRevenue / totalClients) : 0;
  const unpaidTaxes = clients.filter((c: any) => c.taxStatus === 'unpaid').length;

  // Quick actions for seller
  const quickActions = [
    {
      label: t('updateAmount'),
      icon: <DollarSign className="w-4 h-4" />,
      onClick: () => console.log('Quick update amount'),
      variant: 'default' as const
    },
    {
      label: t('setMessage'),
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: () => console.log('Quick set message'),
      variant: 'outline' as const
    },
    {
      label: t('configureTax'),
      icon: <CreditCard className="w-4 h-4" />,
      onClick: () => console.log('Configure tax'),
      variant: 'secondary' as const,
      badge: unpaidTaxes > 0 ? unpaidTaxes : undefined
    }
  ];

  // Dashboard stats
  const stats = [
    {
      title: t('assignedClients'),
      value: totalClients,
      icon: <Users className="w-4 h-4" />
    },
    {
      title: 'Total Portfolio',
      value: totalRevenue.toFixed(2),
      format: 'currency' as const,
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      title: 'Average Portfolio',
      value: avgPortfolio.toFixed(2),
      format: 'currency' as const,
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      title: 'Pending Taxes',
      value: unpaidTaxes,
      icon: <CreditCard className="w-4 h-4" />,
      changeType: unpaidTaxes > 0 ? 'decrease' as const : 'neutral' as const
    }
  ];

  // Table columns for clients
  const clientColumns = [
    {
      key: 'email',
      label: t('email'),
      sortable: true,
      render: (value: string) => <span className="font-medium">{value}</span>
    },
    {
      key: 'fullName',
      label: t('fullName'),
      sortable: true
    },
    {
      key: 'amount',
      label: t('amount'),
      sortable: true,
      render: (value: number) => `€${value?.toLocaleString() || 0}`
    },
    {
      key: 'taxPercentage',
      label: t('taxRate'),
      render: (value: string) => `${value || 0}%`
    },
    {
      key: 'taxStatus',
      label: t('taxStatus'),
      render: (value: string) => {
        const variants = {
          paid: 'default',
          unpaid: 'destructive',
          pending: 'secondary'
        } as const;
        return (
          <Badge variant={variants[value as keyof typeof variants] || 'secondary'}>
            {t(value as any) || value}
          </Badge>
        );
      }
    }
  ];

  // Client actions
  const getClientActions = (client: any) => [
    {
      label: t('updateAmount'),
      icon: <DollarSign className="w-3 h-3" />,
      onClick: () => {
        setSelectedClient(client);
        setEditAmount(client.amount?.toString() || "0");
      }
    },
    {
      label: t('setMessage'),
      icon: <MessageSquare className="w-3 h-3" />,
      onClick: () => {
        setSelectedClient(client);
        setMessageText(client.paymentMessage || "");
      }
    },
    {
      label: t('updateTax'),
      icon: <CreditCard className="w-3 h-3" />,
      onClick: () => console.log('Update tax', client.id)
    }
  ];

  const handleUpdateAmount = () => {
    if (selectedClient && editAmount) {
      updateAmountMutation.mutate({
        clientId: selectedClient.id,
        amount: parseFloat(editAmount)
      });
      setSelectedClient(null);
      setEditAmount("");
    }
  };

  const handleSetMessage = () => {
    if (selectedClient && messageText.trim()) {
      setMessageMutation.mutate({
        clientId: selectedClient.id,
        message: messageText.trim()
      });
    }
  };

  return (
    <SharedLayout 
      userType="seller" 
      userName="Seller Dashboard"
      onLogout={handleLogout}
      notifications={unpaidTaxes}
      quickActions={<QuickActions actions={quickActions} />}
    >
      <div className="p-6 space-y-6">
        {/* Dashboard Stats */}
        <DashboardStats stats={stats} />

        {/* Clients Table */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">{t('assignedClients')}</h2>
          <DataTable
            data={clients}
            columns={clientColumns}
            searchable={true}
            actions={getClientActions}
            filters={[
              {
                key: 'taxStatus',
                label: 'Tax Status',
                options: [
                  { value: 'paid', label: 'Paid' },
                  { value: 'unpaid', label: 'Unpaid' },
                  { value: 'pending', label: 'Pending' }
                ]
              }
            ]}
          />
        </div>

        {/* Update Amount Dialog */}
        <Dialog open={selectedClient && editAmount !== ""} onOpenChange={() => {
          setSelectedClient(null);
          setEditAmount("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('updateAmount')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client: {selectedClient?.email}</label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="Amount in EUR"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedClient(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleUpdateAmount} disabled={updateAmountMutation.isPending}>
                  {t('update')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Set Message Dialog */}
        <Dialog open={selectedClient && messageText !== undefined && editAmount === ""} onOpenChange={() => {
          setSelectedClient(null);
          setMessageText("");
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('setMessage')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Client: {selectedClient?.email}</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Payment page message..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setSelectedClient(null)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSetMessage} disabled={setMessageMutation.isPending}>
                  {t('save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SharedLayout>
  );
}