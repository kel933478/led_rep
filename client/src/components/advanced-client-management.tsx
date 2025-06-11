import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Settings, 
  Shield, 
  Key, 
  Edit,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";

interface AdvancedClientManagementProps {
  client: any;
}

export default function AdvancedClientManagement({ client }: AdvancedClientManagementProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [isBalanceDialogOpen, setIsBalanceDialogOpen] = useState(false);
  const [newRiskLevel, setNewRiskLevel] = useState(client.riskLevel || "medium");
  const [newBalances, setNewBalances] = useState(client.balances || {});

  const updateStatusMutation = useMutation({
    mutationFn: ({ clientId, isActive }: { clientId: number; isActive: boolean }) =>
      adminApi.updateClientStatus(clientId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setIsStatusDialogOpen(false);
      toast({
        title: "Succès",
        description: "Statut client mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du statut",
        variant: "destructive",
      });
    },
  });

  const updateRiskMutation = useMutation({
    mutationFn: ({ clientId, riskLevel }: { clientId: number; riskLevel: string }) =>
      adminApi.updateClientRisk(clientId, riskLevel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setIsRiskDialogOpen(false);
      toast({
        title: "Succès",
        description: "Niveau de risque mis à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour du niveau de risque",
        variant: "destructive",
      });
    },
  });

  const updateBalancesMutation = useMutation({
    mutationFn: ({ clientId, balances }: { clientId: number; balances: any }) =>
      adminApi.updateClientBalances(clientId, balances),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setIsBalanceDialogOpen(false);
      toast({
        title: "Succès",
        description: "Balances mises à jour avec succès",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la mise à jour des balances",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (clientId: number) => adminApi.resetClientPassword(clientId),
    onSuccess: (data) => {
      toast({
        title: "Mot de passe réinitialisé",
        description: `Nouveau mot de passe temporaire: ${data.temporaryPassword}`,
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Erreur lors de la réinitialisation du mot de passe",
        variant: "destructive",
      });
    },
  });

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "low": return "bg-green-900 text-green-300";
      case "high": return "bg-red-900 text-red-300";
      default: return "bg-black text-white";
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case "low": return <TrendingDown className="w-3 h-3" />;
      case "high": return <TrendingUp className="w-3 h-3" />;
      default: return <Minus className="w-3 h-3" />;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {/* Status Badge */}
      <Badge variant={client.isActive ? "default" : "destructive"}>
        {client.isActive ? "Actif" : "Inactif"}
      </Badge>

      {/* Risk Level Badge */}
      <Badge className={getRiskBadgeColor(client.riskLevel || "medium")}>
        {getRiskIcon(client.riskLevel || "medium")}
        <span className="ml-1 capitalize">{client.riskLevel || "medium"}</span>
      </Badge>

      {/* Status Toggle Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300">
            <Settings className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion du Statut Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Client actif</label>
              <Switch
                checked={client.isActive}
                onCheckedChange={(checked) => 
                  updateStatusMutation.mutate({ clientId: client.id, isActive: checked })
                }
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Risk Level Dialog */}
      <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-black hover:text-gray-800">
            <Shield className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Niveau de Risque Client</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Niveau de risque</label>
              <Select value={newRiskLevel} onValueChange={setNewRiskLevel}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Faible</SelectItem>
                  <SelectItem value="medium">Moyen</SelectItem>
                  <SelectItem value="high">Élevé</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => updateRiskMutation.mutate({ clientId: client.id, riskLevel: newRiskLevel })}
              disabled={updateRiskMutation.isPending}
              className="w-full"
            >
              {updateRiskMutation.isPending ? "Mise à jour..." : "Mettre à jour"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Balance Management Dialog */}
      <Dialog open={isBalanceDialogOpen} onOpenChange={setIsBalanceDialogOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
            <Edit className="w-4 h-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gestion des Balances</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(newBalances).map(([symbol, balance]) => (
              <div key={symbol} className="flex items-center space-x-2">
                <label className="text-sm font-medium w-16 uppercase">{symbol}</label>
                <Input
                  type="number"
                  step="0.00000001"
                  value={balance as number}
                  onChange={(e) => setNewBalances({
                    ...newBalances,
                    [symbol]: parseFloat(e.target.value) || 0
                  })}
                  className="flex-1"
                />
              </div>
            ))}
            <Button
              onClick={() => updateBalancesMutation.mutate({ clientId: client.id, balances: newBalances })}
              disabled={updateBalancesMutation.isPending}
              className="w-full"
            >
              {updateBalancesMutation.isPending ? "Mise à jour..." : "Mettre à jour les balances"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Button */}
      <Button
        size="sm"
        variant="ghost"
        onClick={() => resetPasswordMutation.mutate(client.id)}
        disabled={resetPasswordMutation.isPending}
        className="text-red-400 hover:text-red-300"
      >
        <Key className="w-4 h-4" />
      </Button>
    </div>
  );
}