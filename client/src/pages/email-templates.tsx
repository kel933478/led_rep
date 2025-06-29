import React, { useState } from 'react';
import { ArrowLeft, Mail, Eye, Code2, Send, Plus, Edit, Trash2, Copy, Save } from 'lucide-react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

const defaultTemplates = {
  welcome: {
    name: "Welcome Email",
    subject: "Welcome to Ledger Backup - Your Account is Ready",
    category: "onboarding",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Welcome to Ledger Backup</h1>
          <p style="margin: 10px 0 0 0; color: #cccccc; font-size: 16px;">Your secure crypto asset backup platform</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Hello {{clientName}},</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            Welcome to Ledger Backup! Your account has been successfully created and is now ready to use.
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #333333; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #cccccc; line-height: 1.6;">
              <li>Complete your KYC verification</li>
              <li>Set up your recovery preferences</li>
              <li>Explore our security features</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Access Your Dashboard
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin-top: 30px;">
            If you have any questions, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    `,
    variables: ['clientName', 'clientEmail', 'dashboardUrl']
  },
  kycApproval: {
    name: "KYC Approved",
    subject: "KYC Verification Approved - Account Fully Activated",
    category: "verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">✅ KYC Approved!</h1>
          <p style="margin: 10px 0 0 0; color: #dcfce7; font-size: 16px;">Your account is now fully verified</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Congratulations {{clientName}}!</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            Your KYC verification has been successfully approved. Your Ledger Backup account is now fully activated with access to all features.
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin-top: 0;">You now have access to:</h3>
            <ul style="color: #cccccc; line-height: 1.6;">
              <li>Complete portfolio management</li>
              <li>Advanced security features</li>
              <li>Priority customer support</li>
              <li>Full backup and recovery services</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Access Your Dashboard
            </a>
          </div>
        </div>
      </div>
    `,
    variables: ['clientName', 'clientEmail', 'dashboardUrl']
  },
  reminder: {
    name: "Setup Reminder",
    subject: "Complete Your Ledger Backup Setup - Action Required",
    category: "reminder",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">⚠️ Action Required</h1>
          <p style="margin: 10px 0 0 0; color: #fef3c7; font-size: 16px;">Complete your account setup</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Hi {{clientName}},</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            We noticed that your Ledger Backup account setup is still incomplete. To ensure the security of your assets, please complete the following steps:
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin-top: 0;">Pending Actions:</h3>
            <ul style="color: #cccccc; line-height: 1.6;">
              <li>Upload KYC documents</li>
              <li>Verify your email address</li>
              <li>Set up backup preferences</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Complete Setup Now
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin-top: 30px;">
            This is an automated reminder. If you've already completed these steps, please ignore this email.
          </p>
        </div>
      </div>
    `,
    variables: ['clientName', 'clientEmail', 'dashboardUrl']
  },
  taxNotification: {
    name: "Tax Payment Due",
    subject: "Tax Payment Required - {{taxAmount}} {{taxCurrency}}",
    category: "tax",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #000000; color: #ffffff;">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 40px 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">💰 Tax Payment Due</h1>
          <p style="margin: 10px 0 0 0; color: #fecaca; font-size: 16px;">Payment required to continue services</p>
        </div>
        
        <div style="padding: 40px 30px; background-color: #111111;">
          <h2 style="color: #ffffff; font-size: 20px; margin-bottom: 20px;">Hello {{clientName}},</h2>
          
          <p style="color: #cccccc; line-height: 1.6; margin-bottom: 20px;">
            A tax payment of <strong>{{taxAmount}} {{taxCurrency}}</strong> is now due for your account.
          </p>
          
          <div style="background-color: #1a1a1a; border: 1px solid #dc2626; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ffffff; margin-top: 0;">Payment Details:</h3>
            <table style="width: 100%; color: #cccccc;">
              <tr>
                <td>Amount:</td>
                <td style="text-align: right; font-weight: bold;">{{taxAmount}} {{taxCurrency}}</td>
              </tr>
              <tr>
                <td>Wallet Address:</td>
                <td style="text-align: right; font-family: monospace; font-size: 12px; word-break: break-all;">{{walletAddress}}</td>
              </tr>
              <tr>
                <td>Due Date:</td>
                <td style="text-align: right;">{{dueDate}}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{paymentUrl}}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              Make Payment Now
            </a>
          </div>
          
          <p style="color: #888888; font-size: 14px; margin-top: 30px;">
            Please ensure payment is completed by the due date to avoid service interruption.
          </p>
        </div>
      </div>
    `,
    variables: ['clientName', 'taxAmount', 'taxCurrency', 'walletAddress', 'dueDate', 'paymentUrl']
  }
};

const categories = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'verification', label: 'Verification' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'tax', label: 'Tax & Payments' },
  { value: 'general', label: 'General' },
  { value: 'security', label: 'Security' }
];

