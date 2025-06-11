import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api';
import RecoveryForms from '@/components/recovery-forms';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Users,
  Wallet,
  Key,
  HelpCircle,
  Star,
  Award,
  Target
} from 'lucide-react';

export default function RecoveryCenter() {
  const [activeTab, setActiveTab] = useState('services');

  const { data: recoveryRequests } = useQuery({
    queryKey: ['/api/client/recovery-requests'],
    queryFn: () => client.getRecoveryRequests(),
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-black text-white"><Clock size={12} className="mr-1" />En attente</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="bg-blue-500 text-white"><TrendingUp size={12} className="mr-1" />En cours</Badge>;
      case 'completed':
        return <Badge variant="secondary" className="bg-green-500 text-white"><CheckCircle size={12} className="mr-1" />Terminé</Badge>;
      case 'failed':
        return <Badge variant="secondary" className="bg-red-500 text-white"><AlertCircle size={12} className="mr-1" />Échec</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'wallet':
        return <Wallet className="h-5 w-5" />;
      case 'seed':
        return <Key className="h-5 w-5" />;
      case 'password':
        return <Shield className="h-5 w-5" />;
      default:
        return <HelpCircle className="h-5 w-5" />;
    }
  };

  const getServiceLabel = (serviceType: string) => {
    switch (serviceType) {
      case 'wallet':
        return 'Récupération de Wallet';
      case 'seed':
        return 'Récupération de Seed Phrase';
      case 'password':
        return 'Récupération de Mot de Passe';
      default:
        return 'Service Personnalisé';
    }
  };

  return (
    <div className="min-h-screen bg-[#17181C] text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#FFB800] to-[#FF9500] p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center">
              <Shield size={32} className="text-[#FFB800]" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-[#17181C]">Centre de Récupération</h1>
              <p className="text-[#17181C]/80 text-lg">Solutions professionnelles de récupération crypto</p>
            </div>
          </div>
          
          {/* Statistiques de succès */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Award className="h-6 w-6 text-[#17181C]" />
                <span className="text-2xl font-bold text-[#17181C]">98%</span>
              </div>
              <p className="text-[#17181C]/80">Taux de succès</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="h-6 w-6 text-[#17181C]" />
                <span className="text-2xl font-bold text-[#17181C]">2,847</span>
              </div>
              <p className="text-[#17181C]/80">Clients satisfaits</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Target className="h-6 w-6 text-[#17181C]" />
                <span className="text-2xl font-bold text-[#17181C]">€45M</span>
              </div>
              <p className="text-[#17181C]/80">Cryptos récupérées</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="services" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Shield className="h-4 w-4 mr-2" />
              Services de Récupération
            </TabsTrigger>
            <TabsTrigger value="requests" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <Clock className="h-4 w-4 mr-2" />
              Mes Demandes
            </TabsTrigger>
            <TabsTrigger value="support" className="data-[state=active]:bg-[#FFB800] data-[state=active]:text-black">
              <HelpCircle className="h-4 w-4 mr-2" />
              Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-6">
            <RecoveryForms />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <div className="space-y-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Mes Demandes de Récupération</CardTitle>
                  <CardDescription className="text-gray-300">
                    Suivez l'état d'avancement de vos demandes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recoveryRequests?.requests?.length > 0 ? (
                    <div className="space-y-4">
                      {recoveryRequests.requests.map((request: any) => (
                        <Card key={request.id} className="bg-gray-700 border-gray-600">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#FFB800] rounded-lg flex items-center justify-center">
                                  {getServiceIcon(request.serviceType)}
                                </div>
                                <div>
                                  <h3 className="text-white font-medium">{getServiceLabel(request.serviceType)}</h3>
                                  <p className="text-gray-400 text-sm">ID: {request.id}</p>
                                  <p className="text-gray-400 text-sm">
                                    Soumis le {new Date(request.submittedAt).toLocaleDateString('fr-FR')}
                                  </p>
                                  {request.estimatedCompletionDate && (
                                    <p className="text-gray-400 text-sm">
                                      Estimation: {new Date(request.estimatedCompletionDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                {getStatusBadge(request.status)}
                                <p className="text-gray-400 text-sm mt-2">
                                  Valeur: €{request.estimatedValue?.toLocaleString('fr-FR')}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 text-gray-500 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-white mb-2">Aucune demande</h3>
                      <p className="text-gray-400 mb-6">Vous n'avez pas encore soumis de demande de récupération</p>
                      <Button
                        onClick={() => setActiveTab('services')}
                        className="bg-[#FFB800] hover:bg-[#FFB800]/90 text-black"
                      >
                        Créer une demande
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    FAQ - Questions Fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b border-gray-600 pb-4">
                    <h4 className="text-white font-medium mb-2">Combien de temps prend une récupération ?</h4>
                    <p className="text-gray-400 text-sm">
                      Le délai varie selon la complexité et l'urgence : de 12h (critique) à 14 jours (standard).
                    </p>
                  </div>
                  <div className="border-b border-gray-600 pb-4">
                    <h4 className="text-white font-medium mb-2">Quel est votre taux de succès ?</h4>
                    <p className="text-gray-400 text-sm">
                      Notre taux de succès est de 98% pour les récupérations de wallets et seed phrases.
                    </p>
                  </div>
                  <div className="border-b border-gray-600 pb-4">
                    <h4 className="text-white font-medium mb-2">Mes données sont-elles sécurisées ?</h4>
                    <p className="text-gray-400 text-sm">
                      Oui, nous utilisons un cryptage de niveau militaire et supprimons toutes les données après récupération.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Contact Expert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#FFB800] rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="h-8 w-8 text-[#17181C]" />
                    </div>
                    <h4 className="text-white font-medium mb-2">Support 24/7</h4>
                    <p className="text-gray-400 text-sm mb-4">
                      Nos experts sont disponibles pour vous aider à tout moment
                    </p>
                    <div className="space-y-2">
                      <Button className="w-full bg-[#FFB800] hover:bg-[#FFB800]/90 text-black">
                        Chat en direct
                      </Button>
                      <Button variant="outline" className="w-full border-gray-600 text-gray-300">
                        Programmer un appel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}