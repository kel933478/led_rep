import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type AuditLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, Download, Filter, Search, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function AdvancedAuditViewer() {
  const [filters, setFilters] = useState({
    search: "",
    actionType: "all",
    targetType: "all",
    dateFrom: "",
    dateTo: "",
    adminId: "all"
  });
  const [page, setPage] = useState(1);
  const [pageSize] = useState(50);

  const { data: auditLogsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/audit-logs', filters, page],
    queryFn: () => adminApi.getAuditLogs(pageSize * page),
  });

  const filteredLogs = useMemo(() => {
    if (!auditLogsData?.auditLogs) return [];

    return auditLogsData.auditLogs.filter(log => {
      const matchesSearch = filters.search === "" || 
        log.action.toLowerCase().includes(filters.search.toLowerCase()) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(filters.search.toLowerCase()));

      const matchesAction = filters.actionType === "all" || log.action === filters.actionType;
      const matchesTarget = filters.targetType === "all" || log.targetType === filters.targetType;

      const logDate = new Date(log.createdAt);
      const matchesDateFrom = !filters.dateFrom || logDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || logDate <= new Date(filters.dateTo);

      const matchesAdmin = filters.adminId === "all" || log.adminId.toString() === filters.adminId;

      return matchesSearch && matchesAction && matchesTarget && matchesDateFrom && matchesDateTo && matchesAdmin;
    });
  }, [auditLogsData?.auditLogs, filters]);

  const actionTypes = useMemo(() => {
    if (!auditLogsData?.auditLogs) return [];
    const types = new Set(auditLogsData.auditLogs.map(log => log.action));
    return Array.from(types);
  }, [auditLogsData?.auditLogs]);

  const targetTypes = useMemo(() => {
    if (!auditLogsData?.auditLogs) return [];
    const types = new Set(auditLogsData.auditLogs.map(log => log.targetType).filter(Boolean));
    return Array.from(types);
  }, [auditLogsData?.auditLogs]);

  const adminIds = useMemo(() => {
    if (!auditLogsData?.auditLogs) return [];
    const ids = new Set(auditLogsData.auditLogs.map(log => log.adminId));
    return Array.from(ids);
  }, [auditLogsData?.auditLogs]);

  const exportFilteredLogs = () => {
    const csvHeader = 'Date,Action,Type,Admin ID,IP Address,Details\n';
    const csvData = filteredLogs.map(log => {
      const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';
      return [
        format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.targetType || '',
        log.adminId,
        log.ipAddress || '',
        `"${details}"`
      ].join(',');
    }).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      client_status_update: 'Mise à jour statut client',
      client_risk_update: 'Mise à jour niveau de risque',
      client_balances_update: 'Mise à jour balances',
      client_password_reset: 'Réinitialisation mot de passe'
    };
    return actionMap[action] || action;
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('login') || action.includes('logout')) return 'bg-blue-900 text-blue-300';
    if (action.includes('update') || action.includes('add')) return 'bg-green-900 text-green-300';
    if (action.includes('delete') || action.includes('reset')) return 'bg-red-900 text-red-300';
    if (action.includes('view') || action.includes('export')) return 'bg-gray-700 text-gray-300';
    return 'bg-purple-900 text-purple-300';
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Journal d'Audit Avancé
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button onClick={exportFilteredLogs} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Advanced Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-muted rounded-lg">
          <div>
            <label className="text-sm font-medium mb-1 block">Recherche</label>
            <Input
              placeholder="Rechercher..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="h-8"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-1 block">Type d'action</label>
            <Select value={filters.actionType} onValueChange={(value) => setFilters({ ...filters, actionType: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {actionTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {formatActionText(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Type de cible</label>
            <Select value={filters.targetType} onValueChange={(value) => setFilters({ ...filters, targetType: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {targetTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Admin</label>
            <Select value={filters.adminId} onValueChange={(value) => setFilters({ ...filters, adminId: value })}>
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {adminIds.map(id => (
                  <SelectItem key={id} value={id.toString()}>
                    Admin {id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Date début</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="h-8"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Date fin</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="h-8"
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {filteredLogs.length} résultat{filteredLogs.length !== 1 ? 's' : ''} trouvé{filteredLogs.length !== 1 ? 's' : ''}
            {auditLogsData?.auditLogs && filteredLogs.length !== auditLogsData.auditLogs.length && 
              ` sur ${auditLogsData.auditLogs.length} total`
            }
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters({
              search: "",
              actionType: "all",
              targetType: "all",
              dateFrom: "",
              dateTo: "",
              adminId: "all"
            })}
          >
            <Filter className="w-4 h-4 mr-2" />
            Réinitialiser les filtres
          </Button>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Adresse IP</TableHead>
                <TableHead>Détails</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Chargement des logs...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun log d'audit trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50">
                    <TableCell className="text-sm">
                      {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionBadgeColor(log.action)}>
                        {formatActionText(log.action)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {log.targetType || 'system'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      Admin {log.adminId}
                    </TableCell>
                    <TableCell className="text-sm font-mono">
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
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Détails de l'Action</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="font-medium">Action:</span> {formatActionText(log.action)}
                                </div>
                                <div>
                                  <span className="font-medium">Date:</span> {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                                </div>
                                <div>
                                  <span className="font-medium">Admin ID:</span> {log.adminId}
                                </div>
                                <div>
                                  <span className="font-medium">IP:</span> {log.ipAddress || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <span className="font-medium block mb-2">Détails JSON:</span>
                                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-64">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLogs.length >= pageSize && (
          <div className="flex items-center justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isLoading}
            >
              Précédent
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={filteredLogs.length < pageSize || isLoading}
            >
              Suivant
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}