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
import { Search, Download, Eye, DollarSign, TrendingUp, CreditCard, RefreshCw } from 'lucide-react';
import { Modal } from '@/components/shared/Modal';
import { useToast } from '@/hooks/use-toast';

interface Payment {
  id: string;
  userId: string;
  userName: string;
  email: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  method: string;
  plan: string;
  date: string;
  invoiceId: string;
}

const mockPayments: Payment[] = [
  { id: 'PAY001', userId: 'U1', userName: 'John Doe', email: 'john@example.com', amount: 199, currency: 'USD', status: 'completed', method: 'Visa •••• 4242', plan: 'Enterprise', date: '2024-01-15', invoiceId: 'INV-2024-001' },
  { id: 'PAY002', userId: 'U2', userName: 'Jane Smith', email: 'jane@company.com', amount: 79, currency: 'USD', status: 'completed', method: 'Mastercard •••• 5555', plan: 'Professional', date: '2024-01-14', invoiceId: 'INV-2024-002' },
  { id: 'PAY003', userId: 'U3', userName: 'Mike Johnson', email: 'mike@startup.io', amount: 29, currency: 'USD', status: 'pending', method: 'PayPal', plan: 'Starter', date: '2024-01-13', invoiceId: 'INV-2024-003' },
  { id: 'PAY004', userId: 'U4', userName: 'Sarah Williams', email: 'sarah@business.com', amount: 79, currency: 'USD', status: 'refunded', method: 'Visa •••• 1234', plan: 'Professional', date: '2024-01-12', invoiceId: 'INV-2024-004' },
  { id: 'PAY005', userId: 'U5', userName: 'Tom Brown', email: 'tom@agency.co', amount: 199, currency: 'USD', status: 'failed', method: 'Amex •••• 3782', plan: 'Enterprise', date: '2024-01-11', invoiceId: 'INV-2024-005' },
  { id: 'PAY006', userId: 'U6', userName: 'Emily Davis', email: 'emily@tech.io', amount: 29, currency: 'USD', status: 'completed', method: 'Visa •••• 9999', plan: 'Starter', date: '2024-01-10', invoiceId: 'INV-2024-006' },
  { id: 'PAY007', userId: 'U7', userName: 'Chris Wilson', email: 'chris@corp.com', amount: 199, currency: 'USD', status: 'completed', method: 'Mastercard •••• 8888', plan: 'Enterprise', date: '2024-01-09', invoiceId: 'INV-2024-007' },
];

const statusStyles = {
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

export default function PaymentHistory() {
  const [payments] = useState<Payment[]>(mockPayments);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { toast } = useToast();

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    totalRevenue: payments.filter((p) => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0),
    completedCount: payments.filter((p) => p.status === 'completed').length,
    pendingAmount: payments.filter((p) => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0),
    refundedAmount: payments.filter((p) => p.status === 'refunded').reduce((acc, p) => acc + p.amount, 0),
  };

  const handleExport = () => {
    toast({ title: 'Exporting payments', description: 'Payment history is being exported to CSV.' });
  };

  const handleRefund = (payment: Payment) => {
    toast({ title: 'Refund initiated', description: `Refund for ${payment.invoiceId} has been initiated.` });
  };

  const handleRetry = (payment: Payment) => {
    toast({ title: 'Payment retry', description: `Retrying payment for ${payment.invoiceId}.` });
  };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Payment History</h1>
            <p className="text-muted-foreground">View and manage all platform transactions</p>
          </div>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">${stats.pendingAmount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Refunded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">${stats.refundedAmount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user, email, or invoice..."
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
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">{payment.invoiceId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.userName}</p>
                      <p className="text-sm text-muted-foreground">{payment.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.plan}</TableCell>
                  <TableCell className="font-medium">${payment.amount}</TableCell>
                  <TableCell className="text-sm">{payment.method}</TableCell>
                  <TableCell>
                    <Badge className={statusStyles[payment.status]}>{payment.status}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setIsDetailModalOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Detail Modal */}
        <Modal open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} title="Payment Details">
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice ID</p>
                  <p className="font-mono">{selectedPayment.invoiceId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={statusStyles[selectedPayment.status]}>{selectedPayment.status}</Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p>{selectedPayment.userName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPayment.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-xl font-bold">${selectedPayment.amount} {selectedPayment.currency}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p>{selectedPayment.plan}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p>{selectedPayment.method}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p>{selectedPayment.date}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                {selectedPayment.status === 'completed' && (
                  <Button variant="outline" onClick={() => handleRefund(selectedPayment)}>
                    Initiate Refund
                  </Button>
                )}
                {selectedPayment.status === 'failed' && (
                  <Button onClick={() => handleRetry(selectedPayment)}>
                    Retry Payment
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
