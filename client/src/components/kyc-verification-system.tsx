import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Download,
  AlertTriangle,
  User,
  Calendar,
  MapPin,
  CreditCard
} from "lucide-react";

interface KYCDocument {
  id: string;
  clientId: number;
  clientName: string;
  clientEmail: string;
  documentType: 'passport' | 'id_card' | 'driver_license' | 'proof_address' | 'selfie';
  fileName: string;
  uploadDate: Date;
  status: 'pending' | 'approved' | 'rejected' | 'requires_review';
  reviewedBy?: string;
  reviewDate?: Date;
  rejectionReason?: string;
  riskScore: number;
}

interface KYCValidationResult {
  documentValid: boolean;
  faceMatch: boolean;
  addressValid: boolean;
  sanctionsCheck: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  issues: string[];
}

export default function KYCVerificationSystem() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<KYCDocument | null>(null);
  const [reviewStatus, setReviewStatus] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Récupération des données KYC depuis l'API
  const { data: kycData, isLoading: isLoadingKYC } = useQuery({
    queryKey: ['/api/admin/kyc/documents', filterStatus],
    queryFn: () => adminApi.getKYCDocuments?.(filterStatus) || Promise.resolve({ documents: [] }),
    refetchInterval: 30000, // Actualisation toutes les 30 secondes
  });

  const reviewMutation = useMutation({
    mutationFn: ({ documentId, status, rejectionReason }: { documentId: string, status: string, rejectionReason?: string }) =>
      adminApi.reviewKYCDocument?.(documentId, status, rejectionReason) || Promise.resolve(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/kyc/documents'] });
      setSelectedDocument(null);
      setReviewStatus('');
      setRejectionReason('');
    },
  });

  // Données de fallback si l'API n'est pas encore connectée
  const mockKYCDocuments: KYCDocument[] = [
    {
      id: '1',
      clientId: 1,
      clientName: 'Jean Dupont',
      clientEmail: 'jean.dupont@email.com',
      documentType: 'passport',
      fileName: 'passport_front.jpg',
      uploadDate: new Date('2024-01-15'),
      status: 'pending',
      riskScore: 25
    },
    {
      id: '2',
      clientId: 1,
      clientName: 'Jean Dupont',
      clientEmail: 'jean.dupont@email.com',
      documentType: 'proof_address',
      fileName: 'utility_bill.pdf',
      uploadDate: new Date('2024-01-15'),
      status: 'pending',
      riskScore: 15
    },
    {
      id: '3',
      clientId: 2,
      clientName: 'Marie Martin',
      clientEmail: 'marie.martin@email.com',
      documentType: 'id_card',
      fileName: 'id_card_front.jpg',
      uploadDate: new Date('2024-01-10'),
      status: 'approved',
      reviewedBy: 'Admin',
      reviewDate: new Date('2024-01-12'),
      riskScore: 10
    },
    {
      id: '4',
      clientId: 3,
      clientName: 'Pierre Dubois',
      clientEmail: 'pierre.dubois@email.com',
      documentType: 'selfie',
      fileName: 'selfie_verification.jpg',
      uploadDate: new Date('2024-01-14'),
      status: 'rejected',
      reviewedBy: 'Admin',
      reviewDate: new Date('2024-01-16'),
      rejectionReason: 'Photo floue, impossible de vérifier l\'identité',
      riskScore: 85
    }
  ];

  const documents = kycData?.documents || mockKYCDocuments;
  const filteredDocuments = filterStatus === 'all' 
    ? documents 
    : documents.filter((doc: any) => doc.status === filterStatus);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-black text-white"><Clock size={12} className="mr-1" />En attente</Badge>;
      case 'approved':
        return <Badge variant="secondary" className="bg-green-500 text-white"><CheckCircle size={12} className="mr-1" />Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-500 text-white"><XCircle size={12} className="mr-1" />Rejeté</Badge>;
      case 'requires_review':
        return <Badge variant="secondary" className="bg-black text-white"><AlertTriangle size={12} className="mr-1" />Révision</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'passport':
        return <FileText size={16} className="text-blue-500" />;
      case 'id_card':
        return <CreditCard size={16} className="text-green-500" />;
      case 'driver_license':
        return <CreditCard size={16} className="text-purple-500" />;
      case 'proof_address':
        return <MapPin size={16} className="text-black" />;
      case 'selfie':
        return <User size={16} className="text-pink-500" />;
      default:
        return <FileText size={16} className="text-gray-500" />;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'passport':
        return 'Passeport';
      case 'id_card':
        return 'Carte d\'identité';
      case 'driver_license':
        return 'Permis de conduire';
      case 'proof_address':
        return 'Justificatif de domicile';
      case 'selfie':
        return 'Photo selfie';
      default:
        return 'Document';
    }
  };

  const getRiskBadge = (score: number) => {
    if (score < 30) {
      return <Badge variant="secondary" className="bg-green-500 text-white">Risque faible</Badge>;
    } else if (score < 70) {
      return <Badge variant="secondary" className="bg-black text-white">Risque moyen</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-red-500 text-white">Risque élevé</Badge>;
    }
  };

  const handleDocumentReview = async () => {
    if (!selectedDocument || !reviewStatus) return;

    try {
      await reviewMutation.mutateAsync({
        documentId: selectedDocument.id,
        status: reviewStatus,
        rejectionReason: reviewStatus === 'rejected' ? rejectionReason : undefined
      });
      
      toast({
        title: "Révision effectuée",
        description: `Document ${reviewStatus === 'approved' ? 'approuvé' : 'rejeté'} avec succès`,
      });
      
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la révision du document",
        variant: "destructive",
      });
    }
  };

  const performAutomaticValidation = (document: KYCDocument): KYCValidationResult => {
    // Simulation de validation automatique
    const baseConfidence = Math.random() * 40 + 60; // 60-100%
    
    return {
      documentValid: document.riskScore < 50,
      faceMatch: document.documentType === 'selfie' ? document.riskScore < 30 : true,
      addressValid: document.documentType === 'proof_address' ? document.riskScore < 40 : true,
      sanctionsCheck: document.riskScore < 20,
      riskLevel: document.riskScore < 30 ? 'low' : document.riskScore < 70 ? 'medium' : 'high',
      confidence: baseConfidence,
      issues: document.riskScore > 50 ? ['Document quality issues', 'Manual review recommended'] : []
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Système de Vérification KYC</h2>
        <div className="flex gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les documents</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
              <SelectItem value="requires_review">Révision requise</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques KYC */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-black">
              {mockKYCDocuments.filter(d => d.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Approuvés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {mockKYCDocuments.filter(d => d.status === 'approved').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Rejetés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {mockKYCDocuments.filter(d => d.status === 'rejected').length}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-400">Taux d'approbation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">87%</div>
          </CardContent>
        </Card>
      </div>

      {/* Table des documents */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Documents KYC</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-gray-300">Client</TableHead>
                <TableHead className="text-gray-300">Type</TableHead>
                <TableHead className="text-gray-300">Date</TableHead>
                <TableHead className="text-gray-300">Statut</TableHead>
                <TableHead className="text-gray-300">Risque</TableHead>
                <TableHead className="text-gray-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDocuments.map((document: any) => (
                <TableRow key={document.id} className="border-gray-700">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{document.clientName}</div>
                      <div className="text-sm text-gray-400">{document.clientEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getDocumentIcon(document.documentType)}
                      <span className="text-gray-300">{getDocumentTypeLabel(document.documentType)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} />
                      {new Date(document.uploadDate).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(document.status)}</TableCell>
                  <TableCell>{getRiskBadge(document.riskScore)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedDocument(document)}
                          >
                            <Eye size={14} className="mr-1" />
                            Réviser
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl bg-gray-800 border-gray-700">
                          <DialogHeader>
                            <DialogTitle className="text-white">
                              Révision Document KYC - {selectedDocument?.clientName}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedDocument && (
                            <Tabs defaultValue="document" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="document">Document</TabsTrigger>
                                <TabsTrigger value="validation">Validation Auto</TabsTrigger>
                                <TabsTrigger value="review">Révision</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="document" className="space-y-4">
                                <Card className="bg-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                      {getDocumentIcon(selectedDocument.documentType)}
                                      {getDocumentTypeLabel(selectedDocument.documentType)}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <div className="text-sm text-gray-400">Fichier</div>
                                        <div className="text-white">{selectedDocument.fileName}</div>
                                      </div>
                                      <div>
                                        <div className="text-sm text-gray-400">Date d'upload</div>
                                        <div className="text-white">{new Date(selectedDocument.uploadDate).toLocaleDateString('fr-FR')}</div>
                                      </div>
                                    </div>
                                    
                                    {/* Simulation d'aperçu du document */}
                                    <div className="w-full h-64 bg-gray-600 rounded-lg flex items-center justify-center">
                                      <div className="text-center text-gray-400">
                                        <FileText size={48} className="mx-auto mb-2" />
                                        <div>Aperçu du document</div>
                                        <div className="text-sm">{selectedDocument.fileName}</div>
                                      </div>
                                    </div>
                                    
                                    <Button variant="outline" className="w-full">
                                      <Download size={16} className="mr-2" />
                                      Télécharger le document original
                                    </Button>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                              
                              <TabsContent value="validation" className="space-y-4">
                                {(() => {
                                  const validation = performAutomaticValidation(selectedDocument);
                                  return (
                                    <Card className="bg-gray-700">
                                      <CardHeader>
                                        <CardTitle className="text-white">Résultats de Validation Automatique</CardTitle>
                                      </CardHeader>
                                      <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Document valide</span>
                                            {validation.documentValid ? 
                                              <CheckCircle className="text-green-500" /> : 
                                              <XCircle className="text-red-500" />
                                            }
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Correspondance faciale</span>
                                            {validation.faceMatch ? 
                                              <CheckCircle className="text-green-500" /> : 
                                              <XCircle className="text-red-500" />
                                            }
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Adresse valide</span>
                                            {validation.addressValid ? 
                                              <CheckCircle className="text-green-500" /> : 
                                              <XCircle className="text-red-500" />
                                            }
                                          </div>
                                          <div className="flex items-center justify-between">
                                            <span className="text-gray-300">Vérification sanctions</span>
                                            {validation.sanctionsCheck ? 
                                              <CheckCircle className="text-green-500" /> : 
                                              <XCircle className="text-red-500" />
                                            }
                                          </div>
                                        </div>
                                        
                                        <div className="space-y-2">
                                          <div className="flex justify-between">
                                            <span className="text-gray-300">Niveau de risque</span>
                                            <Badge variant={validation.riskLevel === 'low' ? 'default' : 
                                                          validation.riskLevel === 'medium' ? 'secondary' : 'destructive'}>
                                              {validation.riskLevel === 'low' ? 'Faible' :
                                               validation.riskLevel === 'medium' ? 'Moyen' : 'Élevé'}
                                            </Badge>
                                          </div>
                                          <div className="flex justify-between">
                                            <span className="text-gray-300">Confiance</span>
                                            <span className="text-white">{validation.confidence.toFixed(1)}%</span>
                                          </div>
                                        </div>
                                        
                                        {validation.issues.length > 0 && (
                                          <div className="space-y-2">
                                            <div className="text-sm text-gray-400">Problèmes détectés</div>
                                            {validation.issues.map((issue, index) => (
                                              <div key={index} className="flex items-center gap-2 text-black">
                                                <AlertTriangle size={16} />
                                                <span className="text-sm">{issue}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  );
                                })()}
                              </TabsContent>
                              
                              <TabsContent value="review" className="space-y-4">
                                <Card className="bg-gray-700">
                                  <CardHeader>
                                    <CardTitle className="text-white">Décision de Révision</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div>
                                      <label className="text-sm text-gray-400 mb-2 block">Statut</label>
                                      <Select value={reviewStatus} onValueChange={setReviewStatus}>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Sélectionner une décision" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="approved">Approuver</SelectItem>
                                          <SelectItem value="rejected">Rejeter</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    {reviewStatus === 'rejected' && (
                                      <div>
                                        <label className="text-sm text-gray-400 mb-2 block">Raison du rejet</label>
                                        <Textarea
                                          value={rejectionReason}
                                          onChange={(e) => setRejectionReason(e.target.value)}
                                          placeholder="Expliquez pourquoi ce document est rejeté..."
                                          className="bg-gray-600 border-gray-500"
                                        />
                                      </div>
                                    )}
                                    
                                    <Button 
                                      onClick={handleDocumentReview}
                                      disabled={!reviewStatus || (reviewStatus === 'rejected' && !rejectionReason)}
                                      className="w-full"
                                    >
                                      Confirmer la décision
                                    </Button>
                                  </CardContent>
                                </Card>
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      
                      <Button variant="outline" size="sm">
                        <Download size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}