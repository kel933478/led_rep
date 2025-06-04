import { useState } from "react";
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
import { Download, FileText, MessageSquare, Eye, Activity } from "lucide-react";
import BulkClientOperations from "@/components/bulk-client-operations";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [newTaxRate, setNewTaxRate] = useState<number>(15);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [newNote, setNewNote] = useState("");
  const [selectedClients, setSelectedClients] = useState<number[]>([]);

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: notesData } = useQuery({
    queryKey: ['/api/admin/client', selectedClient, 'notes'],
    queryFn: () => selectedClient ? adminApi.getClientNotes(selectedClient) : null,
    enabled: !!selectedClient,
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: () => adminApi.getAuditLogs(50),
  });

  const updateTaxMutation = useMutation({
    mutationFn: adminApi.updateTaxRate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      toast({
        title: t('success'),
        description: "Taxe mise à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: "Erreur lors de la mise à jour",
        variant: "destructive",
      });
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ clientId, note }: { clientId: number; note: string }) =>
      adminApi.addClientNote(clientId, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/client', selectedClient, 'notes'] });
      setNewNote("");
      toast({
        title: t('success'),
        description: "Note ajoutée avec succès",
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: "Erreur lors de l'ajout de la note",
        variant: "destructive",
      });
    },
  });

  const handleExport = async () => {
    try {
      await adminApi.exportClients();
      toast({
        title: t('success'),
        description: "Export CSV téléchargé",
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: "Erreur lors de l'export",
        variant: "destructive",
      });
    }
  };

  const handleDownloadKyc = async (clientId: number) => {
    try {
      await adminApi.downloadKyc(clientId);
      toast({
        title: t('success'),
        description: "Fichier KYC téléchargé",
      });
    } catch (error) {
      toast({
        title: t('error'),
        description: "Erreur lors du téléchargement",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTax = () => {
    updateTaxMutation.mutate(newTaxRate);
  };

  const handleAddNote = () => {
    if (selectedClient && newNote.trim()) {
      addNoteMutation.mutate({ clientId: selectedClient, note: newNote.trim() });
    }
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

  const { clients, taxRate } = dashboardData;

  const formatActionText = (action: string) => {
    const actionMap: Record<string, string> = {
      admin_login: 'Connexion admin',
      admin_logout: 'Déconnexion admin',
      dashboard_view: 'Consultation dashboard',
      client_notes_view: 'Consultation notes client',
      client_note_add: 'Ajout note client',
      tax_rate_update: 'Mise à jour taux de taxe',
      data_export: 'Export données CSV',
      kyc_file_view: 'Consultation fichier KYC',
    };
    return actionMap[action] || action;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {/* Admin Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('adminDashboard')}</h1>
            <p className="text-muted-foreground">{t('adminSubtitle')}</p>
          </div>
          <div className="space-x-3">
            <Button onClick={handleExport} className="bg-primary hover:shadow-lg">
              <Download className="w-4 h-4 mr-2" />
              {t('exportCsv')}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="clients">Gestion Clients</TabsTrigger>
            <TabsTrigger value="settings">Paramètres</TabsTrigger>
            <TabsTrigger value="audit">
              <Activity className="w-4 h-4 mr-2" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-6">
            {/* Bulk Operations */}
            <BulkClientOperations 
              clients={clients}
              selectedClients={selectedClients}
              onSelectionChange={setSelectedClients}
            />
            
            {/* Client Table */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>{t('clientList')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('email')}</TableHead>
                    <TableHead>{t('kycStatus')}</TableHead>
                    <TableHead>{t('onboarding')}</TableHead>
                    <TableHead>{t('amount')}</TableHead>
                    <TableHead>{t('lastConnection')}</TableHead>
                    <TableHead>{t('actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.email}</TableCell>
                      <TableCell>
                        <Badge
                          variant={client.kycCompleted ? "default" : "destructive"}
                          className={client.kycCompleted ? "bg-green-900 text-green-300" : ""}
                        >
                          {client.kycCompleted ? t('validated') : t('pending')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={client.onboardingCompleted ? "default" : "secondary"}
                          className={client.onboardingCompleted ? "bg-green-900 text-green-300" : "bg-orange-900 text-orange-300"}
                        >
                          {client.onboardingCompleted ? t('completed') : t('inProgress')}
                        </Badge>
                      </TableCell>
                      <TableCell>{(client.amount || 0).toLocaleString()} €</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {client.lastConnection 
                            ? new Date(client.lastConnection).toLocaleDateString()
                            : t('never')
                          }
                          {client.lastIp && (
                            <div className="text-xs text-muted-foreground">{client.lastIp}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
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
                                
                                <div className="space-y-2">
                                  <Textarea
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    placeholder={t('addNote')}
                                    className="min-h-[100px]"
                                  />
                                  <Button
                                    onClick={handleAddNote}
                                    disabled={!newNote.trim() || addNoteMutation.isPending}
                                    className="w-full"
                                  >
                                    {addNoteMutation.isPending ? t('loading') : t('addNote')}
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

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>{t('taxConfig')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">{t('globalTax')}</label>
                  <Input
                    type="number"
                    value={newTaxRate}
                    onChange={(e) => setNewTaxRate(Number(e.target.value))}
                    min={0}
                    max={50}
                    className="w-24"
                  />
                  <Button
                    onClick={handleUpdateTax}
                    disabled={updateTaxMutation.isPending}
                    className="bg-primary hover:shadow-lg"
                  >
                    {updateTaxMutation.isPending ? t('loading') : t('update')}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Actuel: {taxRate}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Journal d'Audit
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Historique des actions administratives
                </p>
              </CardHeader>
              <CardContent>
                {auditLogsData?.auditLogs ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Action</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Date/Heure</TableHead>
                          <TableHead>Adresse IP</TableHead>
                          <TableHead>Détails</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogsData.auditLogs.map((log: AuditLog) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium">
                              {formatActionText(log.action)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={log.targetType === 'system' ? 'default' : 'secondary'}>
                                {log.targetType || 'system'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-sm">
                              {log.ipAddress || 'N/A'}
                            </TableCell>
                            <TableCell>
                              {log.details && Object.keys(log.details).length > 0 ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Détails de l'Action</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                      <pre className="text-xs bg-muted p-3 rounded overflow-auto">
                                        {JSON.stringify(log.details, null, 2)}
                                      </pre>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Aucun log d'audit disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
