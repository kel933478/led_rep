import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { clientApi } from "@/lib/api";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ArrowUpDown, RefreshCw, TrendingUp, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

const cryptoOptions = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', balance: 0.15234567, rate: 45000, icon: '₿', color: '#F59E0B' },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', balance: 2.45678912, rate: 2800, icon: 'Ξ', color: '#8B5CF6' },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', balance: 1250.50, rate: 0.92, icon: '₮', color: '#10B981' },
  { id: 'BNB', name: 'BNB', symbol: 'BNB', balance: 5.12345678, rate: 320, icon: 'B', color: '#F59E0B' },
  { id: 'ADA', name: 'Cardano', symbol: 'ADA', balance: 125.567, rate: 0.45, icon: '₳', color: '#3B82F6' },
  { id: 'DOT', name: 'Polkadot', symbol: 'DOT', balance: 25.123, rate: 6.2, icon: '●', color: '#EC4899' },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', balance: 8.91234, rate: 95, icon: '◎', color: '#A855F7' },
  { id: 'LINK', name: 'Chainlink', symbol: 'LINK', balance: 15.789, rate: 14.5, icon: '🔗', color: '#2563EB' },
  { id: 'MATIC', name: 'Polygon', symbol: 'MATIC', balance: 234.567, rate: 0.85, icon: '⬟', color: '#8B5CF6' },
  { id: 'XRP', name: 'Ripple', symbol: 'XRP', balance: 450.123, rate: 0.58, icon: 'X', color: '#059669' }
];

const exchangeHistory = [
  {
    id: 1,
    fromSymbol: 'BTC',
    toSymbol: 'ETH',
    fromAmount: 0.1,
    toAmount: 1.6,
    rate: 16.0,
    fee: 0.001,
    status: 'completed',
    timestamp: '2024-12-07 14:30:00'
  },
  {
    id: 2,
    fromSymbol: 'ETH',
    toSymbol: 'USDT',
    fromAmount: 0.5,
    toAmount: 1400,
    rate: 2800,
    fee: 7.0,
    status: 'completed',
    timestamp: '2024-12-06 10:15:00'
  },
  {
    id: 3,
    fromSymbol: 'ADA',
    toSymbol: 'BTC',
    fromAmount: 1000,
    toAmount: 0.01,
    rate: 0.00001,
    fee: 0.0001,
    status: 'pending',
    timestamp: '2024-12-07 16:45:00'
  }
];

