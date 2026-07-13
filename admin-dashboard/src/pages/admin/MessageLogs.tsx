import { useState } from 'react';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Download, RefreshCw, Eye, MessageSquare, CheckCheck, XCircle, Clock } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/hooks/use-toast';

interface MessageLog {
  id: string;
  userId: string;
  userName: string;
  recipient: string;
  type: 'text' | 'template' | 'media' | 'broadcast';
  status: 'delivered' | 'read' | 'failed' | 'pending';
  content: string;
  timestamp: string;
  cost: number;
}

const mockLogs: MessageLog[] = [
  { id: 'MSG001', userId: 'U1', userName: 'John Doe', recipient: '+1234567890', type: 'text', status: 'delivered', content: 'Hello! How can I help you today?', timestamp: '2024-01-15 14:30:25', cost: 0.05 },
  { id: 'MSG002', userId: 'U2', userName: 'Jane Smith', recipient: '+0987654321', type: 'template', status: 'read', content: 'Your order #12345 has been shipped!', timestamp: '2024-01-15 14:28:10', cost: 0.08 },
  { id: 'MSG003', userId: 'U1', userName: 'John Doe', recipient: '+1122334455', type: 'broadcast', status: 'delivered', content: 'New Year Sale! 50% off on all items.', timestamp: '2024-01-15 14:25:00', cost: 0.03 },
  { id: 'MSG004', userId: 'U3', userName: 'Mike Johnson', recipient: '+5566778899', type: 'media', status: 'failed', content: '[Image: product_catalog.jpg]', timestamp: '2024-01-15 14:20:45', cost: 0.00 },
  { id: 'MSG005', userId: 'U2', userName: 'Jane Smith', recipient: '+9988776655', type: 'text', status: 'pending', content: 'Thank you for your inquiry. We will get back to you shortly.', timestamp: '2024-01-15 14:15:30', cost: 0.05 },
  { id: 'MSG006', userId: 'U4', userName: 'Sarah Williams', recipient: '+1231231234', type: 'template', status: 'read', content: 'Appointment reminder for tomorrow at 10 AM', timestamp: '2024-01-15 14:10:00', cost: 0.08 },
  { id: 'MSG007', userId: 'U1', userName: 'John Doe', recipient: '+4564564567', type: 'text', status: 'delivered', content: 'Your support ticket has been resolved.', timestamp: '2024-01-15 14:05:15', cost: 0.05 },
  { id: 'MSG008', userId: 'U5', userName: 'Tom Brown', recipient: '+7897897890', type: 'broadcast', status: 'delivered', content: 'Weekly newsletter: Top stories this week', timestamp: '2024-01-15 14:00:00', cost: 0.03 },
];

const statusStyles = {
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  read: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
};

const statusIcons = {
  delivered: CheckCheck,
  read: CheckCheck,
  failed: XCircle,
  pending: Clock,
};

const typeStyles = {
  text: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  template: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  media: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  broadcast: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
};

export default function MessageLogs() {
  const [logs] = useState<MessageLog[]>(mockLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.recipient.includes(searchQuery) ||
      log.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    const matchesType = typeFilter === 'all' || log.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: logs.length,
    delivered: logs.filter((l) => l.status === 'delivered').length,
    read: logs.filter((l) => l.status === 'read').length,
    failed: logs.filter((l) => l.status === 'failed').length,
    totalCost: logs.reduce((acc, l) => acc + l.cost, 0),
  };

  const handleExport = () => {
    toast({ title: 'Exporting logs', description: 'Message logs are being exported to CSV.' });
  };

  const handleRefresh = () => {
    toast({ title: 'Refreshed', description: 'Message logs have been refreshed.' });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Message Logs</h1>
            <p className="text-muted-foreground">View and analyze all platform messages</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.read}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, recipient, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="template">Template</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="broadcast">Broadcast</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Message ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Content</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => {
                const StatusIcon = statusIcons[log.status];
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">{log.id}</TableCell>
                    <TableCell>{log.userName}</TableCell>
                    <TableCell className="font-mono text-sm">{log.recipient}</TableCell>
                    <TableCell>
                      <Badge className={typeStyles[log.type]}>{log.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusStyles[log.status]}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{log.content}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{log.timestamp}</TableCell>
                    <TableCell>${log.cost.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedLog(log);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Detail Modal */}
        <Modal open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} title="Message Details">
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Message ID</p>
                  <p className="font-mono">{selectedLog.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusStyles[selectedLog.status]}>{selectedLog.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sender</p>
                  <p>{selectedLog.userName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                  <p className="font-mono">{selectedLog.recipient}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <Badge className={typeStyles[selectedLog.type]}>{selectedLog.type}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cost</p>
                  <p>${selectedLog.cost.toFixed(2)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Timestamp</p>
                <p>{selectedLog.timestamp}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Content</p>
                <div className="p-3 bg-muted rounded-lg mt-1">
                  <MessageSquare className="h-4 w-4 inline mr-2" />
                  {selectedLog.content}
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
