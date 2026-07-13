import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/shared/Modal';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CreditCard,
  Download,
  Check,
  ArrowUpRight,
  Zap,
  MessageSquare,
  Users,
  Bot,
  Receipt,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
}

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  messageLimit: number;
  contactLimit: number;
  teamLimit: number;
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: ['1,000 messages/month', '500 contacts', '1 team member', 'Basic templates', 'Email support'],
    messageLimit: 1000,
    contactLimit: 500,
    teamLimit: 1,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 79,
    interval: 'monthly',
    features: ['10,000 messages/month', '5,000 contacts', '5 team members', 'All templates', 'Priority support', 'Analytics', 'Automations'],
    messageLimit: 10000,
    contactLimit: 5000,
    teamLimit: 5,
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    interval: 'monthly',
    features: ['Unlimited messages', 'Unlimited contacts', 'Unlimited team', 'Custom templates', '24/7 support', 'API access', 'White-label', 'Dedicated account manager'],
    messageLimit: -1,
    contactLimit: -1,
    teamLimit: -1,
  },
];

const invoices: Invoice[] = [
  { id: 'INV-2024-001', date: '2024-01-01', amount: 79, status: 'paid' },
  { id: 'INV-2023-012', date: '2023-12-01', amount: 79, status: 'paid' },
  { id: 'INV-2023-011', date: '2023-11-01', amount: 79, status: 'paid' },
  { id: 'INV-2023-010', date: '2023-10-01', amount: 29, status: 'paid' },
];

export default function Billing() {
  const [currentPlan] = useState('professional');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const currentPlanData = plans.find((p) => p.id === currentPlan)!;
  
  const usage = {
    messages: { used: 7500, limit: 10000 },
    contacts: { used: 3200, limit: 5000 },
    team: { used: 4, limit: 5 },
  };

  const handleUpgrade = (plan: Plan) => {
    setSelectedPlan(plan);
    setIsUpgradeModalOpen(true);
  };

  const confirmUpgrade = () => {
    setIsUpgradeModalOpen(false);
    toast({
      title: 'Plan upgraded!',
      description: `You've been upgraded to the ${selectedPlan?.name} plan.`,
    });
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast({
      title: 'Downloading invoice',
      description: `Invoice ${invoice.id} is being downloaded.`,
    });
  };

  const handleUpdatePayment = () => {
    setIsPaymentModalOpen(false);
    toast({
      title: 'Payment method updated',
      description: 'Your payment method has been updated successfully.',
    });
  };

  const handleCancelSubscription = () => {
    setIsCancelModalOpen(false);
    toast({
      title: 'Subscription cancelled',
      description: 'Your subscription will remain active until the end of the billing period.',
      variant: 'destructive',
    });
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Subscription</h1>
            <p className="text-muted-foreground">Manage your subscription plan and payment methods</p>
          </div>

          {/* Current Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Current Plan
                    <Badge className="bg-primary/10 text-primary">{currentPlanData.name}</Badge>
                  </CardTitle>
                  <CardDescription>Your subscription renews on February 1, 2024</CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold">${currentPlanData.price}</p>
                  <p className="text-sm text-muted-foreground">per month</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Usage */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Messages
                    </span>
                    <span>{usage.messages.used.toLocaleString()} / {usage.messages.limit.toLocaleString()}</span>
                  </div>
                  <Progress value={(usage.messages.used / usage.messages.limit) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Contacts
                    </span>
                    <span>{usage.contacts.used.toLocaleString()} / {usage.contacts.limit.toLocaleString()}</span>
                  </div>
                  <Progress value={(usage.contacts.used / usage.contacts.limit) * 100} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Team Members
                    </span>
                    <span>{usage.team.used} / {usage.team.limit}</span>
                  </div>
                  <Progress value={(usage.team.used / usage.team.limit) * 100} />
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setIsPaymentModalOpen(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" onClick={() => setIsCancelModalOpen(true)}>
                  Cancel Subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Plans */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Plans</h2>
            <div className="grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <Card key={plan.id} className={plan.popular ? 'border-primary shadow-lg' : ''}>
                  {plan.popular && (
                    <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-medium">
                      Most Popular
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      <span className="text-3xl font-bold text-foreground">${plan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    {plan.id === currentPlan ? (
                      <Button disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : plan.price > currentPlanData.price ? (
                      <Button className="w-full" onClick={() => handleUpgrade(plan)}>
                        <ArrowUpRight className="h-4 w-4 mr-2" />
                        Upgrade
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full" onClick={() => handleUpgrade(plan)}>
                        Downgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-background rounded">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium">Visa ending in 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(true)}>
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Billing History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Receipt className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        <p className="text-sm text-muted-foreground">{invoice.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-medium">${invoice.amount}</span>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(invoice)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upgrade Modal */}
          <Modal open={isUpgradeModalOpen} onOpenChange={setIsUpgradeModalOpen} title="Confirm Plan Change">
            {selectedPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{selectedPlan.name} Plan</span>
                    <span className="text-xl font-bold">${selectedPlan.price}/mo</span>
                  </div>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {selectedPlan.features.slice(0, 3).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
                {selectedPlan.price > currentPlanData.price ? (
                  <div className="flex items-start gap-2 p-3 bg-primary/10 rounded-lg">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Upgrade takes effect immediately</p>
                      <p className="text-muted-foreground">You'll be charged ${selectedPlan.price - currentPlanData.price} prorated for this billing cycle.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium">Downgrade notice</p>
                      <p className="text-muted-foreground">Your new plan will take effect at the start of your next billing cycle.</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsUpgradeModalOpen(false)}>Cancel</Button>
                  <Button onClick={confirmUpgrade}>Confirm Change</Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Payment Method Modal */}
          <Modal open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen} title="Update Payment Method">
            <div className="space-y-4">
              <div>
                <Label>Card Number</Label>
                <Input placeholder="4242 4242 4242 4242" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Expiry Date</Label>
                  <Input placeholder="MM/YY" />
                </div>
                <div>
                  <Label>CVC</Label>
                  <Input placeholder="123" />
                </div>
              </div>
              <div>
                <Label>Name on Card</Label>
                <Input placeholder="John Doe" />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
                <Button onClick={handleUpdatePayment}>Update Card</Button>
              </div>
            </div>
          </Modal>

          {/* Cancel Modal */}
          <Modal open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen} title="Cancel Subscription">
            <div className="space-y-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm">
                  Are you sure you want to cancel your subscription? You'll lose access to:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• {currentPlanData.messageLimit.toLocaleString()} messages per month</li>
                  <li>• {currentPlanData.contactLimit.toLocaleString()} contacts</li>
                  <li>• All automations and chatbots</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Your subscription will remain active until the end of your current billing period.
              </p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCancelModalOpen(false)}>Keep Subscription</Button>
                <Button variant="destructive" onClick={handleCancelSubscription}>Cancel Subscription</Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}
