import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  User, DollarSign, Wallet, FileText, Phone, Mail, MapPin,
  Save, X, Edit, AlertTriangle, CheckCircle, Clock
} from "lucide-react";

interface ClientDetailModalProps {
  clientId: number;
  isOpen: boolean;
  onClose: () => void;
  userType: 'admin' | 'seller';
}

export default function ClientDetailModal({ clientId, isOpen, onClose, userType }: ClientDetailModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    amount: 0,
    taxAmount: 0,
    taxCurrency: 'USDT',
    walletAddress: '',
    taxStatus: 'unpaid' as 'paid' | 'unpaid' | 'exempt',
    kycStatus: 'pending' as 'pending' | 'approved' | 'rejected',
    status: 'active' as 'active' | 'suspended' | 'blocked'
  });
  const [newNote, setNewNote] = useState('');

  // Fetch client details
  const { data: clientData, isLoading } = useQuery({
    queryKey: [`/api/${userType}/client/${clientId}`],
    enabled: isOpen && !!clientId,
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/${userType}/client/${clientId}/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('clientUpdatedSuccessfully') });
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: [`/api/${userType}/dashboard`] });
      queryClient.invalidateQueries({ queryKey: [`/api/${userType}/client/${clientId}`] });
    },
    onError: () => {
      toast({ title: t('error'), description: t('updateFailed'), variant: 'destructive' });
    }
  });

  // Set tax mutation
  const setTaxMutation = useMutation({
    mutationFn: async (taxData: any) => {
      const response = await fetch(`/api/${userType}/client/${clientId}/set-tax`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taxData),
      });
      if (!response.ok) throw new Error('Failed to set tax');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('taxConfiguredSuccessfully') });
      queryClient.invalidateQueries({ queryKey: [`/api/${userType}/client/${clientId}`] });
    }
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await fetch(`/api/${userType}/client/${clientId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });
      if (!response.ok) throw new Error('Failed to add note');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: t('success'), description: t('noteAdded') });
      setNewNote('');
      queryClient.invalidateQueries({ queryKey: [`/api/${userType}/client/${clientId}`] });
    }
  });

  useEffect(() => {
    if (clientData) {
      setFormData({
        fullName: clientData.fullName || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        address: clientData.address || '',
        amount: clientData.amount || 0,
        taxAmount: clientData.taxAmount || 0,
        taxCurrency: clientData.taxCurrency || 'USDT',
        walletAddress: clientData.walletAddress || '',
        taxStatus: clientData.taxStatus || 'unpaid',
        kycStatus: clientData.kycStatus || 'pending',
        status: clientData.status || 'active'
      });
    }
  }, [clientData]);

  const handleSave = () => {
    updateClientMutation.mutate(formData);
  };

  const handleSetTax = () => {
    setTaxMutation.mutate({
      amount: formData.taxAmount,
      currency: formData.taxCurrency,
      walletAddress: formData.walletAddress
    });
  };

  const handleAddNote = () => {
    if (newNote.trim()) {
      addNoteMutation.mutate(newNote);
    }
  };

  const getStatusBadge = (status: string, type: 'tax' | 'kyc' | 'account') => {
    const variants = {
      paid: 'default',
      unpaid: 'destructive',
      exempt: 'secondary',
      approved: 'default',
      pending: 'secondary',
      rejected: 'destructive',
      active: 'default',
      suspended: 'secondary',
      blocked: 'destructive'
    };

    return <Badge variant={variants[status as keyof typeof variants] as any}>{t(status)}</Badge>;
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('clientDetails')} - {formData.email}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {userType === 'admin' && (
                <Button
                  variant={editMode ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => setEditMode(!editMode)}
                >
                  {editMode ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                  {editMode ? t('cancel') : t('edit')}
                </Button>
              )}
              {editMode && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={updateClientMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {t('save')}
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">{t('personalInfo')}</TabsTrigger>
            <TabsTrigger value="financial">{t('financial')}</TabsTrigger>
            <TabsTrigger value="tax">{t('taxManagement')}</TabsTrigger>
            <TabsTrigger value="notes">{t('notes')}</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('personalInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('fullName')}</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('email')}</Label>
                  <Input
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phone')}</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('accountStatus')}</Label>
                  {editMode ? (
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">{t('active')}</SelectItem>
                        <SelectItem value="suspended">{t('suspended')}</SelectItem>
                        <SelectItem value="blocked">{t('blocked')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getStatusBadge(formData.status, 'account')}</div>
                  )}
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    disabled={!editMode}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('financialInformation')}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('recoveryAmount')} (€)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    disabled={!editMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('kycStatus')}</Label>
                  {editMode ? (
                    <Select
                      value={formData.kycStatus}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, kycStatus: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">{t('pending')}</SelectItem>
                        <SelectItem value="approved">{t('approved')}</SelectItem>
                        <SelectItem value="rejected">{t('rejected')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div>{getStatusBadge(formData.kycStatus, 'kyc')}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {t('taxConfiguration')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxAmount">{t('taxAmount')}</Label>
                    <Input
                      id="taxAmount"
                      type="number"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxAmount: parseFloat(e.target.value) || 0 }))}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxCurrency">{t('currency')}</Label>
                    <Select
                      value={formData.taxCurrency}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, taxCurrency: value }))}
                      disabled={!editMode}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USDT">USDT</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t('taxStatus')}</Label>
                    {editMode ? (
                      <Select
                        value={formData.taxStatus}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, taxStatus: value as any }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unpaid">{t('unpaid')}</SelectItem>
                          <SelectItem value="paid">{t('paid')}</SelectItem>
                          <SelectItem value="exempt">{t('exempt')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <div>{getStatusBadge(formData.taxStatus, 'tax')}</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="walletAddress">{t('walletAddress')}</Label>
                  <Input
                    id="walletAddress"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, walletAddress: e.target.value }))}
                    disabled={!editMode}
                    placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  />
                </div>
                {editMode && userType === 'admin' && (
                  <Button
                    onClick={handleSetTax}
                    disabled={setTaxMutation.isPending}
                    className="w-full"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {t('updateTaxConfiguration')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {t('clientNotes')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userType === 'admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="newNote">{t('addNote')}</Label>
                    <Textarea
                      id="newNote"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder={t('enterNote')}
                      rows={3}
                    />
                    <Button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addNoteMutation.isPending}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {t('addNote')}
                    </Button>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{t('existingNotes')}</Label>
                  {clientData?.notes?.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {clientData.notes.map((note: any, index: number) => (
                        <Card key={index} className="p-3">
                          <div className="text-sm text-muted-foreground mb-1">
                            {new Date(note.createdAt).toLocaleString()}
                          </div>
                          <div className="text-sm">{note.content}</div>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">{t('noNotesAvailable')}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}