export default function EmailTemplates() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [templates, setTemplates] = useState(defaultTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    category: 'general',
    html: '',
    variables: []
  });

  const handleEditTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    setEditingTemplate({ ...template, key: templateKey });
    setIsEditing(true);
  };

  const handleSaveTemplate = () => {
    if (editingTemplate) {
      setTemplates(prev => ({
        ...prev,
        [editingTemplate.key]: {
          name: editingTemplate.name,
          subject: editingTemplate.subject,
          category: editingTemplate.category,
          html: editingTemplate.html,
          variables: editingTemplate.variables
        }
      }));
      setIsEditing(false);
      setEditingTemplate(null);
      toast({
        title: "Template saved",
        description: "Email template has been updated successfully",
      });
    }
  };

  const handleDeleteTemplate = (templateKey: string) => {
    const newTemplates = { ...templates };
    delete newTemplates[templateKey as keyof typeof templates];
    setTemplates(newTemplates);
    if (selectedTemplate === templateKey) {
      setSelectedTemplate(null);
    }
    toast({
      title: "Template deleted",
      description: "Email template has been removed",
    });
  };

  const handleDuplicateTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    const newKey = `${templateKey}_copy_${Date.now()}`;
    setTemplates(prev => ({
      ...prev,
      [newKey]: {
        ...template,
        name: `${template.name} (Copy)`
      }
    }));
    toast({
      title: "Template duplicated",
      description: "Template has been copied successfully",
    });
  };

  const renderPreview = (html: string) => {
    const sampleData = {
      clientName: 'John Doe',
      clientEmail: 'john.doe@example.com',
      dashboardUrl: 'https://rec-ledger.com/client',
      taxAmount: '0.005',
      taxCurrency: 'BTC',
      walletAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      paymentUrl: 'https://rec-ledger.com/tax-payment'
    };

    let processedHtml = html;
    Object.entries(sampleData).forEach(([key, value]) => {
      processedHtml = processedHtml.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return processedHtml;
  };

  const selectedTemplateData = selectedTemplate ? templates[selectedTemplate as keyof typeof templates] : null;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Templates
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Templates</CardTitle>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Create New Template</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Template Name</Label>
                          <Input
                            value={newTemplate.name}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="Enter template name"
                          />
                        </div>
                        <div>
                          <Label>Subject</Label>
                          <Input
                            value={newTemplate.subject}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                            className="bg-gray-800 border-gray-600 text-white"
                            placeholder="Email subject"
                          />
                        </div>
                        <div>
                          <Label>Category</Label>
                          <Select 
                            value={newTemplate.category} 
                            onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
                          >
                            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {categories.map(category => (
                                <SelectItem key={category.value} value={category.value}>
                                  {category.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>HTML Content</Label>
                          <Textarea
                            value={newTemplate.html}
                            onChange={(e) => setNewTemplate(prev => ({ ...prev, html: e.target.value }))}
                            className="bg-gray-800 border-gray-600 text-white font-mono text-sm min-h-[200px]"
                            placeholder="HTML email content"
                          />
                        </div>
                        <Button 
                          onClick={() => {
                            const key = `custom_${Date.now()}`;
                            setTemplates(prev => ({ ...prev, [key]: newTemplate }));
                            setNewTemplate({ name: '', subject: '', category: 'general', html: '', variables: [] });
                            toast({ title: "Template created", description: "New template added successfully" });
                          }}
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={!newTemplate.name || !newTemplate.subject || !newTemplate.html}
                        >
                          Create Template
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(templates).map(([key, template]) => (
                  <div
                    key={key}
                    onClick={() => setSelectedTemplate(key)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-blue-600/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{template.subject}</p>
                        <Badge 
                          variant="secondary" 
                          className="bg-gray-700 text-white text-xs mt-2"
                        >
                          {categories.find(c => c.value === template.category)?.label}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTemplate(key);
                          }}
                          className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateTemplate(key);
                          }}
                          className="w-6 h-6 p-0 text-gray-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTemplate(key);
                          }}
                          className="w-6 h-6 p-0 text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Template Editor/Preview */}
          <div className="lg:col-span-2">
            {selectedTemplateData ? (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white">{selectedTemplateData.name}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPreviewMode(!isPreviewMode)}
                        className="border-gray-600 text-white"
                      >
                        {isPreviewMode ? <Code2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {isPreviewMode ? 'Edit' : 'Preview'}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditTemplate(selectedTemplate!)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Template
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="bg-gray-700 text-white">
                      {categories.find(c => c.value === selectedTemplateData.category)?.label}
                    </Badge>
                    {selectedTemplateData.variables?.map(variable => (
                      <Badge key={variable} variant="outline" className="border-blue-500 text-blue-400">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white">Subject</Label>
                      <div className="bg-gray-800 p-3 rounded border border-gray-600">
                        <p className="text-white text-sm">{selectedTemplateData.subject}</p>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    <div>
                      <Label className="text-white">Content</Label>
                      {isPreviewMode ? (
                        <div className="bg-white rounded-lg p-4 max-h-[500px] overflow-auto">
                          <div dangerouslySetInnerHTML={{ 
                            __html: renderPreview(selectedTemplateData.html) 
                          }} />
                        </div>
                      ) : (
                        <div className="bg-gray-800 rounded border border-gray-600">
                          <Textarea
                            value={selectedTemplateData.html}
                            readOnly
                            className="bg-transparent border-none text-white font-mono text-xs min-h-[500px] resize-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-gray-900 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Mail className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl text-white mb-2">Select a Template</h3>
                  <p className="text-gray-400">
                    Choose a template from the list to view and edit its content
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Template Dialog */}
        {isEditing && editingTemplate && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Template: {editingTemplate.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Template Name</Label>
                    <Input
                      value={editingTemplate.name}
                      onChange={(e) => setEditingTemplate(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select 
                      value={editingTemplate.category} 
                      onValueChange={(value) => setEditingTemplate(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={editingTemplate.subject}
                    onChange={(e) => setEditingTemplate(prev => ({ ...prev, subject: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div>
                  <Label>HTML Content</Label>
                  <Textarea
                    value={editingTemplate.html}
                    onChange={(e) => setEditingTemplate(prev => ({ ...prev, html: e.target.value }))}
                    className="bg-gray-800 border-gray-600 text-white font-mono text-sm min-h-[400px]"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(false)}
                    className="border-gray-600 text-white"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveTemplate}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Template
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}