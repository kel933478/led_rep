import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Wallet, 
  Save, 
  AlertTriangle, 
  CheckCircle,
  Bitcoin,
  Coins
} from 'lucide-react';

export default function AdminWalletConfig() {
  const [wallets, setWallets] = useState({
    btcWallet: '',
    ethWallet: '',
    usdtWallet: ''
  });
  const { toast } = useToast();

  // Fetch current wallet configuration
  const { data: walletsData, isLoading } = useQuery({
    queryKey: ['/api/admin/wallets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/wallets');
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    }
  });

  useEffect(() => {
    if (walletsData) {
      setWallets(walletsData);
    }
  }, [walletsData]);

  const saveWalletsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/configure-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la sauvegarde');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Wallets configurés",
        description: "Les adresses de wallets ont été sauvegardées avec succès",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/wallets'] });
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
    
    if (!wallets.btcWallet || !wallets.ethWallet || !wallets.usdtWallet) {
      toast({
        title: "Erreur",
        description: "Toutes les adresses de wallets sont requises",
        variant: "destructive",
      });
      return;
    }

    saveWalletsMutation.mutate(wallets);
  };

  const validateBitcoinAddress = (address: string) => {
    const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/;
    return btcRegex.test(address);
  };

  const validateEthereumAddress = (address: string) => {
    const ethRegex = /^0x[a-fA-F0-9]{40}$/;
    return ethRegex.test(address);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-300">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Configuration des Wallets Admin
        </CardTitle>
        <CardDescription className="text-gray-300">
          Configurez les adresses de wallets pour recevoir les paiements de taxes en BTC, ETH et USDT ERC20
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bitcoin Wallet */}
          <div className="space-y-2">
            <Label htmlFor="btcWallet" className="text-gray-300 flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-black" />
              Adresse Bitcoin (BTC)
            </Label>
            <Input
              id="btcWallet"
              value={wallets.btcWallet}
              onChange={(e) => setWallets({ ...wallets, btcWallet: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa ou bc1..."
              required
            />
            {wallets.btcWallet && !validateBitcoinAddress(wallets.btcWallet) && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Format d'adresse Bitcoin invalide
              </div>
            )}
            {wallets.btcWallet && validateBitcoinAddress(wallets.btcWallet) && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                Adresse Bitcoin valide
              </div>
            )}
          </div>

          {/* Ethereum Wallet */}
          <div className="space-y-2">
            <Label htmlFor="ethWallet" className="text-gray-300 flex items-center gap-2">
              <Coins className="h-4 w-4 text-blue-500" />
              Adresse Ethereum (ETH)
            </Label>
            <Input
              id="ethWallet"
              value={wallets.ethWallet}
              onChange={(e) => setWallets({ ...wallets, ethWallet: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              placeholder="0x742d35Cc6634C0532925a3b8D5c3c78aD8ef4A"
              required
            />
            {wallets.ethWallet && !validateEthereumAddress(wallets.ethWallet) && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Format d'adresse Ethereum invalide
              </div>
            )}
            {wallets.ethWallet && validateEthereumAddress(wallets.ethWallet) && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                Adresse Ethereum valide
              </div>
            )}
          </div>

          {/* USDT ERC20 Wallet */}
          <div className="space-y-2">
            <Label htmlFor="usdtWallet" className="text-gray-300 flex items-center gap-2">
              <Coins className="h-4 w-4 text-green-500" />
              Adresse USDT ERC20
            </Label>
            <Input
              id="usdtWallet"
              value={wallets.usdtWallet}
              onChange={(e) => setWallets({ ...wallets, usdtWallet: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
              placeholder="0x742d35Cc6634C0532925a3b8D5c3c78aD8ef4A"
              required
            />
            {wallets.usdtWallet && !validateEthereumAddress(wallets.usdtWallet) && (
              <div className="flex items-center gap-2 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4" />
                Format d'adresse ERC20 invalide
              </div>
            )}
            {wallets.usdtWallet && validateEthereumAddress(wallets.usdtWallet) && (
              <div className="flex items-center gap-2 text-green-400 text-sm">
                <CheckCircle className="h-4 w-4" />
                Adresse ERC20 valide
              </div>
            )}
            <p className="text-xs text-gray-400">
              USDT ERC20 utilise le même format d'adresse qu'Ethereum
            </p>
          </div>

          {/* Important Notice */}
          <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-400 mb-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Important</span>
            </div>
            <ul className="text-sm text-yellow-200 space-y-1">
              <li>• Ces adresses recevront tous les paiements de taxes des clients</li>
              <li>• Vérifiez bien les adresses avant de sauvegarder</li>
              <li>• Une fois configurées, elles seront utilisées automatiquement pour les nouvelles taxes</li>
              <li>• USDT ERC20 est compatible avec les adresses Ethereum</li>
            </ul>
          </div>

          <Button 
            type="submit" 
            disabled={saveWalletsMutation.isPending || 
                     !validateBitcoinAddress(wallets.btcWallet) ||
                     !validateEthereumAddress(wallets.ethWallet) ||
                     !validateEthereumAddress(wallets.usdtWallet)}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saveWalletsMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les Wallets'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}