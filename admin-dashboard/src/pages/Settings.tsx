import { User, Bell, Shield, CreditCard, Link2, Smartphone, Globe, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Settings() {
  return (
    <div className="flex min-h-screen bg-background w-full">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account and preferences</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid grid-cols-4 lg:grid-cols-6 gap-2">
                <TabsTrigger value="profile" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">Notifications</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="gap-2">
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">Billing</span>
                </TabsTrigger>
                <TabsTrigger value="integrations" className="gap-2">
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Integrations</span>
                </TabsTrigger>
                <TabsTrigger value="whatsapp" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <div className="card-elevated p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Profile Information</h3>
                    <div className="flex items-center gap-6 mb-6">
                      <Avatar className="h-20 w-20">
                        <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">JD</AvatarFallback>
                      </Avatar>
                      <div>
                        <Button variant="outline" size="sm">Change Photo</Button>
                        <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max 2MB</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input defaultValue="Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" defaultValue="john@company.com" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input type="tel" defaultValue="+1 234 567 8900" />
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company Name</Label>
                        <Input defaultValue="Acme Inc." />
                      </div>
                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input defaultValue="https://acme.com" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="gradient-whatsapp text-primary-foreground">Save Changes</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <div className="card-elevated p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
                  <div className="space-y-4">
                    {[
                      { title: "New Messages", description: "Get notified when you receive new messages" },
                      { title: "Broadcast Updates", description: "Updates on your broadcast campaign status" },
                      { title: "Contact Activity", description: "When contacts engage with your messages" },
                      { title: "Weekly Reports", description: "Receive weekly performance reports" },
                      { title: "Product Updates", description: "Stay updated on new features and improvements" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                        <Switch defaultChecked={idx < 3} />
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <div className="card-elevated p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Current Password</Label>
                      <Input type="password" placeholder="Enter current password" />
                    </div>
                    <div className="space-y-2">
                      <Label>New Password</Label>
                      <Input type="password" placeholder="Enter new password" />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm New Password</Label>
                      <Input type="password" placeholder="Confirm new password" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-foreground">Two-Factor Authentication</h4>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                    </div>
                    <Button variant="outline">Enable 2FA</Button>
                  </div>
                  <div className="flex justify-end">
                    <Button className="gradient-whatsapp text-primary-foreground">Update Password</Button>
                  </div>
                </div>
              </TabsContent>

              {/* Billing Tab */}
              <TabsContent value="billing">
                <div className="space-y-6">
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Current Plan</h3>
                        <p className="text-muted-foreground">You are on the Pro plan</p>
                      </div>
                      <Button variant="outline">Upgrade Plan</Button>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-foreground">Pro Plan</h4>
                          <p className="text-sm text-muted-foreground">10,000 messages/month</p>
                        </div>
                        <span className="text-2xl font-bold text-foreground">$49<span className="text-sm font-normal text-muted-foreground">/mo</span></span>
                      </div>
                    </div>
                  </div>
                  <div className="card-elevated p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Payment Method</h3>
                    <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
                      <div className="p-2 rounded-lg bg-muted">
                        <CreditCard className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                        <p className="text-sm text-muted-foreground">Expires 12/25</p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Integrations Tab */}
              <TabsContent value="integrations">
                <div className="card-elevated p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-6">Connected Apps</h3>
                  <div className="space-y-4">
                    {[
                      { name: "Shopify", description: "Sync your e-commerce store", connected: true },
                      { name: "HubSpot", description: "CRM integration", connected: true },
                      { name: "Zapier", description: "Automate workflows", connected: false },
                      { name: "Slack", description: "Team notifications", connected: false },
                    ].map((app, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Globe className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground">{app.name}</h4>
                            <p className="text-sm text-muted-foreground">{app.description}</p>
                          </div>
                        </div>
                        <Button variant={app.connected ? "outline" : "default"} size="sm">
                          {app.connected ? "Disconnect" : "Connect"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* WhatsApp Tab */}
              <TabsContent value="whatsapp">
                <div className="card-elevated p-6 space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">WhatsApp Business Settings</h3>
                  <div className="p-4 rounded-xl bg-success/5 border border-success/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-success/10">
                        <Smartphone className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <h4 className="font-medium text-foreground">Connected</h4>
                        <p className="text-sm text-muted-foreground">+1 234 567 8900</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Business Display Name</Label>
                      <Input defaultValue="Acme Store" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Description</Label>
                      <Input defaultValue="Premium quality products for everyone" />
                    </div>
                    <div className="space-y-2">
                      <Label>Business Category</Label>
                      <Input defaultValue="E-commerce" />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button className="gradient-whatsapp text-primary-foreground">Save Changes</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
