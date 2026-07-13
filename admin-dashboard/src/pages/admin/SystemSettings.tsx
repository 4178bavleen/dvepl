import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings, Globe, Mail, Shield, Database, Bell, Code, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SystemSettings() {
  const { toast } = useToast();

  // General Settings
  const [siteName, setSiteName] = useState('ChatFlow');
  const [siteDescription, setSiteDescription] = useState('WhatsApp Business SaaS Platform');
  const [supportEmail, setSupportEmail] = useState('support@chatflow.com');
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Email Settings
  const [smtpHost, setSmtpHost] = useState('smtp.mailgun.org');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('postmaster@chatflow.com');
  const [emailFromName, setEmailFromName] = useState('ChatFlow');

  // Security Settings
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('5');
  const [passwordMinLength, setPasswordMinLength] = useState('8');

  // API Settings
  const [rateLimitPerMinute, setRateLimitPerMinute] = useState('60');
  const [webhookRetries, setWebhookRetries] = useState('3');
  const [apiVersion, setApiVersion] = useState('v2');

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [slackIntegration, setSlackIntegration] = useState(false);
  const [alertThreshold, setAlertThreshold] = useState('90');

  const handleSave = (section: string) => {
    toast({
      title: 'Settings saved',
      description: `${section} settings have been updated successfully.`,
    });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Settings</h1>
          <p className="text-muted-foreground">Configure platform-wide settings and preferences</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              API
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>Configure basic platform information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Site Name</Label>
                    <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Support Email</Label>
                    <Input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Site Description</Label>
                  <Textarea value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Disable access to the platform for non-admin users</p>
                  </div>
                  <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
                </div>
                <Button onClick={() => handleSave('General')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>Configure SMTP settings for outgoing emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>SMTP Host</Label>
                    <Input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Port</Label>
                    <Input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Username</Label>
                    <Input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>SMTP Password</Label>
                    <Input type="password" placeholder="••••••••" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>From Name</Label>
                  <Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} />
                </div>
                <Button onClick={() => handleSave('Email')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Configure platform security options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Force all users to enable 2FA</p>
                  </div>
                  <Switch checked={twoFactorRequired} onCheckedChange={setTwoFactorRequired} />
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Session Timeout (minutes)</Label>
                    <Input
                      type="number"
                      value={sessionTimeout}
                      onChange={(e) => setSessionTimeout(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Login Attempts</Label>
                    <Input
                      type="number"
                      value={maxLoginAttempts}
                      onChange={(e) => setMaxLoginAttempts(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Password Length</Label>
                    <Input
                      type="number"
                      value={passwordMinLength}
                      onChange={(e) => setPasswordMinLength(e.target.value)}
                    />
                  </div>
                </div>
                <Button onClick={() => handleSave('Security')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Settings */}
          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>Configure API rate limits and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Rate Limit (requests/minute)</Label>
                    <Input
                      type="number"
                      value={rateLimitPerMinute}
                      onChange={(e) => setRateLimitPerMinute(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook Retry Attempts</Label>
                    <Input
                      type="number"
                      value={webhookRetries}
                      onChange={(e) => setWebhookRetries(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>API Version</Label>
                    <Select value={apiVersion} onValueChange={setApiVersion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="v1">v1 (Legacy)</SelectItem>
                        <SelectItem value="v2">v2 (Current)</SelectItem>
                        <SelectItem value="v3">v3 (Beta)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-4 w-4" />
                    <Label>API Endpoint</Label>
                  </div>
                  <code className="text-sm">https://api.chatflow.com/{apiVersion}</code>
                </div>
                <Button onClick={() => handleSave('API')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Configure system notifications and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send system alerts via email</p>
                  </div>
                  <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">Send alerts to Slack channel</p>
                  </div>
                  <Switch checked={slackIntegration} onCheckedChange={setSlackIntegration} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Alert Threshold (%)</Label>
                  <p className="text-sm text-muted-foreground">Send alerts when resource usage exceeds this percentage</p>
                  <Input
                    type="number"
                    value={alertThreshold}
                    onChange={(e) => setAlertThreshold(e.target.value)}
                    className="w-32"
                  />
                </div>
                <Button onClick={() => handleSave('Notification')}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
