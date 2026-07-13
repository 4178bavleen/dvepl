import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Header } from '@/components/dashboard/Header';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/shared/Modal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  FileText,
  Edit,
  Trash2,
  Copy,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare,
  Image,
  Video,
  File,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Template {
  id: number;
  name: string;
  category: string;
  type: 'text' | 'media' | 'interactive';
  status: 'approved' | 'pending' | 'rejected';
  content: string;
  language: string;
  usageCount: number;
  createdAt: string;
}

const initialTemplates: Template[] = [
  { id: 1, name: 'Welcome Message', category: 'Marketing', type: 'text', status: 'approved', content: 'Hello {{1}}! Welcome to our service. We\'re excited to have you on board!', language: 'English', usageCount: 1250, createdAt: '2024-01-10' },
  { id: 2, name: 'Order Confirmation', category: 'Transactional', type: 'text', status: 'approved', content: 'Hi {{1}}, your order #{{2}} has been confirmed. Expected delivery: {{3}}.', language: 'English', usageCount: 890, createdAt: '2024-01-12' },
  { id: 3, name: 'Appointment Reminder', category: 'Utility', type: 'text', status: 'approved', content: 'Reminder: You have an appointment scheduled for {{1}} at {{2}}. Reply YES to confirm.', language: 'English', usageCount: 567, createdAt: '2024-01-15' },
  { id: 4, name: 'Product Showcase', category: 'Marketing', type: 'media', status: 'pending', content: 'Check out our new collection! {{1}}', language: 'English', usageCount: 0, createdAt: '2024-01-18' },
  { id: 5, name: 'Payment Receipt', category: 'Transactional', type: 'text', status: 'rejected', content: 'Payment of {{1}} received. Transaction ID: {{2}}. Thank you!', language: 'English', usageCount: 0, createdAt: '2024-01-20' },
];

const statusStyles = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const statusIcons = {
  approved: CheckCircle,
  pending: Clock,
  rejected: XCircle,
};

const typeIcons = {
  text: MessageSquare,
  media: Image,
  interactive: FileText,
};

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [newTemplate, setNewTemplate] = useState<{
    name: string;
    category: string;
    type: 'text' | 'media' | 'interactive';
    content: string;
    language: string;
  }>({
    name: '',
    category: 'Marketing',
    type: 'text',
    content: '',
    language: 'English',
  });
  const { toast } = useToast();

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCreate = () => {
    const template: Template = {
      id: Date.now(),
      ...newTemplate,
      status: 'pending',
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([template, ...templates]);
    setIsCreateModalOpen(false);
    setNewTemplate({ name: '', category: 'Marketing', type: 'text', content: '', language: 'English' });
    toast({ title: 'Template created', description: 'Your template has been submitted for approval.' });
  };

  const handleEdit = () => {
    if (!selectedTemplate) return;
    setTemplates(templates.map((t) => (t.id === selectedTemplate.id ? { ...selectedTemplate, status: 'pending' as const } : t)));
    setIsEditModalOpen(false);
    toast({ title: 'Template updated', description: 'Your template has been resubmitted for approval.' });
  };

  const handleDelete = () => {
    if (!selectedTemplate) return;
    setTemplates(templates.filter((t) => t.id !== selectedTemplate.id));
    setIsDeleteModalOpen(false);
    toast({ title: 'Template deleted', description: 'The template has been removed.', variant: 'destructive' });
  };

  const handleDuplicate = (template: Template) => {
    const duplicate: Template = {
      ...template,
      id: Date.now(),
      name: `${template.name} (Copy)`,
      status: 'pending',
      usageCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTemplates([duplicate, ...templates]);
    toast({ title: 'Template duplicated', description: 'A copy has been created and submitted for approval.' });
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
              <h1 className="text-3xl font-bold text-foreground">Message Templates</h1>
              <p className="text-muted-foreground">Create and manage WhatsApp-approved message templates</p>
            </div>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{templates.filter((t) => t.status === 'approved').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{templates.filter((t) => t.status === 'pending').length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.reduce((acc, t) => acc + t.usageCount, 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Transactional">Transactional</SelectItem>
                <SelectItem value="Utility">Utility</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => {
              const StatusIcon = statusIcons[template.status];
              const TypeIcon = typeIcons[template.type];
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <TypeIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{template.category}</p>
                        </div>
                      </div>
                      <Badge className={statusStyles[template.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {template.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{template.language}</span>
                      <span>Used {template.usageCount} times</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => { setSelectedTemplate(template); setIsPreviewModalOpen(true); }}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Preview
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => { setSelectedTemplate(template); setIsEditModalOpen(true); }}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDuplicate(template)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => { setSelectedTemplate(template); setIsDeleteModalOpen(true); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Create Modal */}
          <Modal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} title="Create Template">
            <div className="space-y-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Welcome Message"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={newTemplate.category} onValueChange={(v) => setNewTemplate({ ...newTemplate, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Transactional">Transactional</SelectItem>
                      <SelectItem value="Utility">Utility</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select value={newTemplate.type} onValueChange={(v) => setNewTemplate({ ...newTemplate, type: v as 'text' | 'media' | 'interactive' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="interactive">Interactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Message Content</Label>
                <Textarea
                  value={newTemplate.content}
                  onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                  placeholder="Use {{1}}, {{2}} for variables..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Use {'{{1}}'}, {'{{2}}'} for dynamic variables</p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!newTemplate.name || !newTemplate.content}>Submit for Approval</Button>
              </div>
            </div>
          </Modal>

          {/* Preview Modal */}
          <Modal open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen} title="Template Preview">
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm max-w-[280px]">
                    <p className="text-sm">{selectedTemplate.content}</p>
                    <p className="text-xs text-muted-foreground mt-2 text-right">12:00 PM ✓✓</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge className={statusStyles[selectedTemplate.status]}>{selectedTemplate.status}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p>{selectedTemplate.category}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Type</p>
                    <p className="capitalize">{selectedTemplate.type}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Usage Count</p>
                    <p>{selectedTemplate.usageCount}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full" onClick={() => setIsPreviewModalOpen(false)}>Close</Button>
              </div>
            )}
          </Modal>

          {/* Edit Modal */}
          <Modal open={isEditModalOpen} onOpenChange={setIsEditModalOpen} title="Edit Template">
            {selectedTemplate && (
              <div className="space-y-4">
                <div>
                  <Label>Template Name</Label>
                  <Input
                    value={selectedTemplate.name}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Message Content</Label>
                  <Textarea
                    value={selectedTemplate.content}
                    onChange={(e) => setSelectedTemplate({ ...selectedTemplate, content: e.target.value })}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                  <Button onClick={handleEdit}>Save & Resubmit</Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Modal */}
          <Modal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} title="Delete Template">
            <div className="space-y-4">
              <p>Are you sure you want to delete <strong>{selectedTemplate?.name}</strong>?</p>
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
