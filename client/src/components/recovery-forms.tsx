import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { client } from '@/lib/api';
import { Shield, Wallet, Key, HelpCircle, FileText, CreditCard, Clock, CheckCircle } from 'lucide-react';

interface RecoveryFormData {
  serviceType: string;
  clientName: string;
  clientEmail: string;
  phoneNumber: string;
  walletType: string;
  problemDescription: string;
  urgencyLevel: string;
  estimatedValue: number;
  additionalFiles?: FileList;
}

const WALLET_TYPES = [
  'Ledger Nano S/X',
  'MetaMask',
  'Trust Wallet',
  'Exodus',
  'Electrum',
  'Autre'
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Faible (7-14 jours)', price: '€299' },
  { value: 'medium', label: 'Moyenne (3-7 jours)', price: '€499' },
  { value: 'high', label: 'Élevée (24-72h)', price: '€799' },
  { value: 'critical', label: 'Critique (12-24h)', price: '€1299' }
];

export default function RecoveryForms() {
  const [formData, setFormData] = useState<RecoveryFormData>({
    serviceType: '',
    clientName: '',
    clientEmail: '',
    phoneNumber: '',
    walletType: '',
    problemDescription: '',
    urgencyLevel: '',
    estimatedValue: 0
  });
  const [activeService, setActiveService] = useState('wallet');
  const { toast } = useToast();

  const submitRecoveryMutation = useMutation({
    mutationFn: (data: RecoveryFormData) => client.submitRecoveryRequest(data),
    onSuccess: () => {
      toast({
        title: "Demande envoyée",
        description: "Votre demande de récupération a été envoyée. Un expert vous contactera sous 24h.",
      });
      setFormData({
        serviceType: '',
        clientName: '',
        clientEmail: '',
        phoneNumber: '',
        walletType: '',
        problemDescription: '',
        urgencyLevel: '',
        estimatedValue: 0
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de l'envoi de la demande",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientName || !formData.clientEmail || !formData.problemDescription) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    const completeFormData = {
      ...formData,
      serviceType: activeService
    };

    await submitRecoveryMutation.mutateAsync(completeFormData);
  };

  const getServiceInfo = (service: string) => {
    switch (service) {
      case 'wallet':
        return {
          title: 'Récupération de Wallet',
          description: 'Récupération d\'accès à votre portefeuille crypto perdu',
          icon: <Wallet className="h-6 w-6" />,
          features: ['Analyse forensique', 'Récupération de clés', 'Support multi-wallets']
        };
      case 'seed':
        return {
          title: 'Récupération de Seed Phrase',
          description: 'Reconstruction de votre phrase de récupération manquante',
          icon: <Key className="h-6 w-6" />,
          features: ['Reconstruction partielle', 'Validation cryptographique', 'Sécurité maximale']
        };
      case 'password':
        return {
          title: 'Récupération de Mot de Passe',
          description: 'Décryptage et récupération de mots de passe oubliés',
          icon: <Shield className="h-6 w-6" />,
          features: ['Attaque par dictionnaire', 'Brute force optimisé', 'Récupération garantie']
        };
      default:
        return {
          title: 'Service de Récupération',
          description: 'Service personnalisé selon vos besoins',
          icon: <HelpCircle className="h-6 w-6" />,
          features: ['Consultation d\'expert', 'Solution sur mesure', 'Support dédié']
        };
    }
  };

  const currentService = getServiceInfo(activeService);

  return (
    <div className="space-y-6">
      {/* Header avec tarification */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-3">
            {currentService.icon}
            <div>
              <CardTitle className="text-white">{currentService.title}</CardTitle>
              <CardDescription className="text-gray-300">
                {currentService.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {currentService.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-300 text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs pour les différents services */}
      <Tabs value={activeService} onValueChange={setActiveService} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="wallet" className="data-[state=active]:bg-[black] data-[state=active]:text-black">
            <Wallet className="h-4 w-4 mr-2" />
            Wallet
          </TabsTrigger>
          <TabsTrigger value="seed" className="data-[state=active]:bg-[black] data-[state=active]:text-black">
            <Key className="h-4 w-4 mr-2" />
            Seed Phrase
          </TabsTrigger>
          <TabsTrigger value="password" className="data-[state=active]:bg-[black] data-[state=active]:text-black">
            <Shield className="h-4 w-4 mr-2" />
            Mot de Passe
          </TabsTrigger>
          <TabsTrigger value="custom" className="data-[state=active]:bg-[black] data-[state=active]:text-black">
            <HelpCircle className="h-4 w-4 mr-2" />
            Personnalisé
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeService} className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Formulaire de Demande</CardTitle>
              <CardDescription className="text-gray-300">
                Remplissez tous les champs pour soumettre votre demande
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informations client */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-gray-300">Nom complet *</Label>
                    <Input
                      id="clientName"
                      value={formData.clientName}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Jean Dupont"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientEmail" className="text-gray-300">Email *</Label>
                    <Input
                      id="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="jean@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-gray-300">Téléphone</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>

                {/* Type de wallet */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Type de portefeuille</Label>
                  <Select value={formData.walletType} onValueChange={(value) => setFormData(prev => ({ ...prev, walletType: value }))}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Sélectionnez votre type de wallet" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {WALLET_TYPES.map(type => (
                        <SelectItem key={type} value={type} className="text-white">{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Description du problème */}
                <div className="space-y-2">
                  <Label htmlFor="problemDescription" className="text-gray-300">Description du problème *</Label>
                  <Textarea
                    id="problemDescription"
                    value={formData.problemDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, problemDescription: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white min-h-[120px]"
                    placeholder="Décrivez en détail votre problème, les circonstances, et toute information pertinente..."
                  />
                </div>

                {/* Valeur estimée */}
                <div className="space-y-2">
                  <Label htmlFor="estimatedValue" className="text-gray-300">Valeur estimée des cryptos (€)</Label>
                  <Input
                    id="estimatedValue"
                    type="number"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimatedValue: Number(e.target.value) }))}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="10000"
                  />
                </div>

                {/* Niveau d'urgence */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Niveau d'urgence</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {URGENCY_LEVELS.map(level => (
                      <div 
                        key={level.value}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.urgencyLevel === level.value 
                            ? 'border-[black] bg-[black]/10' 
                            : 'border-gray-600 bg-gray-700 hover:border-gray-500'
                        }`}
                        onClick={() => setFormData(prev => ({ ...prev, urgencyLevel: level.value }))}
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-white text-sm">{level.label}</span>
                          <Badge variant="outline" className="text-[black] border-[black]">
                            {level.price}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fichiers additionnels */}
                <div className="space-y-2">
                  <Label htmlFor="additionalFiles" className="text-gray-300">Fichiers supplémentaires</Label>
                  <Input
                    id="additionalFiles"
                    type="file"
                    multiple
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalFiles: e.target.files || undefined }))}
                    className="bg-gray-700 border-gray-600 text-white file:bg-[black] file:text-black file:border-0 file:rounded file:px-3 file:py-1"
                  />
                  <p className="text-xs text-gray-400">
                    Screenshots, logs, ou tout autre document utile (max 10MB par fichier)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={submitRecoveryMutation.isPending}
                  className="w-full bg-[black] hover:bg-[black]/90 text-black font-medium py-3"
                >
                  {submitRecoveryMutation.isPending ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Soumettre la demande
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Information sur le processus */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Processus de Récupération
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 bg-[black] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-black font-bold">1</span>
              </div>
              <h4 className="text-white font-medium mb-2">Analyse</h4>
              <p className="text-gray-400 text-sm">Nos experts analysent votre cas et évaluent la faisabilité</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-[black] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-black font-bold">2</span>
              </div>
              <h4 className="text-white font-medium mb-2">Récupération</h4>
              <p className="text-gray-400 text-sm">Utilisation d'outils avancés pour récupérer vos cryptos</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-[black] rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-black font-bold">3</span>
              </div>
              <h4 className="text-white font-medium mb-2">Restitution</h4>
              <p className="text-gray-400 text-sm">Transfert sécurisé vers votre nouveau portefeuille</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}