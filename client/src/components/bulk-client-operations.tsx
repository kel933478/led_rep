import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Shield, 
  Key, 
  Ban, 
  CheckCircle,
  AlertTriangle,
  Download,
  Trash2,
  Settings
} from "lucide-react";

interface BulkOperationsProps {
  clients: any[];
  selectedClients: number[];
  onSelectionChange: (clientIds: number[]) => void;
}

type BulkOperation = 
  | 'activate'
  | 'deactivate' 
  | 'reset_password'
  | 'set_risk_low'
  | 'set_risk_medium'
  | 'set_risk_high'
  | 'export_data'
  | 'send_notification';

interface BulkOperationProgress {
  total: number;
  completed: number;
  current: string;
  errors: string[];
}

export default function BulkClientOperations({ clients, selectedClients, onSelectionChange }: BulkOperationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOperationDialogOpen, setIsOperationDialogOpen] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<BulkOperationProgress | null>(null);

  const bulkOperationMutation = useMutation({
    mutationFn: async ({ operation, clientIds }: { operation: BulkOperation; clientIds: number[] }) => {
      setProgress({
        total: clientIds.length,
        completed: 0,
        current: 'Initiating bulk operation...',
        errors: []
      });

      // Use the server bulk operations endpoint
      const result = await adminApi.bulkOperations(operation, clientIds);
      
      setProgress(prev => prev ? {
        ...prev,
        completed: clientIds.length,
        current: 'Operation completed',
        errors: result.errors.map((err: any) => `Client ${err.clientId}: ${err.error}`)
      } : null);

      return result;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      
      const successCount = data.results.filter(r => r.success).length;
      const errorCount = data.errors.length;
      
      if (errorCount === 0) {
        toast({
          title: "Operations completed",
          description: `Successfully processed ${successCount} clients`,
        });
      } else {
        toast({
          title: "Operations completed with errors",
          description: `${successCount} successful, ${errorCount} failed`,
          variant: "destructive",
        });
      }
      
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(null);
        setIsOperationDialogOpen(false);
        onSelectionChange([]);
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Bulk operation failed",
        description: "An error occurred during bulk operations",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProgress(null);
    },
  });

  const handleSelectAll = () => {
    if (selectedClients.length === clients.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(clients.map(c => c.id));
    }
  };

  const handleSelectClient = (clientId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedClients, clientId]);
    } else {
      onSelectionChange(selectedClients.filter(id => id !== clientId));
    }
  };

  const getOperationDetails = (operation: BulkOperation) => {
    const details = {
      activate: {
        label: 'Activate Clients',
        description: 'Enable selected clients accounts',
        icon: CheckCircle,
        color: 'text-green-500',
        confirmText: 'This will activate the selected client accounts.'
      },
      deactivate: {
        label: 'Deactivate Clients',
        description: 'Disable selected clients accounts',
        icon: Ban,
        color: 'text-red-500',
        confirmText: 'This will deactivate the selected client accounts. They will not be able to log in.'
      },
      reset_password: {
        label: 'Reset Passwords',
        description: 'Generate new temporary passwords',
        icon: Key,
        color: 'text-blue-500',
        confirmText: 'This will reset passwords for selected clients and generate temporary passwords.'
      },
      set_risk_low: {
        label: 'Set Risk Level: Low',
        description: 'Set risk level to low for selected clients',
        icon: Shield,
        color: 'text-green-500',
        confirmText: 'This will set the risk level to LOW for all selected clients.'
      },
      set_risk_medium: {
        label: 'Set Risk Level: Medium',
        description: 'Set risk level to medium for selected clients',
        icon: Shield,
        color: 'text-black',
        confirmText: 'This will set the risk level to MEDIUM for all selected clients.'
      },
      set_risk_high: {
        label: 'Set Risk Level: High',
        description: 'Set risk level to high for selected clients',
        icon: Shield,
        color: 'text-red-500',
        confirmText: 'This will set the risk level to HIGH for all selected clients.'
      },
      export_data: {
        label: 'Export Data',
        description: 'Export selected clients data',
        icon: Download,
        color: 'text-purple-500',
        confirmText: 'This will export data for the selected clients.'
      },
      send_notification: {
        label: 'Send Notification',
        description: 'Send notification to selected clients',
        icon: Users,
        color: 'text-blue-500',
        confirmText: 'This will send a notification to all selected clients.'
      }
    };
    
    return details[operation];
  };

  const handleExecuteOperation = () => {
    if (!selectedOperation || selectedClients.length === 0) return;
    
    setIsProcessing(true);
    bulkOperationMutation.mutate({
      operation: selectedOperation,
      clientIds: selectedClients
    });
  };

  const exportSelectedClients = () => {
    const selectedClientData = clients.filter(client => selectedClients.includes(client.id));
    
    const csvHeader = 'Email,KYC Status,Active Status,Risk Level,Amount,Last Connection,Last IP\n';
    const csvData = selectedClientData.map(client => [
      client.email,
      client.kycCompleted ? 'Completed' : 'Pending',
      client.isActive ? 'Active' : 'Inactive',
      client.riskLevel || 'Medium',
      client.amount || 0,
      client.lastConnection ? new Date(client.lastConnection).toLocaleDateString() : 'Never',
      client.lastIp || 'Unknown'
    ].join(',')).join('\n');

    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `selected-clients-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Selection Controls */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center space-x-4">
          <Checkbox
            checked={selectedClients.length === clients.length && clients.length > 0}
            onCheckedChange={handleSelectAll}
            className="mr-2"
          />
          <span className="text-sm font-medium">
            {selectedClients.length > 0 
              ? `${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''} selected`
              : 'Select all clients'
            }
          </span>
          {selectedClients.length > 0 && (
            <Badge variant="secondary">
              {selectedClients.length} / {clients.length}
            </Badge>
          )}
        </div>

        {selectedClients.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportSelectedClients}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            <Dialog open={isOperationDialogOpen} onOpenChange={setIsOperationDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Bulk Operations
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    Bulk Operations ({selectedClients.length} clients selected)
                  </DialogTitle>
                </DialogHeader>
                
                {!isProcessing ? (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">Select Operation</label>
                      <Select value={selectedOperation || ''} onValueChange={(value) => setSelectedOperation(value as BulkOperation)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose an operation..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activate">Activate Clients</SelectItem>
                          <SelectItem value="deactivate">Deactivate Clients</SelectItem>
                          <SelectItem value="reset_password">Reset Passwords</SelectItem>
                          <SelectItem value="set_risk_low">Set Risk: Low</SelectItem>
                          <SelectItem value="set_risk_medium">Set Risk: Medium</SelectItem>
                          <SelectItem value="set_risk_high">Set Risk: High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedOperation && (
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          {(() => {
                            const details = getOperationDetails(selectedOperation);
                            const Icon = details.icon;
                            return (
                              <>
                                <Icon className={`w-5 h-5 ${details.color}`} />
                                <span className="font-medium">{details.label}</span>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {getOperationDetails(selectedOperation).confirmText}
                        </p>
                        <div className="text-sm">
                          <strong>Affected clients:</strong> {selectedClients.length}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsOperationDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleExecuteOperation}
                        disabled={!selectedOperation}
                      >
                        Execute Operation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {progress && (
                      <div className="space-y-4">
                        <div className="text-center">
                          <h3 className="font-medium">Processing Bulk Operation</h3>
                          <p className="text-sm text-muted-foreground">{progress.current}</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{progress.completed} / {progress.total}</span>
                          </div>
                          <Progress value={(progress.completed / progress.total) * 100} />
                        </div>

                        {progress.errors.length > 0 && (
                          <div className="max-h-32 overflow-y-auto">
                            <h4 className="text-sm font-medium text-red-500 mb-2">Errors:</h4>
                            <div className="space-y-1">
                              {progress.errors.map((error, index) => (
                                <p key={index} className="text-xs text-red-500">
                                  {error}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}

                        {progress.completed === progress.total && (
                          <div className="text-center text-green-500">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                            <p className="text-sm">Operation completed!</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Selected Clients Preview */}
      {selectedClients.length > 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="text-sm font-medium mb-3">Selected Clients:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
            {clients
              .filter(client => selectedClients.includes(client.id))
              .map(client => (
                <div key={client.id} className="flex items-center justify-between p-2 bg-background rounded text-sm">
                  <span>{client.email}</span>
                  <div className="flex items-center space-x-1">
                    <Badge 
                      variant={client.isActive ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {client.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectClient(client.id, false)}
                      className="h-auto p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Individual Client Selection */}
      <div className="space-y-2">
        {clients.map(client => (
          <div key={client.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
            <Checkbox
              checked={selectedClients.includes(client.id)}
              onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
            />
            <div className="flex-1 flex items-center justify-between">
              <div>
                <span className="font-medium">{client.email}</span>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={client.kycCompleted ? "default" : "secondary"}>
                    {client.kycCompleted ? "KYC Complete" : "KYC Pending"}
                  </Badge>
                  <Badge variant={client.isActive ? "default" : "destructive"}>
                    {client.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge className={
                    client.riskLevel === 'low' ? 'bg-green-900 text-green-300' :
                    client.riskLevel === 'high' ? 'bg-red-900 text-red-300' :
                    'bg-black text-white'
                  }>
                    Risk: {client.riskLevel || 'Medium'}
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {client.amount ? `${client.amount.toLocaleString()}€` : '0€'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}