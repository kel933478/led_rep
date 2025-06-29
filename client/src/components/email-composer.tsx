import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Mail, Send, Users, FileText, Eye, Code2, 
  Paperclip, Save, Trash2, Settings, User
} from "lucide-react";

interface EmailComposerProps {
  clients: any[];
  userType: 'admin' | 'seller';
  trigger?: React.ReactNode;
}

const EMAIL_TEMPLATES = {
  welcome: {
    subject: "Welcome to Ledger Recovery - Your Account is Ready",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center;">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjYwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGVkZ2VyIFJlY292ZXJ5PC90ZXh0Pgo8L3N2Zz4K" alt="Ledger Recovery" style="height: 40px; margin-bottom: 20px;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Ledger Recovery</h1>
          <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px;">Your secure crypto asset recovery platform</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Hello {{clientName}},</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            Your Ledger Backup account has been successfully created and is now ready to use. You can now access our secure platform to manage your crypto asset backup process.
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">Your Account Details:</h3>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Email:</strong> {{clientEmail}}</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Account Type:</strong> Premium Backup</p>
            <p style="color: #cccccc; margin: 5px 0;"><strong>Status:</strong> Active</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #333 0%, #000 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block; border: 1px solid #555;">
              Access Your Dashboard
            </a>
          </div>
        </div>
        
        <div style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
            Need help? Contact our support team at support@ledger-recovery.com
          </p>
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Ledger Recovery - Secure Crypto Asset Recovery Platform<br>
              This email was sent from a secure system. Please do not reply to this email.
            </p>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px;">
            <p style="color: #666; font-size: 11px; margin: 0;">
              © 2024 Ledger Recovery. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </div>
    `
  },
  
  kycApproval: {
    subject: "KYC Verification Approved - Account Fully Activated",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center;">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjYwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGVkZ2VyIFJlY292ZXJ5PC90ZXh0Pgo8L3N2Zz4K" alt="Ledger Recovery" style="height: 40px; margin-bottom: 20px;">
          <div style="background-color: #0d4f37; border-radius: 50px; width: 60px; height: 60px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #ffffff; font-size: 24px;">✓</span>
          </div>
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">KYC Verification Approved</h1>
          <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px;">Your account is now fully activated</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Congratulations {{clientName}}!</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            Your KYC verification has been successfully approved. Your Ledger Recovery account is now fully activated and you have access to all premium features.
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #0d4f37; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">Now Available:</h3>
            <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Full access to crypto asset recovery tools</li>
              <li style="margin: 8px 0;">Priority customer support</li>
              <li style="margin: 8px 0;">Advanced security features</li>
              <li style="margin: 8px 0;">Unlimited recovery attempts</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #0d4f37 0%, #0a3d2b 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">
              Access Full Dashboard
            </a>
          </div>
        </div>
        
        <div style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
            Questions? Our verified support team is here to help: support@ledger-recovery.com
          </p>
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Ledger Recovery - Secure Crypto Asset Recovery Platform<br>
              This email was sent from a secure system. Please do not reply to this email.
            </p>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px;">
            <p style="color: #666; font-size: 11px; margin: 0;">
              © 2024 Ledger Recovery. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </div>
    `
  },

  reminder: {
    subject: "Complete Your Ledger Recovery Setup - Action Required",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center;">
          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiB2aWV3Qm94PSIwIDAgMTIwIDQwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjYwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0iI2ZmZmZmZiIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TGVkZ2VyIFJlY292ZXJ5PC90ZXh0Pgo8L3N2Zz4K" alt="Ledger Recovery" style="height: 40px; margin-bottom: 20px;">
          <div style="background-color: #b8860b; border-radius: 50px; width: 60px; height: 60px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
            <span style="color: #ffffff; font-size: 24px;">!</span>
          </div>
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Action Required</h1>
          <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px;">Complete your account setup</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Hello {{clientName}},</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            We noticed that your Ledger Recovery account setup is incomplete. To ensure the security of your crypto assets and enable full access to our recovery services, please complete the following steps:
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #b8860b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin: 0 0 15px 0; font-size: 16px;">Pending Actions:</h3>
            <ul style="color: #cccccc; margin: 0; padding-left: 20px;">
              <li style="margin: 8px 0;">Upload KYC verification documents</li>
              <li style="margin: 8px 0;">Complete profile information</li>
              <li style="margin: 8px 0;">Verify email address</li>
              <li style="margin: 8px 0;">Set up recovery preferences</li>
            </ul>
          </div>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            <strong>Important:</strong> Incomplete accounts have limited access to recovery features. Complete your setup to unlock full functionality.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background: linear-gradient(135deg, #b8860b 0%, #996f09 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; display: inline-block;">
              Complete Setup Now
            </a>
          </div>
        </div>
        
        <div style="background-color: #0a0a0a; padding: 30px; text-align: center; border-top: 1px solid #333;">
          <p style="color: #888; font-size: 14px; margin: 0 0 10px 0;">
            Need assistance? Contact support@ledger-recovery.com
          </p>
          <div style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px; margin: 0;">
              Ledger Recovery - Secure Crypto Asset Recovery Platform<br>
              This email was sent from a secure system. Please do not reply to this email.
            </p>
          </div>
          <div style="border-top: 1px solid #333; padding-top: 20px; margin-top: 20px;">
            <p style="color: #666; font-size: 11px; margin: 0;">
              © 2024 Ledger Recovery. All rights reserved. | Privacy Policy | Terms of Service
            </p>
          </div>
        </div>
      </div>
    `
  }
};

export default function EmailComposer({ clients, userType, trigger }: EmailComposerProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof EMAIL_TEMPLATES>('welcome');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
    htmlContent: ''
  });
  const [activeTab, setActiveTab] = useState('compose');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const sendEmailMutation = useMutation({
    mutationFn: async (data: {
      clientIds: number[];
      subject: string;
      content: string;
      htmlContent: string;
    }) => {
      const response = await fetch(`/api/${userType}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to send email');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Emails sent successfully", 
        description: `${data.sent} emails sent to selected clients` 
      });
      setIsOpen(false);
      resetForm();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to send emails", 
        variant: "destructive" 
      });
    }
  });

  const resetForm = () => {
    setSelectedClients([]);
    setEmailData({ subject: '', content: '', htmlContent: '' });
    setSelectedTemplate('welcome');
    setActiveTab('compose');
  };

  const loadTemplate = (templateKey: keyof typeof EMAIL_TEMPLATES) => {
    const template = EMAIL_TEMPLATES[templateKey];
    setEmailData({
      subject: template.subject,
      content: template.html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim(),
      htmlContent: template.html
    });
    setSelectedTemplate(templateKey);
  };

  const handleClientSelection = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const selectAllClients = () => {
    setSelectedClients(clients.map(c => c.id));
  };

  const clearSelection = () => {
    setSelectedClients([]);
  };

  const generatePreview = () => {
    let preview = emailData.htmlContent;
    if (selectedClients.length > 0) {
      const firstClient = clients.find(c => c.id === selectedClients[0]);
      if (firstClient) {
        preview = preview
          .replace(/\{\{clientName\}\}/g, firstClient.fullName || firstClient.email)
          .replace(/\{\{clientEmail\}\}/g, firstClient.email)
          .replace(/\{\{dashboardUrl\}\}/g, `${window.location.origin}/client/dashboard`);
      }
    }
    return preview;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-black border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Composer - {userType === 'admin' ? 'Admin' : 'Seller'} Panel
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900">
            <TabsTrigger value="compose" className="text-white data-[state=active]:bg-gray-700">
              <FileText className="w-4 h-4 mr-2" />
              Compose
            </TabsTrigger>
            <TabsTrigger value="recipients" className="text-white data-[state=active]:bg-gray-700">
              <Users className="w-4 h-4 mr-2" />
              Recipients ({selectedClients.length})
            </TabsTrigger>
            <TabsTrigger value="templates" className="text-white data-[state=active]:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="preview" className="text-white data-[state=active]:bg-gray-700">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto">
            <TabsContent value="compose" className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">Subject</label>
                <Input
                  value={emailData.subject}
                  onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject..."
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white">Content</label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsPreviewMode(!isPreviewMode)}
                      className="text-white border-gray-600"
                    >
                      {isPreviewMode ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {isPreviewMode ? 'HTML' : 'Preview'}
                    </Button>
                  </div>
                </div>

                {isPreviewMode ? (
                  <div 
                    className="min-h-[300px] p-4 bg-white rounded border border-gray-700 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: emailData.htmlContent }}
                  />
                ) : (
                  <Textarea
                    value={emailData.htmlContent}
                    onChange={(e) => setEmailData(prev => ({ ...prev, htmlContent: e.target.value }))}
                    placeholder="HTML email content..."
                    className="min-h-[300px] bg-gray-900 border-gray-700 text-white font-mono text-sm"
                  />
                )}
              </div>

              <div className="text-xs text-gray-400">
                <p>Available variables: {'{{clientName}}'}, {'{{clientEmail}}'}, {'{{dashboardUrl}}'}</p>
              </div>
            </TabsContent>

            <TabsContent value="recipients" className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button size="sm" onClick={selectAllClients} className="bg-blue-600 hover:bg-blue-700">
                    Select All ({clients.length})
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearSelection} className="text-white border-gray-600">
                    Clear Selection
                  </Button>
                </div>
                <Badge variant="secondary" className="bg-gray-700 text-white">
                  {selectedClients.length} selected
                </Badge>
              </div>

              <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                {clients.map((client) => (
                  <div
                    key={client.id}
                    className={`flex items-center space-x-3 p-3 rounded border cursor-pointer transition-colors ${
                      selectedClients.includes(client.id)
                        ? 'bg-blue-900/30 border-blue-500'
                        : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
                    }`}
                    onClick={() => handleClientSelection(client.id, !selectedClients.includes(client.id))}
                  >
                    <input
                      type="checkbox"
                      checked={selectedClients.includes(client.id)}
                      onChange={(e) => handleClientSelection(client.id, e.target.checked)}
                      className="rounded"
                    />
                    <User className="w-4 h-4 text-gray-400" />
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {client.fullName || client.email}
                      </div>
                      <div className="text-sm text-gray-400">{client.email}</div>
                    </div>
                    <div className="flex gap-1">
                      {client.kycCompleted && (
                        <Badge variant="default" className="bg-green-600">KYC ✓</Badge>
                      )}
                      {client.onboardingCompleted && (
                        <Badge variant="secondary" className="bg-gray-600">Active</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4 mt-4">
              <div className="grid gap-4">
                {Object.entries(EMAIL_TEMPLATES).map(([key, template]) => (
                  <Card key={key} className="bg-gray-900 border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-white text-lg capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={() => loadTemplate(key as keyof typeof EMAIL_TEMPLATES)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Use Template
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-300 mb-2">
                        <strong>Subject:</strong> {template.subject}
                      </p>
                      <div className="text-xs text-gray-400 bg-gray-800 p-2 rounded max-h-20 overflow-hidden">
                        {template.html.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-4">
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Email Preview</CardTitle>
                  <p className="text-sm text-gray-400">
                    Preview showing data for: {
                      selectedClients.length > 0 
                        ? clients.find(c => c.id === selectedClients[0])?.email || 'No client selected'
                        : 'No client selected'
                    }
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="bg-white rounded p-4 max-h-[400px] overflow-auto">
                    <div dangerouslySetInnerHTML={{ __html: generatePreview() }} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {selectedClients.length} recipient(s) selected
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="text-white border-gray-600">
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate({
                clientIds: selectedClients,
                subject: emailData.subject,
                content: emailData.content,
                htmlContent: emailData.htmlContent
              })}
              disabled={selectedClients.length === 0 || !emailData.subject || !emailData.htmlContent || sendEmailMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendEmailMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Email{selectedClients.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}