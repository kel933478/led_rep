import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { clientApi } from '@/lib/api';
import { useLanguage } from '@/hooks/use-language';
import QRCode from 'qrcode';
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
  ExternalLink,
  QrCode
} from 'lucide-react';

export default function TaxPaymentSystem() {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [transactionHash, setTransactionHash] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const { toast } = useToast();
  const { t } = useLanguage();

  const { data: taxInfo } = useQuery({
    queryKey: ['/api/client/tax-payment-info'],
    queryFn: async () => {
      const res = await fetch('/api/client/tax-payment-info', {
        credentials: 'include'
      });
      return res.json();
    },
  });

  // Générer le QR code quand les données de taxe sont disponibles
  useEffect(() => {
    if (taxInfo?.taxWalletAddress && taxInfo?.taxAmount && taxInfo?.taxCurrency) {
      const generateQR = async () => {
        try {
          let qrData = '';
          
          // Format URI selon la crypto-monnaie
          if (taxInfo.taxCurrency === 'BTC') {
            qrData = `bitcoin:${taxInfo.taxWalletAddress}?amount=${parseFloat(taxInfo.taxAmount) / 100000000}`;
          } else if (taxInfo.taxCurrency === 'ETH') {
            qrData = `ethereum:${taxInfo.taxWalletAddress}?value=${parseFloat(taxInfo.taxAmount)}e18`;
          } else if (taxInfo.taxCurrency === 'USDT') {
            qrData = `ethereum:${taxInfo.taxWalletAddress}?value=${parseFloat(taxInfo.taxAmount)}e6`;
          } else {
            qrData = taxInfo.taxWalletAddress;
          }
          
          const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });
          
          setQrCodeUrl(qrCodeDataUrl);
        } catch (error) {
          console.error('Erreur génération QR code:', error);
        }
      };
      
      generateQR();
    }
  }, [taxInfo]);

  const submitProofMutation = useMutation({
    mutationFn: (data: any) => clientApi.submitTaxPaymentProof(data),
    onSuccess: () => {
      toast({
        title: t('proofSubmitted'),
        description: t('proofSubmittedMessage'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/client/tax-info'] });
      setPaymentProof(null);
      setTransactionHash('');
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('error'),
        variant: "destructive",
      });
    }
  });

  const copyToClipboard = (text: string, type: 'address' | 'amount' = 'address') => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('success'),
      description: type === 'address' ? t('addressCopied') : t('amountCopied'),
    });
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!paymentProof && !transactionHash) {
      toast({
        title: t('proofRequired'),
        description: t('proofRequiredMessage'),
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
        return <Badge variant="secondary" className="bg-red-500 text-white"><AlertTriangle size={12} className="mr-1" />{t('taxUnpaid')}</Badge>;
      case 'pending_verification':
        return <Badge variant="secondary" className="bg-yellow-500 text-white"><Clock size={12} className="mr-1" />{t('taxPending')}</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-500 text-white"><CheckCircle size={12} className="mr-1" />{t('taxPaid')}</Badge>;
      case 'exempted':
        return <Badge variant="secondary" className="bg-blue-500 text-white"><Shield size={12} className="mr-1" />{t('taxExempt')}</Badge>;
      default:
        return <Badge variant="outline">{t('never')}</Badge>;
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
          <h3 className="text-xl font-medium text-white mb-2">{t('taxExemptionTitle')}</h3>
          <p className="text-gray-400">
            {t('taxExemptionMessage')}
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
          <h3 className="text-xl font-medium text-white mb-2">{t('taxPaidTitle')}</h3>
          <p className="text-gray-400 mb-4">
            {t('taxPaidMessage')}
          </p>
          {taxInfo.transactionHash && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getExplorerUrl(taxInfo.taxCurrency, taxInfo.transactionHash), '_blank')}
              className="border-gray-600 text-gray-300"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t('viewTransaction')}
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
          <strong>{t('taxRecoveryAlert')}</strong> {t('taxRecoveryAlertMessage')}
        </AlertDescription>
      </Alert>

      {/* Informations de la taxe */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            {t('taxRecoveryTitle')}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {t('taxRecoverySubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* QR Code */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <QrCode className="h-6 w-6 text-gray-600 mx-auto mb-2" />
                <div className="text-sm text-gray-600 mb-3 font-medium">{t('qrCodeScanToPay')}</div>
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code Paiement" 
                    className="mx-auto rounded-lg shadow-lg"
                    style={{ width: '180px', height: '180px' }}
                  />
                ) : (
                  <div className="w-[180px] h-[180px] mx-auto bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  {t('qrCodeScanWith')} {taxInfo.taxCurrency}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">{t('paymentAddress')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-gray-700 p-3 rounded-lg flex-1 font-mono text-xs text-white break-all">
                    {taxInfo.taxWalletAddress}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(taxInfo.taxWalletAddress, 'address')}
                    className="border-gray-600 hover:bg-[#FFB800] hover:text-black"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(taxInfo.taxWalletAddress, 'address')}
                  className="w-full mt-2 text-[#FFB800] hover:bg-[#FFB800]/10"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  {t('copyFullAddress')}
                </Button>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">{t('exactAmountToSend')}</Label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="bg-gray-700 p-3 rounded-lg flex-1 text-white font-bold">
                    {getCurrencyIcon(taxInfo.taxCurrency)} {taxInfo.taxAmount} {taxInfo.taxCurrency}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(`${taxInfo.taxAmount}`, 'amount')}
                    className="border-gray-600 hover:bg-[#FFB800] hover:text-black"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-gray-300 text-sm">{t('paymentCurrency')}</Label>
                <div className="bg-gray-700 p-3 rounded-lg mt-1">
                  <span className="text-white font-medium">{taxInfo.taxCurrency}</span>
                  <span className="text-gray-400 ml-2">
                    {taxInfo.taxCurrency === 'BTC' && t('bitcoin')}
                    {taxInfo.taxCurrency === 'ETH' && t('ethereum')}
                    {taxInfo.taxCurrency === 'USDT' && t('tether')}
                  </span>
                </div>
              </div>

              {taxInfo.taxReason && (
                <div>
                  <Label className="text-gray-300 text-sm">{t('taxReason')}</Label>
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
              {t('paymentProof')}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {t('submitPaymentProofDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProof} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="transactionHash" className="text-gray-300">{t('transactionHash')}</Label>
                <Input
                  id="transactionHash"
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white font-mono"
                  placeholder={t('transactionHashPlaceholder')}
                />
                <p className="text-xs text-gray-400">
                  {t('transactionHashHelp')}
                </p>
              </div>

              <div className="text-center text-gray-400 text-sm">
                {t('or')}
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentProof" className="text-gray-300">{t('paymentScreenshot')}</Label>
                <Input
                  id="paymentProof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
                  className="bg-gray-700 border-gray-600 text-white file:bg-[#FFB800] file:text-black file:border-0 file:rounded file:px-3 file:py-1"
                />
                <p className="text-xs text-gray-400">
                  {t('acceptedFormats')}
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
                    {t('sendingInProgress')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {t('submitProof')}
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
            <h3 className="text-xl font-medium text-white mb-2">{t('verificationInProgress')}</h3>
            <p className="text-gray-400 mb-4">
              {t('verificationInProgressMessage')}
            </p>
            <Badge variant="secondary" className="bg-yellow-500 text-white">
              <Clock size={12} className="mr-1" />
              {t('usualDelay')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Instructions de paiement */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t('paymentInstructions')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">1</div>
            <p className="text-gray-300 text-sm">
              {t('taxStep1')} {taxInfo.taxCurrency} {t('taxStep1Detail')}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">2</div>
            <p className="text-gray-300 text-sm">
              {t('taxStep2')} {getCurrencyIcon(taxInfo.taxCurrency)} {taxInfo.taxAmount} {taxInfo.taxCurrency} {t('taxStep2Detail')}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">3</div>
            <p className="text-gray-300 text-sm">
              {t('taxStep3')}
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-[#FFB800] rounded-full flex items-center justify-center text-black text-sm font-bold flex-shrink-0">4</div>
            <p className="text-gray-300 text-sm">
              {t('taxStep4')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}