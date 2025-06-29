import React, { useState } from 'react';
import { ArrowLeft, Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface CryptoAddress {
  id: number;
  symbol: string;
  name: string;
  address: string;
  network: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy?: number;
}

export default function AdminCryptoAddresses() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newAddress, setNewAddress] = useState<Partial<CryptoAddress>>({});
  const [isAdding, setIsAdding] = useState(false);

  // Récupération des adresses crypto
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['/api/admin/crypto-addresses'],
  });

  // Mutation pour mettre à jour une adresse
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<CryptoAddress> }) => {
      return apiRequest(`/api/admin/crypto-addresses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crypto-addresses'] });
      setEditingId(null);
      toast({
        title: t('success'),
        description: 'Crypto address updated successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: 'Failed to update crypto address',
        variant: 'destructive',
      });
    },
  });

  // Mutation pour créer une nouvelle adresse
  const createMutation = useMutation({
    mutationFn: async (data: Partial<CryptoAddress>) => {
      return apiRequest('/api/admin/crypto-addresses', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/crypto-addresses'] });
      setIsAdding(false);
      setNewAddress({});
      toast({
        title: t('success'),
        description: 'Crypto address created successfully',
      });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: 'Failed to create crypto address',
        variant: 'destructive',
      });
    },
  });

  const handleUpdate = (id: number, data: Partial<CryptoAddress>) => {
    updateMutation.mutate({ id, data });
  };

  const handleCreate = () => {
    if (!newAddress.symbol || !newAddress.name || !newAddress.address || !newAddress.network) {
      toast({
        title: t('error'),
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(newAddress);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Crypto Addresses Management</h1>
          </div>
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold">Crypto Addresses Management</h1>
          </div>
          <Button
            onClick={() => setIsAdding(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Address
          </Button>
        </div>

        {/* Add New Address Form */}
        {isAdding && (
          <Card className="mb-6 bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Add New Crypto Address</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="symbol" className="text-white">Symbol *</Label>
                  <Input
                    id="symbol"
                    value={newAddress.symbol || ''}
                    onChange={(e) => setNewAddress({ ...newAddress, symbol: e.target.value.toUpperCase() })}
                    placeholder="BTC, ETH, etc."
                    className="bg-gray-800 text-white border-gray-600"
                  />
                </div>
                <div>
                  <Label htmlFor="name" className="text-white">Name *</Label>
                  <Input
                    id="name"
                    value={newAddress.name || ''}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    placeholder="Bitcoin, Ethereum, etc."
                    className="bg-gray-800 text-white border-gray-600"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="address" className="text-white">Address *</Label>
                <Input
                  id="address"
                  value={newAddress.address || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, address: e.target.value })}
                  placeholder="Wallet address"
                  className="bg-gray-800 text-white border-gray-600"
                />
              </div>
              <div>
                <Label htmlFor="network" className="text-white">Network *</Label>
                <Input
                  id="network"
                  value={newAddress.network || ''}
                  onChange={(e) => setNewAddress({ ...newAddress, network: e.target.value })}
                  placeholder="Bitcoin, Ethereum, BNB Smart Chain, etc."
                  className="bg-gray-800 text-white border-gray-600"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAdding(false);
                    setNewAddress({});
                  }}
                  className="border-gray-600 text-white hover:bg-gray-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Addresses List */}
        <div className="space-y-4">
          {addresses?.map((address: CryptoAddress) => (
            <Card key={address.id} className="bg-gray-900 border-gray-700">
              <CardContent className="p-6">
                {editingId === address.id ? (
                  <EditableAddress
                    address={address}
                    onSave={(data) => handleUpdate(address.id, data)}
                    onCancel={() => setEditingId(null)}
                    isUpdating={updateMutation.isPending}
                  />
                ) : (
                  <AddressDisplay
                    address={address}
                    onEdit={() => setEditingId(address.id)}
                  />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function AddressDisplay({ address, onEdit }: { address: CryptoAddress; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex-1 grid grid-cols-4 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-white">{address.symbol}</span>
            <Badge variant={address.isActive ? "default" : "secondary"}>
              {address.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <p className="text-gray-400">{address.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Network</p>
          <p className="text-white">{address.network}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Address</p>
          <p className="text-white font-mono text-sm truncate">{address.address}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Last Updated</p>
          <p className="text-white text-sm">
            {new Date(address.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onEdit}
        className="text-white hover:bg-gray-800"
      >
        <Edit className="w-4 h-4" />
      </Button>
    </div>
  );
}

function EditableAddress({ 
  address, 
  onSave, 
  onCancel, 
  isUpdating 
}: { 
  address: CryptoAddress; 
  onSave: (data: Partial<CryptoAddress>) => void;
  onCancel: () => void;
  isUpdating: boolean;
}) {
  const [editData, setEditData] = useState({
    symbol: address.symbol,
    name: address.name,
    address: address.address,
    network: address.network,
    isActive: address.isActive,
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-symbol" className="text-white">Symbol</Label>
          <Input
            id="edit-symbol"
            value={editData.symbol}
            onChange={(e) => setEditData({ ...editData, symbol: e.target.value.toUpperCase() })}
            className="bg-gray-800 text-white border-gray-600"
          />
        </div>
        <div>
          <Label htmlFor="edit-name" className="text-white">Name</Label>
          <Input
            id="edit-name"
            value={editData.name}
            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            className="bg-gray-800 text-white border-gray-600"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="edit-address" className="text-white">Address</Label>
        <Input
          id="edit-address"
          value={editData.address}
          onChange={(e) => setEditData({ ...editData, address: e.target.value })}
          className="bg-gray-800 text-white border-gray-600"
        />
      </div>
      <div>
        <Label htmlFor="edit-network" className="text-white">Network</Label>
        <Input
          id="edit-network"
          value={editData.network}
          onChange={(e) => setEditData({ ...editData, network: e.target.value })}
          className="bg-gray-800 text-white border-gray-600"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="edit-active"
          checked={editData.isActive}
          onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
          className="rounded"
        />
        <Label htmlFor="edit-active" className="text-white">Active</Label>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-gray-600 text-white hover:bg-gray-800"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editData)}
          disabled={isUpdating}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save
        </Button>
      </div>
    </div>
  );
}