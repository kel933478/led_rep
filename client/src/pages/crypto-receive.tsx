import React, { useState } from 'react';
import { ArrowLeft, Copy, Download, Share2, QrCode, Wallet, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

const cryptoOptions = [
  { 
    id: 'BTC', 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
    network: 'Bitcoin',
    qrData: 'bitcoin:bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
  },
  { 
    id: 'ETH', 
    name: 'Ethereum', 
    symbol: 'ETH', 
    address: '0x742d35Cc6734C0532925a3b8D017542f8c5e8E99',
    network: 'Ethereum',
    qrData: 'ethereum:0x742d35Cc6734C0532925a3b8D017542f8c5e8E99'
  },
  { 
    id: 'USDT', 
    name: 'Tether', 
    symbol: 'USDT', 
    address: '0x742d35Cc6734C0532925a3b8D017542f8c5e8E99',
    network: 'Ethereum (ERC-20)',
    qrData: 'ethereum:0x742d35Cc6734C0532925a3b8D017542f8c5e8E99'
  },
  { 
    id: 'BNB', 
    name: 'BNB', 
    symbol: 'BNB', 
    address: 'bnb1grpf0955h0ykzusd9m0czkxlvql5wv5pz6n22g',
    network: 'BNB Smart Chain',
    qrData: 'bnb:bnb1grpf0955h0ykzusd9m0czkxlvql5wv5pz6n22g'
  },
  { 
    id: 'ADA', 
    name: 'Cardano', 
    symbol: 'ADA', 
    address: 'addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn493x5ammj7s4pjw3u',
    network: 'Cardano',
    qrData: 'cardano:addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn493x5ammj7s4pjw3u'
  },
  { 
    id: 'DOT', 
    name: 'Polkadot', 
    symbol: 'DOT', 
    address: '14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3',
    network: 'Polkadot',
    qrData: 'polkadot:14E5nqKAp3oAJcmzgZhUD2RcptBeUBScxKHgJKU4HPNcKVf3'
  },
  { 
    id: 'LINK', 
    name: 'Chainlink', 
    symbol: 'LINK', 
    address: '0x742d35Cc6734C0532925a3b8D017542f8c5e8E99',
    network: 'Ethereum (ERC-20)',
    qrData: 'ethereum:0x742d35Cc6734C0532925a3b8D017542f8c5e8E99'
  },
  { 
    id: 'LTC', 
    name: 'Litecoin', 
    symbol: 'LTC', 
    address: 'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
    network: 'Litecoin',
    qrData: 'litecoin:ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
  },
  { 
    id: 'SOL', 
    name: 'Solana', 
    symbol: 'SOL', 
    address: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
    network: 'Solana',
    qrData: 'solana:7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj'
  },
  { 
    id: 'MATIC', 
    name: 'Polygon', 
    symbol: 'MATIC', 
    address: '0x742d35Cc6734C0532925a3b8D017542f8c5e8E99',
    network: 'Polygon',
    qrData: 'polygon:0x742d35Cc6734C0532925a3b8D017542f8c5e8E99'
  }
];

// Simple QR Code generator using SVG
const generateQRCode = (data: string, size: number = 200) => {
  // This is a simplified QR code placeholder - in production, use a proper QR library
  const squares = [];
  const gridSize = 25;
  const squareSize = size / gridSize;
  
  // Generate a pattern based on the data hash
  const hash = data.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const shouldFill = (i * j + hash) % 3 === 0;
      if (shouldFill) {
        squares.push(
          <rect
            key={`${i}-${j}`}
            x={i * squareSize}
            y={j * squareSize}
            width={squareSize}
            height={squareSize}
            fill="#000000"
          />
        );
      }
    }
  }
  
  return (
    <svg width={size} height={size} className="border rounded-lg">
      <rect width={size} height={size} fill="#ffffff" />
      {squares}
    </svg>
  );
};

