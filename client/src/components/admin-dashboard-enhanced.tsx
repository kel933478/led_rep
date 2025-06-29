import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi, type AuditLog } from "@/lib/api";
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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Download, FileText, MessageSquare, Eye, Activity, UserPlus, Search, 
  Filter, TrendingUp, Users, DollarSign, AlertTriangle, RefreshCw,
  MoreVertical, Edit, Trash, Settings, BarChart3, Mail
} from "lucide-react";
import BulkClientOperations from "@/components/bulk-client-operations";
import KYCVerificationSystem from "@/components/kyc-verification-system";
import CreateClientForm from "@/components/create-client-form";
import AdminWalletConfig from "@/components/admin-wallet-config";
import EmailComposer from "@/components/email-composer";
import ClientDetailModal from "@/components/client-detail-modal";

export default function AdminDashboardEnhanced() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // States for enhanced features
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState("email");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showMetrics, setShowMetrics] = useState(true);
  

  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [clientDetailModalOpen, setClientDetailModalOpen] = useState(false);
  const [selectedClientForDetail, setSelectedClientForDetail] = useState<number | null>(null);

  // Data fetching
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: auditData } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: () => adminApi.getAuditLogs(),
  });

  const { data: notesData } = useQuery({
    queryKey: ['/api/admin/notes', selectedClient],
    queryFn: () => selectedClient ? adminApi.getClientNotes(selectedClient) : null,
    enabled: !!selectedClient,
  });

  // Enhanced metrics calculation
  const metrics = useMemo(() => {
    if (!dashboardData?.clients) return null;
    
    const clients = dashboardData.clients;
    const totalClients = clients.length;
    const activeClients = clients.filter((c: any) => c.lastConnection && 
      new Date(c.lastConnection) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
    const kycCompleted = clients.filter((c: any) => c.kycCompleted).length;
    const totalRevenue = clients.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
    
    return {
      totalClients,
      activeClients,
      kycCompleted,
      totalRevenue,
      kycRate: ((kycCompleted / totalClients) * 100).toFixed(1),
      avgPortfolio: (totalRevenue / totalClients).toFixed(2)
    };
  }, [dashboardData]);

  // Enhanced filtering and sorting
  const filteredAndSortedClients = useMemo(() => {
    if (!dashboardData?.clients) return [];
    
    let filtered = dashboardData.clients.filter((client: any) => {
      const matchesSearch = client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (client.fullName && client.fullName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "kyc_completed" && client.kycCompleted) ||
                           (statusFilter === "kyc_pending" && !client.kycCompleted) ||
                           (statusFilter === "active" && client.lastConnection);
      
      return matchesSearch && matchesStatus;
    });

    // Sort
    filtered.sort((a: any, b: any) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === "amount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      }
      
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue?.toLowerCase() || "";
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [dashboardData?.clients, searchTerm, statusFilter, sortBy, sortOrder]);



  const addNoteMutation = useMutation({
    mutationFn: ({ clientId, note }: { clientId: number; note: string }) =>
      adminApi.addClientNote(clientId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notes'] });
      setNewNote("");
      toast({ title: t('success'), description: "Note ajoutée" });
    },
  });

  // Handlers
  const handleSelectClient = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredAndSortedClients.map((c: any) => c.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleDownloadKyc = async (clientId: number) => {
    try {
      await adminApi.downloadKyc(clientId);
      toast({ title: t('success'), description: "Fichier KYC téléchargé" });
    } catch (error) {
      toast({ title: t('error'), description: "Erreur lors du téléchargement", variant: "destructive" });
    }
  };

  const refreshData = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/audit-logs'] });
    toast({ title: t('success'), description: "Données actualisées" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Erreur lors du chargement des données</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administration Ledger Recovery</h1>
            <p className="text-muted-foreground">Gestion avancée des clients et des opérations</p>
          </div>
          <div className="flex items-center gap-2">
            <EmailComposer 
              clients={filteredAndSortedClients}
              userType="admin"
              trigger={
                <Button className="bg-green-600 hover:bg-green-700" size="sm">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              }
            />
            <Button onClick={refreshData} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
            <Button onClick={() => setShowMetrics(!showMetrics)} variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              {showMetrics ? "Masquer" : "Afficher"} Métriques
            </Button>
          </div>
        </div>

        {/* Enhanced Metrics Dashboard */}
        {showMetrics && metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalClients}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeClients} actifs ce mois
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">KYC Complétés</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.kycCompleted}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.kycRate}% du total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Revenus Totaux</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalRevenue.toLocaleString('fr-FR')} €</div>
                <p className="text-xs text-muted-foreground">
                  Moy: {metrics.avgPortfolio} € / client
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alertes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-muted-foreground">
                  Aucune alerte active
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Enhanced Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Recherche et Filtres Avancés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Rechercher par email ou nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les clients</SelectItem>
                  <SelectItem value="kyc_completed">KYC complété</SelectItem>
                  <SelectItem value="kyc_pending">KYC en attente</SelectItem>
                  <SelectItem value="active">Actifs récemment</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="fullName">Nom</SelectItem>
                  <SelectItem value="amount">Montant</SelectItem>
                  <SelectItem value="lastConnection">Dernière connexion</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </Button>
            </div>

            {selectedClients.length > 0 && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedClients.length} client(s) sélectionné(s)
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exporter
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Note groupée
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedClients([])}
                    >
                      Annuler
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="clients" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="clients">
              <Users className="w-4 h-4 mr-2" />
              Clients ({filteredAndSortedClients.length})
            </TabsTrigger>
            <TabsTrigger value="kyc">
              <FileText className="w-4 h-4 mr-2" />
              KYC
            </TabsTrigger>
            <TabsTrigger value="bulk">
              <UserPlus className="w-4 h-4 mr-2" />
              Actions Groupées
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="w-4 h-4 mr-2" />
              Audit
            </TabsTrigger>
          </TabsList>

          {/* Enhanced Clients Tab */}
          <TabsContent value="clients" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Gestion des Clients</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {filteredAndSortedClients.length} résultat(s)
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]">
                          <Checkbox
                            checked={selectedClients.length === filteredAndSortedClients.length && filteredAndSortedClients.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Nom complet</TableHead>
                        <TableHead>Montant (€)</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Dernière connexion</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedClients.map((client: any) => (
                        <TableRow key={client.id} className="hover:bg-muted/50">
                          <TableCell>
                            <Checkbox
                              checked={selectedClients.includes(client.id)}
                              onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{client.email}</TableCell>
                          <TableCell>{client.fullName || '-'}</TableCell>
                          <TableCell>{client.amount?.toLocaleString('fr-FR') || '0'} €</TableCell>
                          <TableCell>
                            <Badge variant={client.kycCompleted ? "default" : "secondary"}>
                              {client.kycCompleted ? t('completed') : t('pending')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {client.lastConnection 
                                ? new Date(client.lastConnection).toLocaleDateString('fr-FR')
                                : t('never')
                              }
                              {client.lastIp && (
                                <div className="text-xs text-muted-foreground">{client.lastIp}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedClientForDetail(client.id);
                                  setClientDetailModalOpen(true);
                                }}
                                className="text-blue-400 hover:text-blue-300"
                                title={t('viewDetails')}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              
                              {client.kycFileName && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDownloadKyc(client.id)}
                                  className="text-blue-400 hover:text-blue-300"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                              )}
                              
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedClient(client.id)}
                                    className="text-green-400 hover:text-green-300"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>{t('notes')} - {client.email}</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    {notesData?.notes?.map((note: any) => (
                                      <div key={note.id} className="p-3 bg-muted rounded-lg">
                                        <p className="text-sm">{note.note}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {new Date(note.createdAt).toLocaleString()}
                                        </p>
                                      </div>
                                    ))}
                                    <div className="flex space-x-2">
                                      <Textarea
                                        placeholder="Ajouter une note..."
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        className="flex-1"
                                      />
                                      <Button 
                                        onClick={() => selectedClient && addNoteMutation.mutate({ 
                                          clientId: selectedClient, 
                                          note: newNote.trim() 
                                        })}
                                        disabled={!newNote.trim() || addNoteMutation.isPending}
                                      >
                                        {addNoteMutation.isPending ? t('loading') : t('save')}
                                      </Button>
                                    </div>
                                  </div>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          <TabsContent value="kyc" className="space-y-6">
            <KYCVerificationSystem />
          </TabsContent>

          <TabsContent value="bulk" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BulkClientOperations 
                clients={filteredAndSortedClients}
                selectedClients={selectedClients}
                onSelectionChange={setSelectedClients}
              />
              <CreateClientForm />
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AdminWalletConfig />
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle>Global Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <label className="text-sm font-medium">System Settings</label>
                    <p className="text-xs text-muted-foreground">
                      Wallet configuration and system settings can be managed below
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Journal d'Audit
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Historique complet des actions administratives
                </p>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Heure</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Détails</TableHead>
                        <TableHead>IP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditData?.auditLogs?.slice(0, 10).map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm">
                            {new Date(log.createdAt).toLocaleString('fr-FR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.action.replace('_', ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.targetType && `${log.targetType} ${log.targetId || ''}`}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.ipAddress || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Client Detail Modal */}
      {selectedClientForDetail && (
        <ClientDetailModal
          clientId={selectedClientForDetail}
          isOpen={clientDetailModalOpen}
          onClose={() => {
            setClientDetailModalOpen(false);
            setSelectedClientForDetail(null);
          }}
          userType="admin"
        />
      )}
    </div>
  );
}