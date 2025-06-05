import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  UserPlus, 
  Wallet, 
  Mail, 
  Phone, 
  MapPin, 
  Globe,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react';

interface CreateClientFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateClientForm({ onSuccess, onCancel }: CreateClientFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    country: 'France',
    amount: 50000,
    enableTax: false,
    taxAmount: 500,
    taxCurrency: 'USDT',
    taxWalletAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    taxReason: 'Frais de récupération obligatoires'
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const { toast } = useToast();

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/admin/create-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedPassword(data.temporaryPassword);
      toast({
        title: "Compte créé avec succès",
        description: `Client ${data.client.email} créé avec un mot de passe temporaire`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      if (onSuccess) onSuccess();
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
    
    if (!formData.email || !formData.fullName) {
      toast({
        title: "Erreur",
        description: "Email et nom complet sont requis",
        variant: "destructive",
      });
      return;
    }

    const submitData = {
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      address: formData.address,
      country: formData.country,
      amount: formData.amount,
      taxConfig: formData.enableTax ? {
        amount: formData.taxAmount,
        currency: formData.taxCurrency,
        walletAddress: formData.taxWalletAddress,
        reason: formData.taxReason
      } : null
    };

    createClientMutation.mutate(submitData);
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast({
      title: "Copié",
      description: "Mot de passe temporaire copié dans le presse-papiers",
    });
  };

  return (
    <Card className="bg-gray-800 border-gray-700 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Créer un nouveau compte client
        </CardTitle>
        <CardDescription className="text-gray-300">
          Générer un compte client avec informations initiales et configuration de taxe optionnelle
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {generatedPassword ? (
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <h3 className="text-green-400 font-medium">Compte créé avec succès</h3>
            </div>
            <p className="text-gray-300 mb-3">
              Le compte client a été créé. Voici le mot de passe temporaire :
            </p>
            <div className="flex items-center gap-2 bg-gray-900 p-3 rounded border">
              <code className="text-green-400 font-mono flex-1">{generatedPassword}</code>
              <Button size="sm" variant="ghost" onClick={copyPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-2">
              Communiquez ce mot de passe au client. Il pourra le changer après sa première connexion.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Informations personnelles
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="text-gray-300">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="client@exemple.com"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fullName" className="text-gray-300">Nom complet *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Jean Dupont"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phone" className="text-gray-300">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country" className="text-gray-300">Pays</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="France">France</SelectItem>
                      <SelectItem value="Belgique">Belgique</SelectItem>
                      <SelectItem value="Suisse">Suisse</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="USA">États-Unis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="address" className="text-gray-300">Adresse</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="123 Rue de la Paix, 75001 Paris"
                  rows={2}
                />
              </div>
            </div>

            {/* Configuration du portefeuille */}
            <div className="space-y-4">
              <h3 className="text-white font-medium flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Configuration du portefeuille
              </h3>
              
              <div>
                <Label htmlFor="amount" className="text-gray-300">Montant récupérable (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="50000"
                />
                <p className="text-sm text-gray-400 mt-1">
                  Montant total que le client pourra récupérer après validation
                </p>
              </div>
            </div>

            {/* Configuration de la taxe */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Taxe de récupération
                </h3>
                <Switch
                  checked={formData.enableTax}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableTax: checked })}
                />
              </div>
              
              {formData.enableTax && (
                <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 space-y-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm">Configuration de la taxe obligatoire</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="taxAmount" className="text-gray-300">Montant</Label>
                      <Input
                        id="taxAmount"
                        type="number"
                        value={formData.taxAmount}
                        onChange={(e) => setFormData({ ...formData, taxAmount: parseFloat(e.target.value) || 0 })}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="500"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="taxCurrency" className="text-gray-300">Devise</Label>
                      <Select value={formData.taxCurrency} onValueChange={(value) => setFormData({ ...formData, taxCurrency: value })}>
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                          <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                          <SelectItem value="USDT">Tether (USDT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="taxWalletAddress" className="text-gray-300">Adresse wallet de paiement</Label>
                    <Input
                      id="taxWalletAddress"
                      value={formData.taxWalletAddress}
                      onChange={(e) => setFormData({ ...formData, taxWalletAddress: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white font-mono text-sm"
                      placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="taxReason" className="text-gray-300">Motif de la taxe</Label>
                    <Textarea
                      id="taxReason"
                      value={formData.taxReason}
                      onChange={(e) => setFormData({ ...formData, taxReason: e.target.value })}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Frais de récupération obligatoires"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Annuler
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={createClientMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createClientMutation.isPending ? 'Création...' : 'Créer le compte'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}