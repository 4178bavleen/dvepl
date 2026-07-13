import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/shared/Modal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: number;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  isActive: boolean;
  subscriberCount: number;
  messageLimit: number;
  contactLimit: number;
}

const initialPlans: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    price: 29,
    interval: 'monthly',
    features: ['1,000 messages/month', '500 contacts', 'Basic templates', 'Email support'],
    isActive: true,
    subscriberCount: 156,
    messageLimit: 1000,
    contactLimit: 500,
  },
  {
    id: 2,
    name: 'Professional',
    price: 79,
    interval: 'monthly',
    features: ['10,000 messages/month', '5,000 contacts', 'All templates', 'Priority support', 'Analytics'],
    isActive: true,
    subscriberCount: 89,
    messageLimit: 10000,
    contactLimit: 5000,
  },
  {
    id: 3,
    name: 'Enterprise',
    price: 199,
    interval: 'monthly',
    features: ['Unlimited messages', 'Unlimited contacts', 'Custom templates', '24/7 support', 'API access', 'White-label'],
    isActive: true,
    subscriberCount: 34,
    messageLimit: -1,
    contactLimit: -1,
  },
];

export default function PlansManagement() {
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    interval: 'monthly' as const,
    features: '',
    messageLimit: 1000,
    contactLimit: 500,
  });
  const { toast } = useToast();

  const handleAddPlan = () => {
    const plan: Plan = {
      id: Date.now(),
      name: newPlan.name,
      price: newPlan.price,
      interval: newPlan.interval,
      features: newPlan.features.split('\n').filter((f) => f.trim()),
      isActive: true,
      subscriberCount: 0,
      messageLimit: newPlan.messageLimit,
      contactLimit: newPlan.contactLimit,
    };
    setPlans([...plans, plan]);
    setIsAddModalOpen(false);
    setNewPlan({ name: '', price: 0, interval: 'monthly', features: '', messageLimit: 1000, contactLimit: 500 });
    toast({ title: 'Plan created', description: `${plan.name} plan has been added.` });
  };

  const handleEditPlan = () => {
    if (!selectedPlan) return;
    setPlans(plans.map((p) => (p.id === selectedPlan.id ? selectedPlan : p)));
    setIsEditModalOpen(false);
    toast({ title: 'Plan updated', description: `${selectedPlan.name} plan has been updated.` });
  };

  const handleDeletePlan = () => {
    if (!selectedPlan) return;
    setPlans(plans.filter((p) => p.id !== selectedPlan.id));
    setIsDeleteModalOpen(false);
    toast({ title: 'Plan deleted', description: `${selectedPlan.name} plan has been removed.`, variant: 'destructive' });
  };

  const handleToggleActive = (plan: Plan) => {
    setPlans(plans.map((p) => (p.id === plan.id ? { ...p, isActive: !p.isActive } : p)));
    toast({
      title: plan.isActive ? 'Plan deactivated' : 'Plan activated',
      description: `${plan.name} is now ${plan.isActive ? 'inactive' : 'active'}.`,
    });
  };

  const totalRevenue = plans.reduce((acc, plan) => acc + plan.price * plan.subscriberCount, 0);
  const totalSubscribers = plans.reduce((acc, plan) => acc + plan.subscriberCount, 0);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Plans & Pricing</h1>
            <p className="text-muted-foreground">Manage subscription plans and pricing tiers</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Plan
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Plans</CardDescription>
              <CardTitle className="text-3xl">{plans.filter((p) => p.isActive).length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Subscribers</CardDescription>
              <CardTitle className="text-3xl">{totalSubscribers}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Monthly Revenue</CardDescription>
              <CardTitle className="text-3xl">${totalRevenue.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className={!plan.isActive ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {plan.name}
                    {!plan.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </CardTitle>
                  <Switch checked={plan.isActive} onCheckedChange={() => handleToggleActive(plan)} />
                </div>
                <CardDescription className="text-3xl font-bold text-foreground">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">/{plan.interval}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {plan.subscriberCount} subscribers
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setIsDeleteModalOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Plan Modal */}
        <Modal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} title="Add New Plan">
          <div className="space-y-4">
            <div>
              <Label>Plan Name</Label>
              <Input
                value={newPlan.name}
                onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                placeholder="e.g., Business Pro"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Price ($)</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Message Limit</Label>
                <Input
                  type="number"
                  value={newPlan.messageLimit}
                  onChange={(e) => setNewPlan({ ...newPlan, messageLimit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>Features (one per line)</Label>
              <Textarea
                value={newPlan.features}
                onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })}
                placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddPlan} disabled={!newPlan.name || newPlan.price <= 0}>Create Plan</Button>
            </div>
          </div>
        </Modal>

        {/* Edit Plan Modal */}
        <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Edit Plan">
          {selectedPlan && (
            <div className="space-y-4">
              <div>
                <Label>Plan Name</Label>
                <Input
                  value={selectedPlan.name}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={selectedPlan.price}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Message Limit</Label>
                  <Input
                    type="number"
                    value={selectedPlan.messageLimit}
                    onChange={(e) => setSelectedPlan({ ...selectedPlan, messageLimit: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <Label>Features (one per line)</Label>
                <Textarea
                  value={selectedPlan.features.join('\n')}
                  onChange={(e) => setSelectedPlan({ ...selectedPlan, features: e.target.value.split('\n') })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button onClick={handleEditPlan}>Save Changes</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Delete Plan">
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the <strong>{selectedPlan?.name}</strong> plan?
              {selectedPlan && selectedPlan.subscriberCount > 0 && (
                <span className="text-destructive block mt-2">
                  Warning: This plan has {selectedPlan.subscriberCount} active subscribers.
                </span>
              )}
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeletePlan}>Delete Plan</Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
