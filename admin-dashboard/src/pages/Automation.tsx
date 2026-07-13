import { useState } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Header } from '@/components/dashboard/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/shared/Modal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Bot,
  Zap,
  MessageSquare,
  Clock,
  Play,
  Pause,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  Settings,
  GitBranch,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Automation {
  id: number;
  name: string;
  description: string;
  trigger: string;
  triggerType: 'keyword' | 'time' | 'event' | 'webhook';
  actions: string[];
  isActive: boolean;
  executionCount: number;
  lastTriggered: string;
  createdAt: string;
}

const initialAutomations: Automation[] = [
  {
    id: 1,
    name: 'Welcome Flow',
    description: 'Greet new customers and collect their preferences',
    trigger: 'New contact added',
    triggerType: 'event',
    actions: ['Send welcome message', 'Wait 5 minutes', 'Ask for preferences', 'Tag contact'],
    isActive: true,
    executionCount: 1250,
    lastTriggered: '2 hours ago',
    createdAt: '2024-01-10',
  },
  {
    id: 2,
    name: 'Auto-Reply (Business Hours)',
    description: 'Respond to messages during business hours',
    trigger: 'Message received',
    triggerType: 'keyword',
    actions: ['Check business hours', 'Send acknowledgment', 'Assign to agent'],
    isActive: true,
    executionCount: 3456,
    lastTriggered: '10 minutes ago',
    createdAt: '2024-01-12',
  },
  {
    id: 3,
    name: 'Out of Office',
    description: 'Automated response outside business hours',
    trigger: 'After hours message',
    triggerType: 'time',
    actions: ['Send out-of-office message', 'Create follow-up task'],
    isActive: true,
    executionCount: 890,
    lastTriggered: 'Yesterday',
    createdAt: '2024-01-15',
  },
  {
    id: 4,
    name: 'Order Status Bot',
    description: 'Automatically respond to order inquiries',
    trigger: 'Keywords: order, status, tracking',
    triggerType: 'keyword',
    actions: ['Extract order ID', 'Fetch order status', 'Send status update'],
    isActive: false,
    executionCount: 567,
    lastTriggered: '3 days ago',
    createdAt: '2024-01-18',
  },
  {
    id: 5,
    name: 'Lead Qualification',
    description: 'Qualify leads through interactive questions',
    trigger: 'Keyword: interested, pricing, demo',
    triggerType: 'keyword',
    actions: ['Send qualification questions', 'Score responses', 'Route to sales team'],
    isActive: true,
    executionCount: 234,
    lastTriggered: '1 hour ago',
    createdAt: '2024-01-20',
  },
];

const triggerTypeStyles = {
  keyword: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  time: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  event: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  webhook: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
};

const triggerTypeIcons = {
  keyword: MessageSquare,
  time: Clock,
  event: Zap,
  webhook: GitBranch,
};

