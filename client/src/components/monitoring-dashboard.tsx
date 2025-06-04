import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  Activity, 
  Server, 
  Database, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock
} from "lucide-react";

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  metrics: {
    cpu: { usage: number; loadAverage: number[] };
    memory: { total: number; used: number; percentage: number };
    disk: { percentage: number };
    network: { requests: number; errors: number; responseTime: number };
    database: { connections: number; queries: number; errors: number };
    application: { activeUsers: number; totalUsers: number; kycPending: number };
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'critical';
    message: string;
    timestamp: string;
  }>;
}

export default function MonitoringDashboard() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/admin/monitoring/status', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
        
        // Add to metrics history
        setMetricsHistory(prev => {
          const newHistory = [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            cpu: data.metrics.cpu.usage,
            memory: data.metrics.memory.percentage,
            responseTime: data.metrics.network.responseTime
          }];
          return newHistory.slice(-20); // Keep last 20 points
        });
      }
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 3600));
    const hours = Math.floor((seconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}j ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading || !systemStatus) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Chargement du monitoring...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête du statut système */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon(systemStatus.status)}
          <div>
            <h2 className="text-2xl font-bold">Monitoring Système</h2>
            <p className={`text-sm ${getStatusColor(systemStatus.status)}`}>
              Statut: {systemStatus.status === 'healthy' ? 'Sain' : 
                      systemStatus.status === 'warning' ? 'Attention' : 'Critique'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Uptime</p>
          <p className="font-mono text-lg">{formatUptime(systemStatus.uptime)}</p>
        </div>
      </div>

      {/* Alertes actives */}
      {systemStatus.alerts.length > 0 && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-700 dark:text-yellow-300">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Alertes Actives ({systemStatus.alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {systemStatus.alerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded">
                <div className="flex items-center space-x-2">
                  <Badge variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                    {alert.type}
                  </Badge>
                  <span className="text-sm">{alert.message}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-bold">{systemStatus.metrics.cpu.usage.toFixed(1)}%</p>
                <Progress value={systemStatus.metrics.cpu.usage} className="mt-2" />
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Memory</p>
                <p className="text-2xl font-bold">{systemStatus.metrics.memory.percentage.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(systemStatus.metrics.memory.used)} / {formatBytes(systemStatus.metrics.memory.total)}
                </p>
                <Progress value={systemStatus.metrics.memory.percentage} className="mt-2" />
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Network</p>
                <p className="text-2xl font-bold">{systemStatus.metrics.network.requests}</p>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.metrics.network.errors} erreurs
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.metrics.network.responseTime.toFixed(0)}ms avg
                </p>
              </div>
              <Wifi className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Database</p>
                <p className="text-2xl font-bold">{systemStatus.metrics.database.connections}</p>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.metrics.database.queries} requêtes
                </p>
                <p className="text-xs text-muted-foreground">
                  {systemStatus.metrics.database.errors} erreurs
                </p>
              </div>
              <Database className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics">Métriques Temps Réel</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
          <TabsTrigger value="alerts">Historique Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CPU & Memory Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                    <Line type="monotone" dataKey="cpu" stroke="#3B82F6" name="CPU" />
                    <Line type="monotone" dataKey="memory" stroke="#10B981" name="Memory" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={metricsHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                    <Line type="monotone" dataKey="responseTime" stroke="#F59E0B" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métriques détaillées */}
          <Card>
            <CardHeader>
              <CardTitle>Métriques Détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Load Average</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>1m:</span>
                      <span>{systemStatus.metrics.cpu.loadAverage[0]?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>5m:</span>
                      <span>{systemStatus.metrics.cpu.loadAverage[1]?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>15m:</span>
                      <span>{systemStatus.metrics.cpu.loadAverage[2]?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Disk Usage</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Used:</span>
                      <span>{systemStatus.metrics.disk.percentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={systemStatus.metrics.disk.percentage} />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Network Stats</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Requests:</span>
                      <span>{systemStatus.metrics.network.requests}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Errors:</span>
                      <span className={systemStatus.metrics.network.errors > 0 ? 'text-red-500' : ''}>
                        {systemStatus.metrics.network.errors}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg Response:</span>
                      <span>{systemStatus.metrics.network.responseTime.toFixed(0)}ms</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Utilisateurs Actifs</p>
                    <p className="text-2xl font-bold">{systemStatus.metrics.application.activeUsers}</p>
                    <p className="text-xs text-muted-foreground">
                      sur {systemStatus.metrics.application.totalUsers} total
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">KYC En Attente</p>
                    <p className="text-2xl font-bold">{systemStatus.metrics.application.kycPending}</p>
                    <p className="text-xs text-muted-foreground">
                      documents à vérifier
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Base de Données</p>
                    <p className="text-2xl font-bold">{systemStatus.metrics.database.connections}</p>
                    <p className="text-xs text-muted-foreground">
                      connexions actives
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Alertes</CardTitle>
            </CardHeader>
            <CardContent>
              {systemStatus.alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">Aucune alerte active</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {systemStatus.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Badge variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                          {alert.type}
                        </Badge>
                        <span>{alert.message}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Actions rapides */}
      <div className="flex items-center space-x-2">
        <Button onClick={fetchSystemStatus} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualiser
        </Button>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Export Métriques
        </Button>
      </div>
    </div>
  );
}