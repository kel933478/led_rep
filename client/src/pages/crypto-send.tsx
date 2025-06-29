import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Send, Wallet, AlertTriangle, QrCode, Copy, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

const sendSchema = z.object({
  cryptoType: z.string().min(1, "Please select a cryptocurrency"),
  recipientAddress: z.string().min(26, "Invalid address format"),
  amount: z.number().min(0.00000001, "Amount must be greater than 0"),
  note: z.string().optional()
});

type SendFormData = z.infer<typeof sendSchema>;

const cryptoOptions = [
  { id: 'BTC', name: 'Bitcoin', symbol: 'BTC', balance: 0.15234567, fee: 0.0001 },
  { id: 'ETH', name: 'Ethereum', symbol: 'ETH', balance: 2.45678912, fee: 0.002 },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', balance: 1250.50, fee: 5.0 },
  { id: 'BNB', name: 'BNB', symbol: 'BNB', balance: 5.12345678, fee: 0.001 },
  { id: 'ADA', name: 'Cardano', symbol: 'ADA', balance: 125.567, fee: 0.5 },
  { id: 'DOT', name: 'Polkadot', symbol: 'DOT', balance: 25.123, fee: 0.01 },
  { id: 'LINK', name: 'Chainlink', symbol: 'LINK', balance: 15.789, fee: 0.1 },
  { id: 'LTC', name: 'Litecoin', symbol: 'LTC', balance: 3.45678, fee: 0.001 },
  { id: 'SOL', name: 'Solana', symbol: 'SOL', balance: 8.91234, fee: 0.00025 },
  { id: 'MATIC', name: 'Polygon', symbol: 'MATIC', balance: 234.567, fee: 0.01 }
];

export default function CryptoSend() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState<typeof cryptoOptions[0] | null>(null);
  const [step, setStep] = useState<'form' | 'confirm' | 'success'>('form');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<SendFormData>({
    resolver: zodResolver(sendSchema),
    defaultValues: {
      cryptoType: '',
      recipientAddress: '',
      amount: 0,
      note: ''
    }
  });

  const onSubmit = async (data: SendFormData) => {
    setIsLoading(true);
    try {
      // Simulate transaction processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock transaction hash
      const mockHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTransactionHash(mockHash);
      setStep('success');
      
      toast({
        title: "Transaction sent successfully",
        description: `Your ${selectedCrypto?.symbol} has been sent`,
      });
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCryptoSelect = (crypto: typeof cryptoOptions[0]) => {
    setSelectedCrypto(crypto);
    form.setValue('cryptoType', crypto.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Transaction hash copied",
    });
  };

  const calculateTotal = () => {
    const amount = form.watch('amount') || 0;
    const fee = selectedCrypto?.fee || 0;
    return amount + fee;
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/client">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">{t('send')} {selectedCrypto?.symbol}</h1>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-2">Transaction Sent Successfully!</h2>
              <p className="text-gray-400 mb-6">Your transaction has been broadcasted to the network</p>
              
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Transaction Hash:</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(transactionHash)}
                    className="text-white p-1"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-white font-mono text-xs break-all mt-2">{transactionHash}</p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">{form.getValues('amount')} {selectedCrypto?.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Network Fee:</span>
                  <span className="text-white">{selectedCrypto?.fee} {selectedCrypto?.symbol}</span>
                </div>
                <Separator className="bg-gray-700" />
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-400">Total:</span>
                  <span className="text-white">{calculateTotal()} {selectedCrypto?.symbol}</span>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button 
                  onClick={() => {
                    setStep('form');
                    form.reset();
                    setSelectedCrypto(null);
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Send Another
                </Button>
                <Link href="/client" className="flex-1">
                  <Button variant="outline" className="w-full border-gray-600 text-white">
                    Back to Dashboard
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
      <div className="min-h-screen bg-black text-white p-6">
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
            <h1 className="text-2xl font-bold">Confirm Transaction</h1>
          </div>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Review Transaction Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert className="bg-yellow-900/20 border-yellow-600">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Please review all details carefully. Cryptocurrency transactions are irreversible.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg">
                  <div className="w-12 h-12 bg-orange-600 rounded-full flex items-center justify-center">
                    <span className="font-bold text-white">{selectedCrypto?.symbol.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedCrypto?.name}</h3>
                    <p className="text-sm text-gray-400">Balance: {selectedCrypto?.balance} {selectedCrypto?.symbol}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-gray-400">Recipient Address</Label>
                    <p className="text-white font-mono text-sm break-all bg-gray-800 p-3 rounded">
                      {form.getValues('recipientAddress')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Amount</Label>
                      <p className="text-white font-semibold">{form.getValues('amount')} {selectedCrypto?.symbol}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Network Fee</Label>
                      <p className="text-white">{selectedCrypto?.fee} {selectedCrypto?.symbol}</p>
                    </div>
                  </div>

                  <Separator className="bg-gray-700" />

                  <div>
                    <Label className="text-gray-400">Total Amount</Label>
                    <p className="text-white font-bold text-lg">{calculateTotal()} {selectedCrypto?.symbol}</p>
                  </div>

                  {form.getValues('note') && (
                    <div>
                      <Label className="text-gray-400">Note</Label>
                      <p className="text-white">{form.getValues('note')}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep('form')}
                  className="flex-1 border-gray-600 text-white"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={form.handleSubmit(onSubmit)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Confirm & Send
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
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/client">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('send')} Cryptocurrency</h1>
        </div>

        <form onSubmit={form.handleSubmit(() => setStep('confirm'))} className="space-y-6">
          {/* Crypto Selection */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Select Cryptocurrency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cryptoOptions.map((crypto) => (
                  <div
                    key={crypto.id}
                    onClick={() => handleCryptoSelect(crypto)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedCrypto?.id === crypto.id
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                          <span className="font-bold text-white text-sm">{crypto.symbol.charAt(0)}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{crypto.symbol}</h3>
                          <p className="text-sm text-gray-400">{crypto.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{crypto.balance}</p>
                        <p className="text-sm text-gray-400">Available</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCrypto && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Transaction Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="recipientAddress" className="text-white">
                    Recipient Address *
                  </Label>
                  <Input
                    id="recipientAddress"
                    {...form.register('recipientAddress')}
                    placeholder="Enter recipient wallet address"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                  {form.formState.errors.recipientAddress && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.recipientAddress.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="amount" className="text-white">
                    Amount *
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      step="0.00000001"
                      {...form.register('amount', { valueAsNumber: true })}
                      placeholder="0.00"
                      className="bg-gray-800 border-gray-600 text-white pr-16"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge variant="secondary" className="bg-gray-700 text-white">
                        {selectedCrypto.symbol}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-400">
                      Available: {selectedCrypto.balance} {selectedCrypto.symbol}
                    </span>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      onClick={() => form.setValue('amount', selectedCrypto.balance - selectedCrypto.fee)}
                      className="text-blue-400 p-0 h-auto"
                    >
                      Max
                    </Button>
                  </div>
                  {form.formState.errors.amount && (
                    <p className="text-red-400 text-sm mt-1">
                      {form.formState.errors.amount.message}
                    </p>
                  )}
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Network Fee:</span>
                    <span className="text-white">{selectedCrypto.fee} {selectedCrypto.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm font-semibold">
                    <span className="text-gray-400">Total:</span>
                    <span className="text-white">{calculateTotal()} {selectedCrypto.symbol}</span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="note" className="text-white">
                    Note (Optional)
                  </Label>
                  <Input
                    id="note"
                    {...form.register('note')}
                    placeholder="Add a note for this transaction"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!form.formState.isValid}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Review Transaction
                </Button>
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
}