export default function Automation() {
  const [automations, setAutomations] = useState<Automation[]>(initialAutomations);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFlowModalOpen, setIsFlowModalOpen] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);
  const [newAutomation, setNewAutomation] = useState<{
    name: string;
    description: string;
    trigger: string;
    triggerType: 'keyword' | 'time' | 'event' | 'webhook';
    actions: string[];
  }>({
    name: '',
    description: '',
    trigger: '',
    triggerType: 'keyword',
    actions: [''],
  });
  const { toast } = useToast();

  const filteredAutomations = automations.filter((automation) =>
    automation.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    automation.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = () => {
    const automation: Automation = {
      id: Date.now(),
      ...newAutomation,
      actions: newAutomation.actions.filter((a) => a.trim()),
      isActive: true,
      executionCount: 0,
      lastTriggered: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAutomations([automation, ...automations]);
    setIsCreateModalOpen(false);
    setNewAutomation({ name: '', description: '', trigger: '', triggerType: 'keyword', actions: [''] });
    toast({ title: 'Automation created', description: 'Your automation is now active.' });
  };

  const handleEdit = () => {
    if (!selectedAutomation) return;
    setAutomations(automations.map((a) => (a.id === selectedAutomation.id ? selectedAutomation : a)));
    setIsEditModalOpen(false);
    toast({ title: 'Automation updated', description: 'Changes have been saved.' });
  };

  const handleDelete = () => {
    if (!selectedAutomation) return;
    setAutomations(automations.filter((a) => a.id !== selectedAutomation.id));
    setIsDeleteModalOpen(false);
    toast({ title: 'Automation deleted', description: 'The automation has been removed.', variant: 'destructive' });
  };

  const handleToggle = (automation: Automation) => {
    setAutomations(automations.map((a) => (a.id === automation.id ? { ...a, isActive: !a.isActive } : a)));
    toast({
      title: automation.isActive ? 'Automation paused' : 'Automation activated',
      description: `${automation.name} is now ${automation.isActive ? 'paused' : 'running'}.`,
    });
  };

  const handleDuplicate = (automation: Automation) => {
    const duplicate: Automation = {
      ...automation,
      id: Date.now(),
      name: `${automation.name} (Copy)`,
      executionCount: 0,
      lastTriggered: 'Never',
      createdAt: new Date().toISOString().split('T')[0],
    };
    setAutomations([duplicate, ...automations]);
    toast({ title: 'Automation duplicated', description: 'A copy has been created.' });
  };

  const addAction = () => {
    setNewAutomation({ ...newAutomation, actions: [...newAutomation.actions, ''] });
  };

  const updateAction = (index: number, value: string) => {
    const actions = [...newAutomation.actions];
    actions[index] = value;
    setNewAutomation({ ...newAutomation, actions });
  };

  const removeAction = (index: number) => {
    const actions = newAutomation.actions.filter((_, i) => i !== index);
    setNewAutomation({ ...newAutomation, actions });
  };

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Automation & Chatbots</h1>
              <p className="text-muted-foreground">Create automated workflows and chatbot responses</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Automation
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Automations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{automations.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{automations.filter((a) => a.isActive).length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{automations.reduce((acc, a) => acc + a.executionCount, 0).toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Today's Runs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Automations List */}
          <div className="grid gap-4">
            {filteredAutomations.map((automation) => {
              const TriggerIcon = triggerTypeIcons[automation.triggerType];
              return (
                <Card key={automation.id} className={!automation.isActive ? 'opacity-60' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${automation.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Bot className={`h-6 w-6 ${automation.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle>{automation.name}</CardTitle>
                            <Badge className={triggerTypeStyles[automation.triggerType]}>
                              <TriggerIcon className="h-3 w-3 mr-1" />
                              {automation.triggerType}
                            </Badge>
                            {automation.isActive ? (
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <Play className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <Pause className="h-3 w-3 mr-1" />
                                Paused
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1">{automation.description}</CardDescription>
                        </div>
                      </div>
                      <Switch checked={automation.isActive} onCheckedChange={() => handleToggle(automation)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Trigger */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Trigger:</span>
                        <span className="font-medium">{automation.trigger}</span>
                      </div>

                      {/* Actions Flow */}
                      <div className="flex items-center flex-wrap gap-2">
                        {automation.actions.map((action, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="px-3 py-1.5 bg-muted rounded-lg text-sm">{action}</div>
                            {index < automation.actions.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                          </div>
                        ))}
                      </div>

                      {/* Stats & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Executed {automation.executionCount.toLocaleString()} times</span>
                          <span>•</span>
                          <span>Last triggered: {automation.lastTriggered}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedAutomation(automation); setIsFlowModalOpen(true); }}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Configure
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => { setSelectedAutomation(automation); setIsEditModalOpen(true); }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDuplicate(automation)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => { setSelectedAutomation(automation); setIsDeleteModalOpen(true); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create Modal */}
          <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} title="Create Automation">
            <div className="space-y-4">
              <div>
                <Label>Automation Name</Label>
                <Input
                  value={newAutomation.name}
                  onChange={(e) => setNewAutomation({ ...newAutomation, name: e.target.value })}
                  placeholder="e.g., Welcome Flow"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newAutomation.description}
                  onChange={(e) => setNewAutomation({ ...newAutomation, description: e.target.value })}
                  placeholder="What does this automation do?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Trigger Type</Label>
                  <Select
                    value={newAutomation.triggerType}
                    onValueChange={(v) => setNewAutomation({ ...newAutomation, triggerType: v as 'keyword' | 'time' | 'event' | 'webhook' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Keyword</SelectItem>
                      <SelectItem value="time">Time-based</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="webhook">Webhook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trigger</Label>
                  <Input
                    value={newAutomation.trigger}
                    onChange={(e) => setNewAutomation({ ...newAutomation, trigger: e.target.value })}
                    placeholder="e.g., hello, help"
                  />
                </div>
              </div>
              <div>
                <Label>Actions</Label>
                <div className="space-y-2">
                  {newAutomation.actions.map((action, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={action}
                        onChange={(e) => updateAction(index, e.target.value)}
                        placeholder={`Action ${index + 1}`}
                      />
                      {newAutomation.actions.length > 1 && (
                        <Button variant="outline" size="icon" onClick={() => removeAction(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addAction}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Action
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newAutomation.name || !newAutomation.trigger}>Create</Button>
              </div>
            </div>
          </Modal>

          {/* Edit Modal */}
          <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Edit Automation">
            {selectedAutomation && (
              <div className="space-y-4">
                <div>
                  <Label>Automation Name</Label>
                  <Input
                    value={selectedAutomation.name}
                    onChange={(e) => setSelectedAutomation({ ...selectedAutomation, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={selectedAutomation.description}
                    onChange={(e) => setSelectedAutomation({ ...selectedAutomation, description: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Trigger</Label>
                  <Input
                    value={selectedAutomation.trigger}
                    onChange={(e) => setSelectedAutomation({ ...selectedAutomation, trigger: e.target.value })}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleEdit}>Save Changes</Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Flow Builder Modal */}
          <Modal open={isFlowModalOpen} onOpenChange={setIsFlowModalOpen} title="Configure Flow">
            {selectedAutomation && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Visual flow builder coming soon! For now, you can edit actions directly.</p>
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Flow</h4>
                  <div className="space-y-2">
                    {selectedAutomation.actions.map((action, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs">{index + 1}</div>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsFlowModalOpen(false)}>Close</Button>
              </div>
            )}
          </Modal>

          {/* Delete Modal */}
          <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Delete Automation">
            <div className="space-y-4">
              <p>Are you sure you want to delete <strong>{selectedAutomation?.name}</strong>?</p>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete</Button>
              </div>
            </div>
          </Modal>
        </div>
      </main>
    </div>
  );
}