export default function CryptoReceive() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoOptions[0]);
  const [customAmount, setCustomAmount] = useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: `${type} copied successfully`,
    });
  };

  const shareAddress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Receive ${selectedCrypto.symbol}`,
          text: `Send ${selectedCrypto.symbol} to this address:`,
          url: selectedCrypto.address,
        });
      } catch (error) {
        // Fallback to copy
        copyToClipboard(selectedCrypto.address, 'Address');
      }
    } else {
      copyToClipboard(selectedCrypto.address, 'Address');
    }
  };

  const downloadQR = () => {
    // Create a canvas to generate downloadable QR code
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 400;
    canvas.height = 500;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Receive ${selectedCrypto.symbol}`, canvas.width / 2, 30);
    
    // QR placeholder (in production, use proper QR generation)
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(50, 50, 300, 300);
    ctx.fillStyle = '#000000';
    ctx.fillRect(100, 100, 200, 200);
    
    // Address
    ctx.font = '12px monospace';
    const words = selectedCrypto.address.match(/.{1,30}/g) || [];
    words.forEach((word, index) => {
      ctx.fillText(word, canvas.width / 2, 380 + (index * 15));
    });
    
    // Download
    const link = document.createElement('a');
    link.download = `${selectedCrypto.symbol}-address-qr.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    toast({
      title: "QR Code downloaded",
      description: "QR code saved to your downloads",
    });
  };

  const getPaymentURI = () => {
    let uri = selectedCrypto.qrData;
    if (customAmount) {
      uri += `?amount=${customAmount}`;
    }
    return uri;
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/client">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">{t('receive')} Cryptocurrency</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Crypto Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Select Cryptocurrency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cryptoOptions.map((crypto) => (
                  <div
                    key={crypto.id}
                    onClick={() => setSelectedCrypto(crypto)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedCrypto.id === crypto.id
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                        <span className="font-bold text-white text-sm">{crypto.symbol.charAt(0)}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{crypto.symbol}</h3>
                        <p className="text-sm text-gray-400">{crypto.name}</p>
                      </div>
                      {selectedCrypto.id === crypto.id && (
                        <CheckCircle className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="qr" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="qr" className="text-white data-[state=active]:bg-blue-600">
                  QR Code
                </TabsTrigger>
                <TabsTrigger value="address" className="text-white data-[state=active]:bg-blue-600">
                  Address
                </TabsTrigger>
              </TabsList>

              <TabsContent value="qr" className="space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white flex items-center gap-2">
                        <QrCode className="w-5 h-5" />
                        QR Code for {selectedCrypto.name}
                      </CardTitle>
                      <Badge variant="secondary" className="bg-gray-700 text-white">
                        {selectedCrypto.network}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Amount Input */}
                    <div>
                      <Label htmlFor="amount" className="text-white mb-2 block">
                        Specific Amount (Optional)
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="amount"
                          type="number"
                          step="0.00000001"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="0.00"
                          className="bg-gray-800 border-gray-600 text-white"
                        />
                        <Badge variant="secondary" className="bg-gray-700 text-white px-3 py-2">
                          {selectedCrypto.symbol}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-400 mt-1">
                        Leave blank for any amount
                      </p>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-lg">
                        {generateQRCode(getPaymentURI(), 250)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={downloadQR}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR
                      </Button>
                      <Button 
                        onClick={shareAddress}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Address
                      </Button>
                    </div>

                    {/* Warning */}
                    <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                      <p className="text-yellow-200 text-sm">
                        <strong>Important:</strong> Only send {selectedCrypto.symbol} to this address. 
                        Sending other cryptocurrencies may result in permanent loss.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="address" className="space-y-6">
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {selectedCrypto.name} Wallet Address
                      </CardTitle>
                      <Badge variant="secondary" className="bg-gray-700 text-white">
                        {selectedCrypto.network}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Address Display */}
                    <div>
                      <Label className="text-white mb-2 block">
                        Wallet Address
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={selectedCrypto.address}
                          readOnly
                          className="bg-gray-800 border-gray-600 text-white font-mono text-sm"
                        />
                        <Button 
                          size="icon"
                          onClick={() => copyToClipboard(selectedCrypto.address, 'Address')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Network Info */}
                    <div className="bg-gray-800 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-3">Network Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Network:</span>
                          <span className="text-white">{selectedCrypto.network}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Symbol:</span>
                          <span className="text-white">{selectedCrypto.symbol}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Address Type:</span>
                          <span className="text-white">
                            {selectedCrypto.id === 'BTC' ? 'Bech32 (Native SegWit)' : 
                             selectedCrypto.network.includes('ERC-20') ? 'ERC-20 Token' : 'Native'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">How to Send {selectedCrypto.symbol}</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                          <span>Copy the wallet address above</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                          <span>Open your wallet app or exchange</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                          <span>Select "Send" or "Withdraw" {selectedCrypto.symbol}</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</span>
                          <span>Paste the address and confirm the transaction</span>
                        </div>
                      </div>
                    </div>

                    {/* Warning */}
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-4">
                      <p className="text-red-200 text-sm">
                        <strong>⚠️ Warning:</strong> Always double-check the address before sending. 
                        Cryptocurrency transactions are irreversible. Make sure you're sending on the correct network.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-4">
                      <Button 
                        onClick={() => copyToClipboard(selectedCrypto.address, 'Address')}
                        variant="outline"
                        className="border-gray-600 text-white hover:bg-gray-800"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Address
                      </Button>
                      <Button 
                        onClick={shareAddress}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Address
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}