export default function CryptoExchange() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [fromCrypto, setFromCrypto] = useState(cryptoOptions[0]);
  const [toCrypto, setToCrypto] = useState(cryptoOptions[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');

  // Calculate exchange rate and amounts
  useEffect(() => {
    if (fromCrypto && toCrypto && fromCrypto.id !== toCrypto.id) {
      const rate = toCrypto.rate / fromCrypto.rate;
      setExchangeRate(rate);
      
      if (fromAmount && !isNaN(parseFloat(fromAmount))) {
        const calculatedToAmount = parseFloat(fromAmount) * rate;
        setToAmount(calculatedToAmount.toFixed(8));
      }
    }
  }, [fromCrypto, toCrypto, fromAmount]);

  const handleSwapCryptos = () => {
    const temp = fromCrypto;
    setFromCrypto(toCrypto);
    setToCrypto(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value: string) => {
    setFromAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const calculatedToAmount = parseFloat(value) * exchangeRate;
      setToAmount(calculatedToAmount.toFixed(8));
    } else {
      setToAmount('');
    }
  };

  const handleToAmountChange = (value: string) => {
    setToAmount(value);
    if (value && !isNaN(parseFloat(value)) && exchangeRate > 0) {
      const calculatedFromAmount = parseFloat(value) / exchangeRate;
      setFromAmount(calculatedFromAmount.toFixed(8));
    } else {
      setFromAmount('');
    }
  };

  const calculateFee = () => {
    if (!fromAmount || isNaN(parseFloat(fromAmount))) return 0;
    return parseFloat(fromAmount) * 0.0025; // 0.25% fee
  };

  const handleExchange = async () => {
    setIsCalculating(true);
    // Simulate exchange processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setStep('success');
    setIsCalculating(false);
    
    toast({
      title: "Échange réussi",
      description: `${fromAmount} ${fromCrypto.symbol} échangé contre ${toAmount} ${toCrypto.symbol}`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600';
      case 'pending': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Terminé';
      case 'pending': return 'En cours';
      case 'failed': return 'Échoué';
      default: return 'Inconnu';
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/client/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Échange Cryptomonnaies</h1>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Échange Réussi!</h2>
              <p className="text-gray-400 mb-6">Votre échange a été traité avec succès</p>
              
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl mb-1">{fromCrypto.icon}</div>
                    <p className="text-white font-semibold">{fromAmount} {fromCrypto.symbol}</p>
                  </div>
                  <ArrowUpDown className="w-6 h-6 text-blue-400" />
                  <div className="text-center">
                    <div className="text-2xl mb-1">{toCrypto.icon}</div>
                    <p className="text-white font-semibold">{toAmount} {toCrypto.symbol}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taux d'échange:</span>
                    <span className="text-white">1 {fromCrypto.symbol} = {exchangeRate.toFixed(6)} {toCrypto.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frais:</span>
                    <span className="text-white">{calculateFee().toFixed(6)} {fromCrypto.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => {
                    setStep('form');
                    setFromAmount('');
                    setToAmount('');
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Nouvel Échange
                </Button>
                <Link href="/client/dashboard" className="flex-1">
                  <Button variant="outline" className="w-full border-gray-600 text-white">
                    Retour Dashboard
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setStep('form')}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-white">Confirmer l'Échange</h1>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Vérifiez les Détails
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <p className="text-yellow-200 text-sm">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Veuillez vérifier attentivement les détails de l'échange. Cette action est irréversible.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-6 p-6 bg-gray-800 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{backgroundColor: fromCrypto.color + '20'}}>
                      <span className="text-2xl">{fromCrypto.icon}</span>
                    </div>
                    <h3 className="font-semibold text-white">{fromCrypto.symbol}</h3>
                    <p className="text-lg font-bold text-white">{fromAmount}</p>
                    <p className="text-sm text-gray-400">Solde: {fromCrypto.balance}</p>
                  </div>
                  
                  <ArrowUpDown className="w-8 h-8 text-blue-400" />
                  
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{backgroundColor: toCrypto.color + '20'}}>
                      <span className="text-2xl">{toCrypto.icon}</span>
                    </div>
                    <h3 className="font-semibold text-white">{toCrypto.symbol}</h3>
                    <p className="text-lg font-bold text-white">{toAmount}</p>
                    <p className="text-sm text-gray-400">Solde: {toCrypto.balance}</p>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Taux d'échange:</span>
                    <span className="text-white">1 {fromCrypto.symbol} = {exchangeRate.toFixed(6)} {toCrypto.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Frais d'échange (0.25%):</span>
                    <span className="text-white">{calculateFee().toFixed(6)} {fromCrypto.symbol}</span>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-400">Vous recevrez:</span>
                    <span className="text-green-400">{toAmount} {toCrypto.symbol}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('form')}
                  className="flex-1 border-gray-600 text-white"
                  disabled={isCalculating}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={handleExchange}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isCalculating}
                >
                  {isCalculating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Traitement...
                    </div>
                  ) : (
                    <>
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Confirmer l'Échange
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/client/dashboard">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour Dashboard
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Échange de Cryptomonnaies</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exchange Form */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="exchange" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="exchange" className="text-white data-[state=active]:bg-blue-600">
                  Échange
                </TabsTrigger>
                <TabsTrigger value="history" className="text-white data-[state=active]:bg-blue-600">
                  Historique
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exchange">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <ArrowUpDown className="w-5 h-5 text-blue-400" />
                      Échanger des Cryptomonnaies
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* From Crypto */}
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">De</label>
                      <div className="space-y-3">
                        <select 
                          value={fromCrypto.id}
                          onChange={(e) => {
                            const selected = cryptoOptions.find(c => c.id === e.target.value);
                            if (selected) setFromCrypto(selected);
                          }}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        >
                          {cryptoOptions.map(crypto => (
                            <option key={crypto.id} value={crypto.id}>
                              {crypto.icon} {crypto.name} ({crypto.symbol})
                            </option>
                          ))}
                        </select>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            step="0.00000001"
                            value={fromAmount}
                            onChange={(e) => handleFromAmountChange(e.target.value)}
                            placeholder="0.00"
                            className="flex-1 bg-gray-800 border-gray-600 text-white"
                          />
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleFromAmountChange(fromCrypto.balance.toString())}
                            className="border-gray-600 text-white"
                          >
                            MAX
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Solde disponible: {fromCrypto.balance} {fromCrypto.symbol}
                        </p>
                      </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSwapCryptos}
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        <ArrowUpDown className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* To Crypto */}
                    <div className="space-y-2">
                      <label className="text-white text-sm font-medium">Vers</label>
                      <div className="space-y-3">
                        <select 
                          value={toCrypto.id}
                          onChange={(e) => {
                            const selected = cryptoOptions.find(c => c.id === e.target.value);
                            if (selected) setToCrypto(selected);
                          }}
                          className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
                        >
                          {cryptoOptions.map(crypto => (
                            <option key={crypto.id} value={crypto.id}>
                              {crypto.icon} {crypto.name} ({crypto.symbol})
                            </option>
                          ))}
                        </select>
                        <Input
                          type="number"
                          step="0.00000001"
                          value={toAmount}
                          onChange={(e) => handleToAmountChange(e.target.value)}
                          placeholder="0.00"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <p className="text-sm text-gray-400">
                          Solde disponible: {toCrypto.balance} {toCrypto.symbol}
                        </p>
                      </div>
                    </div>

                    {/* Exchange Details */}
                    {fromAmount && toAmount && (
                      <div className="bg-gray-800 rounded-lg p-4">
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Taux d'échange:</span>
                            <span className="text-white">1 {fromCrypto.symbol} = {exchangeRate.toFixed(6)} {toCrypto.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Frais d'échange (0.25%):</span>
                            <span className="text-white">{calculateFee().toFixed(6)} {fromCrypto.symbol}</span>
                          </div>
                          <Separator className="bg-gray-700" />
                          <div className="flex justify-between font-semibold">
                            <span className="text-gray-400">Vous recevrez:</span>
                            <span className="text-green-400">{toAmount} {toCrypto.symbol}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Button 
                      onClick={() => setStep('confirm')}
                      disabled={!fromAmount || !toAmount || parseFloat(fromAmount) > fromCrypto.balance}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <ArrowUpDown className="w-4 h-4 mr-2" />
                      Prévisualiser l'Échange
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-400" />
                      Historique des Échanges
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {exchangeHistory.map((exchange) => (
                        <div key={exchange.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{cryptoOptions.find(c => c.id === exchange.fromSymbol)?.icon}</span>
                              <ArrowUpDown className="w-4 h-4 text-gray-400" />
                              <span className="text-lg">{cryptoOptions.find(c => c.id === exchange.toSymbol)?.icon}</span>
                            </div>
                            <div>
                              <p className="text-white font-medium">
                                {exchange.fromAmount} {exchange.fromSymbol} → {exchange.toAmount} {exchange.toSymbol}
                              </p>
                              <p className="text-sm text-gray-400">{exchange.timestamp}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={`${getStatusColor(exchange.status)} text-white`}>
                              {getStatusText(exchange.status)}
                            </Badge>
                            <p className="text-sm text-gray-400 mt-1">Frais: {exchange.fee}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Market Info Sidebar */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Prix du Marché
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cryptoOptions.slice(0, 5).map((crypto) => (
                    <div key={crypto.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{crypto.icon}</span>
                        <span className="text-white text-sm">{crypto.symbol}</span>
                      </div>
                      <span className="text-white text-sm">${crypto.rate.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm">Informations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-3">
                  <p className="text-blue-200 text-sm">
                    <strong>Frais d'échange:</strong> 0.25% par transaction
                  </p>
                </div>
                <div className="bg-green-900/20 border border-green-600 rounded-lg p-3">
                  <p className="text-green-200 text-sm">
                    <strong>Traitement:</strong> Instantané pour la plupart des paires
                  </p>
                </div>
                <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-3">
                  <p className="text-yellow-200 text-sm">
                    <strong>Limite:</strong> Maximum 10 BTC équivalent par jour
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}