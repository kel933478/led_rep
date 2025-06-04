import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Users, Shield, Activity, Download, Calendar } from "lucide-react";

export default function AdvancedReportsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [reportType, setReportType] = useState("overview");

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    queryFn: adminApi.getDashboard,
  });

  const { data: auditLogsData } = useQuery({
    queryKey: ['/api/admin/audit-logs'],
    queryFn: () => adminApi.getAuditLogs(1000),
  });

  // Calculs des métriques avancées
  const metrics = useMemo(() => {
    if (!dashboardData?.clients) return null;

    const clients = dashboardData.clients;
    const totalClients = clients.length;
    const activeClients = clients.filter(c => c.isActive).length;
    const kycCompleted = clients.filter(c => c.kycCompleted).length;
    const onboardingCompleted = clients.filter(c => c.onboardingCompleted).length;

    // Analyse des risques
    const riskDistribution = clients.reduce((acc, client) => {
      const risk = client.riskLevel || 'medium';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Portfolio total
    const totalPortfolioValue = clients.reduce((total, client) => {
      return total + Object.entries(client.balances || {}).reduce((clientTotal, [symbol, balance]) => {
        // Estimation simple des valeurs (en production, utiliser les vrais prix)
        const estimatedPrices = {
          btc: 45000, eth: 3000, usdt: 1, ada: 0.5, dot: 8,
          sol: 65, link: 15, matic: 0.9, bnb: 300, xrp: 0.6
        };
        const price = estimatedPrices[symbol as keyof typeof estimatedPrices] || 0;
        return clientTotal + (balance * price);
      }, 0);
    }, 0);

    return {
      totalClients,
      activeClients,
      kycCompleted,
      onboardingCompleted,
      kycCompletionRate: (kycCompleted / totalClients) * 100,
      onboardingRate: (onboardingCompleted / totalClients) * 100,
      activeRate: (activeClients / totalClients) * 100,
      riskDistribution,
      totalPortfolioValue,
      averagePortfolioValue: totalPortfolioValue / totalClients
    };
  }, [dashboardData?.clients]);

  // Données pour les graphiques
  const chartData = useMemo(() => {
    if (!auditLogsData?.auditLogs) return [];

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    return last30Days.map(date => {
      const dayLogs = auditLogsData.auditLogs.filter(log => {
        const logDate = new Date(log.createdAt);
        return logDate.toDateString() === date.toDateString();
      });

      const logins = dayLogs.filter(log => log.action === 'admin_login').length;
      const actions = dayLogs.filter(log => log.action !== 'admin_login' && log.action !== 'admin_logout').length;

      return {
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        logins,
        actions,
        total: dayLogs.length
      };
    });
  }, [auditLogsData?.auditLogs]);

  const riskData = useMemo(() => {
    if (!metrics?.riskDistribution) return [];

    return Object.entries(metrics.riskDistribution).map(([risk, count]) => ({
      name: risk === 'low' ? 'Faible' : risk === 'medium' ? 'Moyen' : 'Élevé',
      value: count,
      percentage: (count / metrics.totalClients) * 100
    }));
  }, [metrics]);

  const portfolioDistribution = useMemo(() => {
    if (!dashboardData?.clients) return [];

    const ranges = [
      { name: '< 1k€', min: 0, max: 1000 },
      { name: '1k-10k€', min: 1000, max: 10000 },
      { name: '10k-50k€', min: 10000, max: 50000 },
      { name: '50k-100k€', min: 50000, max: 100000 },
      { name: '> 100k€', min: 100000, max: Infinity }
    ];

    return ranges.map(range => {
      const count = dashboardData.clients.filter(client => {
        const portfolioValue = Object.entries(client.balances || {}).reduce((total, [symbol, balance]) => {
          const estimatedPrices = {
            btc: 45000, eth: 3000, usdt: 1, ada: 0.5, dot: 8,
            sol: 65, link: 15, matic: 0.9, bnb: 300, xrp: 0.6
          };
          const price = estimatedPrices[symbol as keyof typeof estimatedPrices] || 0;
          return total + (balance * price);
        }, 0);
        return portfolioValue >= range.min && portfolioValue < range.max;
      }).length;

      return {
        name: range.name,
        value: count,
        percentage: (count / dashboardData.clients.length) * 100
      };
    });
  }, [dashboardData?.clients]);

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      period: selectedPeriod,
      metrics,
      chartData,
      riskData,
      portfolioDistribution
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center">
            <Activity className="w-8 h-8 mx-auto mb-2 text-muted-foreground animate-spin" />
            <p className="text-muted-foreground">Chargement des rapports...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête des rapports */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Rapports Avancés</h2>
          <p className="text-muted-foreground">Analyses de performance et statistiques détaillées</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="90d">90 jours</SelectItem>
              <SelectItem value="1y">1 an</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clients Total</p>
                <p className="text-2xl font-bold">{metrics.totalClients}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeClients} actifs ({metrics.activeRate.toFixed(1)}%)
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">KYC Complété</p>
                <p className="text-2xl font-bold">{metrics.kycCompleted}</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.kycCompletionRate.toFixed(1)}% du total
                </p>
              </div>
              <Shield className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Portfolio Total</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR',
                    notation: 'compact'
                  }).format(metrics.totalPortfolioValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Moy: {new Intl.NumberFormat('fr-FR', { 
                    style: 'currency', 
                    currency: 'EUR' 
                  }).format(metrics.averagePortfolioValue)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taux Onboarding</p>
                <p className="text-2xl font-bold">{metrics.onboardingRate.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {metrics.onboardingCompleted} sur {metrics.totalClients}
                </p>
              </div>
              <Activity className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="activity">Activité</TabsTrigger>
          <TabsTrigger value="risk">Analyse Risque</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activité Administrative (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="logins" stroke="#3B82F6" name="Connexions" />
                  <Line type="monotone" dataKey="actions" stroke="#10B981" name="Actions" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des Risques</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={riskData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {riskData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Répartition par Niveau de Risque</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {riskData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="font-medium">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.value} clients</div>
                      <div className="text-sm text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribution des Portfolios par Valeur</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={portfolioDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, 'Clients']} />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taux de Conversion KYC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {metrics.kycCompletionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.kycCompleted} sur {metrics.totalClients} clients
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${metrics.kycCompletionRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taux d'Onboarding</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">
                  {metrics.onboardingRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.onboardingCompleted} sur {metrics.totalClients} clients
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${metrics.onboardingRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Clients Actifs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-500">
                  {metrics.activeRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.activeClients} sur {metrics.totalClients} clients
                </p>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ width: `${metrics.activeRate}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}