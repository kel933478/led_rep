import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowUpRight, ArrowDownLeft, Filter, Search, Download } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Transaction {
  id: string;
  type: 'buy' | 'sell' | 'send' | 'receive';
  crypto: string;
  amount: number;
  price: number;
  total: number;
  fee: number;
  status: 'completed' | 'pending' | 'failed';
  timestamp: Date;
  from?: string;
  to?: string;
  txHash?: string;
}

export default function CryptoTransactionHistory() {
  const [filters, setFilters] = useState({
    search: "",
    type: "all",
    crypto: "all",
    status: "all",
    dateFrom: "",
    dateTo: ""
  });

  const { data: dashboardData } = useQuery({
    queryKey: ['/api/client/dashboard'],
    queryFn: clientApi.getDashboard,
  });

  // Génération d'historique de transactions simulées pour démonstration
  const transactions: Transaction[] = useMemo(() => {
    if (!dashboardData?.client?.balances) return [];

    const cryptos = Object.keys(dashboardData.client.balances);
    const types: Transaction['type'][] = ['buy', 'sell', 'send', 'receive'];
    const statuses: Transaction['status'][] = ['completed', 'pending', 'failed'];
    
    return Array.from({ length: 50 }, (_, i) => {
      const crypto = cryptos[Math.floor(Math.random() * cryptos.length)];
      const type = types[Math.floor(Math.random() * types.length)];
      const status = i < 3 ? statuses[Math.floor(Math.random() * statuses.length)] : 'completed';
      const amount = Math.random() * 10;
      const price = Math.random() * 50000;
      
      return {
        id: `tx_${i + 1}`,
        type,
        crypto: crypto.toUpperCase(),
        amount,
        price,
        total: amount * price,
        fee: amount * price * 0.001, // 0.1% fee
        status,
        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        from: type === 'send' ? 'Votre wallet' : type === 'receive' ? 'Wallet externe' : undefined,
        to: type === 'send' ? 'Wallet externe' : type === 'receive' ? 'Votre wallet' : undefined,
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`
      };
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [dashboardData?.client?.balances]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch = filters.search === "" || 
        tx.crypto.toLowerCase().includes(filters.search.toLowerCase()) ||
        tx.id.toLowerCase().includes(filters.search.toLowerCase()) ||
        (tx.txHash && tx.txHash.toLowerCase().includes(filters.search.toLowerCase()));

      const matchesType = filters.type === "all" || tx.type === filters.type;
      const matchesCrypto = filters.crypto === "all" || tx.crypto === filters.crypto;
      const matchesStatus = filters.status === "all" || tx.status === filters.status;

      const txDate = tx.timestamp;
      const matchesDateFrom = !filters.dateFrom || txDate >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || txDate <= new Date(filters.dateTo);

      return matchesSearch && matchesType && matchesCrypto && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [transactions, filters]);

  const cryptoList = useMemo(() => {
    const cryptos = new Set(transactions.map(tx => tx.crypto));
    return Array.from(cryptos);
  }, [transactions]);

  const exportTransactions = () => {
    const csvHeader = 'Date,Type,Crypto,Amount,Price,Total,Fee,Status,Hash\n';
    const csvData = filteredTransactions.map(tx => [
      format(tx.timestamp, 'yyyy-MM-dd HH:mm:ss'),
      tx.type,
      tx.crypto,
      tx.amount.toFixed(8),
      tx.price.toFixed(2),
      tx.total.toFixed(2),
      tx.fee.toFixed(2),
      tx.status,
      tx.txHash || ''
    ].join(',')).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'buy':
      case 'receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case 'sell':
      case 'send':
        return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getTypeText = (type: string) => {
    const typeMap = {
      buy: 'Achat',
      sell: 'Vente',
      send: 'Envoi',
      receive: 'Réception'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-900 text-green-300">Complété</Badge>;
      case 'pending':
        return <Badge className="bg-black text-white">En attente</Badge>;
      case 'failed':
        return <Badge className="bg-red-900 text-red-300">Échoué</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const totalValue = filteredTransactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalFees = filteredTransactions.reduce((sum, tx) => sum + tx.fee, 0);

  return (
    <Card className="bg-gray-900 rounded-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Search className="w-5 h-5 mr-2" />
            Historique des Transactions
          </div>
          <Button onClick={exportTransactions} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-400">Total des transactions</p>
            <p className="text-lg font-bold text-white">{filteredTransactions.length}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Valeur totale</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(totalValue)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-400">Frais totaux</p>
            <p className="text-lg font-bold text-white">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'EUR' 
              }).format(totalFees)}
            </p>
          </div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 p-4 bg-gray-800 rounded-lg">
          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Recherche</label>
            <Input
              placeholder="ID, crypto, hash..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white h-8"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Type</label>
            <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="buy">Achat</SelectItem>
                <SelectItem value="sell">Vente</SelectItem>
                <SelectItem value="send">Envoi</SelectItem>
                <SelectItem value="receive">Réception</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Crypto</label>
            <Select value={filters.crypto} onValueChange={(value) => setFilters({ ...filters, crypto: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {cryptoList.map(crypto => (
                  <SelectItem key={crypto} value={crypto}>{crypto}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Statut</label>
            <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="completed">Complété</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="failed">Échoué</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Date début</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white h-8"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-200 mb-1 block">Date fin</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white h-8"
            />
          </div>
        </div>

        {/* Table des transactions */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Crypto</TableHead>
                <TableHead className="text-gray-300">Quantité</TableHead>
                <TableHead className="text-gray-300">Prix</TableHead>
                <TableHead className="text-gray-300">Total</TableHead>
                <TableHead className="text-gray-300">Frais</TableHead>
                <TableHead className="text-gray-300">Statut</TableHead>
                <TableHead className="text-gray-300">Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id} className="border-gray-700 hover:bg-gray-800">
                  <TableCell className="text-gray-300 text-sm">
                    {format(tx.timestamp, 'dd/MM/yy HH:mm', { locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getTypeIcon(tx.type)}
                      <span className="text-white text-sm">{getTypeText(tx.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-white border-gray-600">
                      {tx.crypto}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white font-mono text-sm">
                    {tx.amount.toFixed(8)}
                  </TableCell>
                  <TableCell className="text-gray-300 text-sm">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    }).format(tx.price)}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    }).format(tx.total)}
                  </TableCell>
                  <TableCell className="text-gray-400 text-sm">
                    {new Intl.NumberFormat('fr-FR', { 
                      style: 'currency', 
                      currency: 'EUR' 
                    }).format(tx.fee)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(tx.status)}
                  </TableCell>
                  <TableCell className="text-gray-400 font-mono text-xs">
                    {tx.txHash ? `${tx.txHash.substring(0, 10)}...` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400">Aucune transaction trouvée</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}