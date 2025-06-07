import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Bell, User, Key, Globe } from "lucide-react";
import LanguageSwitcher from "@/components/language-switcher";

export default function ClientSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: userData } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) throw new Error('Not authenticated');
      return response.json();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    }
  });

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-white">{t('settings')}</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="profile" className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="language" className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Language</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center space-x-2">
              <Key className="w-4 h-4" />
              <span>Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Email</Label>
                    <Input 
                      value={userData?.user?.email || ''} 
                      disabled 
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Full Name</Label>
                    <Input 
                      placeholder="Enter your full name"
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Phone Number</Label>
                  <Input 
                    placeholder="Enter your phone number"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Address</Label>
                  <Input 
                    placeholder="Enter your address"
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <Button onClick={() => console.log('Update profile')}>
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Password</h3>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Current Password</Label>
                    <Input 
                      type="password" 
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">New Password</Label>
                    <Input 
                      type="password" 
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Confirm New Password</Label>
                    <Input 
                      type="password" 
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <Button>Change Password</Button>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Enable 2FA for enhanced security</p>
                      <p className="text-sm text-gray-500">Protect your account with an additional verification step</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Session Management</h3>
                  <div className="space-y-2">
                    <p className="text-gray-300">Active sessions</p>
                    <div className="bg-gray-800 p-3 rounded-lg">
                      <p className="text-sm text-gray-300">Current session - Chrome on Windows</p>
                      <p className="text-xs text-gray-500">Last active: Just now</p>
                    </div>
                  </div>
                  <Button variant="outline">Logout All Sessions</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive updates via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Tax Payment Reminders</p>
                      <p className="text-sm text-gray-500">Get notified about pending tax payments</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Portfolio Updates</p>
                      <p className="text-sm text-gray-500">Notifications about portfolio changes</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Security Alerts</p>
                      <p className="text-sm text-gray-500">Important security notifications</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Language & Region</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-gray-300">Interface Language</Label>
                    <div className="mt-2">
                      <LanguageSwitcher />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Currency Display</Label>
                    <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                      <option value="EUR">Euro (EUR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="GBP">British Pound (GBP)</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-gray-300">Time Zone</Label>
                    <select className="w-full p-2 bg-gray-800 border border-gray-700 rounded-md text-white">
                      <option value="UTC">UTC</option>
                      <option value="Europe/Paris">Europe/Paris</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Advanced Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Developer Mode</p>
                      <p className="text-sm text-gray-500">Enable advanced debugging features</p>
                    </div>
                    <Switch />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-300">Data Analytics</p>
                      <p className="text-sm text-gray-500">Allow anonymous usage analytics</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator className="bg-gray-700" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Data Management</h3>
                    <Button variant="outline">Export Account Data</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}