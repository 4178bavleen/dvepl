import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import {
  Plus, Search, Calendar, Info, Loader2, ShoppingCart, DollarSign,
  Clock, CheckCircle2, Trash2, Edit, Eye, Upload, Download, RefreshCw, X, Users, MessageSquare, Mail, SlidersHorizontal, Check
} from 'lucide-react';
import { GenericTable, sortableHeader } from '@/components/tables/GenericTable';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useERPStore } from '@/store/erpStore';
import { toast } from 'react-hot-toast';
import { crmApi, salesOrderApi, hrmsApi } from '@/services/modules';
import { SalesOrder } from '@/types/erp';

interface LineItemRow {
  id: string;
  description: string;
  qty: number;
  rate: number;
  gstPercent: number;
  total: number;
}

const ALL_COLUMN_KEYS = [
  { id: 'companyCode', label: 'DVEPL CODE' },
  { id: 'orderTakenBy', label: 'ORDER TAKEN BY' },
  { id: 'assignedTo', label: 'ASSIGNED TO' },
  { id: 'customerName', label: 'PARTY NAME' },
  { id: 'caNo', label: 'CA NO' },
  { id: 'concernedPeople', label: 'CONCERNED PERSONS' },
  { id: 'contact', label: 'CONTACT' },
  { id: 'orderTakenDate', label: 'CONFIRM DATE' },
  { id: 'deliveryTarget', label: 'DELIVERY TARGET' },
  { id: 'poDate', label: 'PO DATE' },
  { id: 'drawingConcernedPerson', label: 'DRAWING PERSON' },
  { id: 'drawingApprovedDate', label: 'DRAWING DATE' },
  { id: 'drawingStatus', label: 'DRAWING STATUS' },
  { id: 'drawingRemarks', label: 'DRAWING REMARKS' },
  { id: 'itemCount', label: 'ITEMS' },
  { id: 'total', label: 'TOTAL AMT (₹)' },
  { id: 'status', label: 'STATUS' },
  { id: 'inspectionField', label: 'INSPECTION FIELD' },
] as const;

type ColumnKey = (typeof ALL_COLUMN_KEYS)[number]['id'];

const orderSchema = z.object({
  companyCode: z.string().optional(),
  customerName: z.string().min(1, 'Party Name is required'),
  caNo: z.string().optional(),
  contact: z.string().optional(),
  orderTakenDate: z.string().optional(),
  deliveryTarget: z.string().optional(),
  poDate: z.string().optional(),
  orderTakenById: z.string().optional(),
  drawingConcernedPerson: z.string().optional(),
  drawingApprovedDate: z.string().optional(),
  drawingStatus: z.string().optional(),
  drawingRemarks: z.string().optional(),
  inspectionField: z.string().optional(),
  status: z.string().default('pending'),
});

const EMPTY_ARRAY: SalesOrder[] = [];

export function OrdersPage() {
  const localOrders = useERPStore((state) => ((state as any).salesOrders as SalesOrder[]) ?? EMPTY_ARRAY);
  const addRecord = useERPStore((state) => state.addRecord);
  const updateRecord = useERPStore((state) => state.updateRecord);
  const deleteRecord = useERPStore((state) => state.deleteRecord);

  // Column Visibility State - Defaulting all to visible
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ALL_COLUMN_KEYS.forEach((col) => {
      initial[col.id] = true;
    });
    return initial;
  });  // States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterUser, setFilterUser] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('date-newest');

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(Boolean(salesOrderApi.salesOrders));
  const [remoteOrders, setRemoteOrders] = useState<SalesOrder[]>([]);

  // Form Fields
  const [formValues, setFormValues] = useState<Record<string, any>>({
    companyCode: '',
    customerName: '',
    caNo: '',
    contact: '',
    orderTakenDate: '',
    deliveryTarget: '',
    poDate: '',
    orderTakenById: '',
    drawingConcernedPerson: '',
    drawingApprovedDate: '',
    drawingStatus: '',
    drawingRemarks: '',
    inspectionField: '',
    status: 'pending',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [concernedPeople, setConcernedPeople] = useState<string[]>([]);
  const [cpInput, setCpInput] = useState('');
  const [sendWaNotif, setSendWaNotif] = useState(false);
  const [sendEmailNotif, setSendEmailNotif] = useState(false);

  // Line Items State
  const [lineItems, setLineItems] = useState<LineItemRow[]>([
    { id: '1', description: '', qty: 1, rate: 0, gstPercent: 18, total: 0 }
  ]);

  // Options Data
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);

  const api = salesOrderApi.salesOrders;
  const orders = api ? remoteOrders : localOrders;

  // Load backend orders
  const loadOrders = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      const data = await api.list();
      setRemoteOrders(data);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? 'Unable to load orders.');
    } finally {
      setIsLoading(false);
    }
  }, [api]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  // Load Users/Employees
  useEffect(() => {
    hrmsApi.employees.list()
      .then((items: any[]) => setUsers(items.map((i) => ({ id: i.id, name: `${i.firstName ?? ''} ${i.lastName ?? ''}`.trim() || i.name }))))
      .catch(() => {});
  }, []);
  // Column Picker helper
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllColumns = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_COLUMN_KEYS.forEach((col) => {
      updated[col.id] = val;
    });
    setVisibleColumns(updated);
  };
  // Line Item Calculations
  const updateLineItem = (id: string, field: keyof LineItemRow, val: any) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };
        const qty = Number(updated.qty || 0);
        const rate = Number(updated.rate || 0);
        const gst = Number(updated.gstPercent || 0);
        const sub = qty * rate;
        updated.total = sub + (sub * (gst / 100));
        return updated;
      })
    );
  };

  const addLineItemRow = () => {
    setLineItems((prev) => [
      ...prev,
      { id: Date.now().toString(), description: '', qty: 1, rate: 0, gstPercent: 18, total: 0 }
    ]);
  };

  const deleteLineItemRow = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let gstTotal = 0;
    lineItems.forEach((item) => {
      const sub = Number(item.qty || 0) * Number(item.rate || 0);
      const gst = sub * (Number(item.gstPercent || 0) / 100);
      subtotal += sub;
      gstTotal += gst;
    });
    return { subtotal, gstTotal, grandTotal: subtotal + gstTotal };
  }, [lineItems]);

  // Concerned Persons Handlers
  const handleAddCP = () => {
    if (!cpInput.trim()) return;
    setConcernedPeople((prev) => [...prev, cpInput.trim()]);
    setCpInput('');
  };

  const handleRemoveCP = (index: number) => {
    setConcernedPeople((prev) => prev.filter((_, i) => i !== index));
  };

  // Filtered and Sorted Orders
  const processedOrders = useMemo(() => {
    let list = [...orders];

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((item: any) =>
        (item.companyCode ?? item.orderNo ?? '').toLowerCase().includes(q) ||
        (item.customerName ?? item.customer?.name ?? '').toLowerCase().includes(q) ||
        (item.caNo ?? '').toLowerCase().includes(q) ||
        (item.contact ?? '').toLowerCase().includes(q) ||
        (item.deliveryTarget ?? '').toLowerCase().includes(q) ||
        (item.drawingConcernedPerson ?? '').toLowerCase().includes(q) ||
        (item.drawingStatus ?? '').toLowerCase().includes(q) ||
        (item.drawingRemarks ?? '').toLowerCase().includes(q) ||
        (item.inspectionField ?? '').toLowerCase().includes(q) ||
        (item.status ?? '').toLowerCase().includes(q) ||
        (Array.isArray(item.concernedPeople) && item.concernedPeople.some((cp: string) => cp.toLowerCase().includes(q))) ||
        (Array.isArray(item.lineItems) && item.lineItems.some((li: any) => (li.description || '').toLowerCase().includes(q)))
      );
    }

    if (filterStatus) {
      list = list.filter((item: any) => (item.status || 'pending').toLowerCase() === filterStatus.toLowerCase());
    }

    if (filterUser) {
      list = list.filter((item: any) => item.orderTakenById === filterUser || (Array.isArray(item.assignedUserIds) && item.assignedUserIds.includes(filterUser)));
    }

    if (sortBy === 'date-newest') {
      list.sort((a: any, b: any) => new Date(b.createdAt || b.orderTakenDate || 0).getTime() - new Date(a.createdAt || a.orderTakenDate || 0).getTime());
    } else if (sortBy === 'date-oldest') {
      list.sort((a: any, b: any) => new Date(a.createdAt || a.orderTakenDate || 0).getTime() - new Date(b.createdAt || b.orderTakenDate || 0).getTime());
    } else if (sortBy === 'customer-asc') {
      list.sort((a: any, b: any) => String(a.customerName || '').localeCompare(String(b.customerName || '')));
    }

    return list;
  }, [orders, search, filterStatus, filterUser, sortBy]);

  // Stats
  const revenueTotal = useMemo(
    () => orders.reduce((sum, item: any) => sum + Number(item.total || item.totalAmount || 0), 0),
    [orders]
  );
  const pendingCount = useMemo(
    () => orders.filter((o: any) => (o.status || 'pending').toLowerCase() === 'pending').length,
    [orders]
  );
  const inProgressCount = useMemo(
    () => orders.filter((o: any) => (o.status || '').toLowerCase() === 'in-progress').length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o: any) => (o.status || '').toLowerCase() === 'completed').length,
    [orders]
  );

  // Form submit
  const openCreate = () => {
    setEditingOrder(null);
    setFormValues({
      companyCode: `DVEPL-${Math.floor(100 + Math.random() * 900)}`,
      customerName: '',
      caNo: '',
      contact: '',
      orderTakenDate: new Date().toISOString().split('T')[0],
      deliveryTarget: '',
      poDate: '',
      orderTakenById: '',
      drawingConcernedPerson: '',
      drawingApprovedDate: '',
      drawingStatus: 'Pending',
      drawingRemarks: '',
      inspectionField: '',
      status: 'pending',
    });
    setAssignedUserIds([]);
    setConcernedPeople([]);
    setLineItems([{ id: '1', description: '', qty: 1, rate: 0, gstPercent: 18, total: 0 }]);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (order: SalesOrder) => {
    const o = order as any;
    setEditingOrder(order);
    setFormValues({
      companyCode: o.companyCode || o.orderNo || '',
      customerName: o.customerName || o.customer?.name || '',
      caNo: o.caNo || '',
      contact: o.contact || '',
      orderTakenDate: o.orderTakenDate ? new Date(o.orderTakenDate).toISOString().split('T')[0] : '',
      deliveryTarget: o.deliveryTarget || '',
      poDate: o.poDate ? new Date(o.poDate).toISOString().split('T')[0] : '',
      orderTakenById: o.orderTakenById || '',
      drawingConcernedPerson: o.drawingConcernedPerson || '',
      drawingApprovedDate: o.drawingApprovedDate ? new Date(o.drawingApprovedDate).toISOString().split('T')[0] : '',
      drawingStatus: o.drawingStatus || 'Pending',
      drawingRemarks: o.drawingRemarks || '',
      inspectionField: o.inspectionField || '',
      status: o.status || 'pending',
    });
    setAssignedUserIds(o.assignedUserIds || []);
    setConcernedPeople(o.concernedPeople || []);
    if (Array.isArray(o.lineItems) && o.lineItems.length > 0) {
      setLineItems(o.lineItems);
    } else {
      setLineItems([{ id: '1', description: 'Default Item', qty: 1, rate: Number(o.total || 0), gstPercent: 18, total: Number(o.total || 0) }]);
    }
    setErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = orderSchema.safeParse(formValues);
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        errs[String(issue.path[0])] = issue.message;
      });
      setErrors(errs);
      return;
    }

    const payload = {
      ...result.data,
      orderNo: result.data.companyCode,
      total: totals.grandTotal,
      assignedUserIds,
      concernedPeople,
      lineItems,
      notifications: { whatsapp: sendWaNotif, email: sendEmailNotif }
    };

    setIsSubmitting(true);
    try {
      if (api) {
        if (editingOrder && api.update) await api.update(editingOrder.id, payload);
        else await api.create(payload);
        await loadOrders();
      } else if (editingOrder) {
        updateRecord('salesOrders', editingOrder.id, payload);
      } else {
        addRecord('salesOrders', payload);
      }
      setIsFormOpen(false);
      toast.success(`Order ${editingOrder ? 'updated' : 'created'} successfully.`);
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to save order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (order: SalesOrder) => {
    if (!window.confirm('Delete this order?')) return;
    setIsLoading(true);
    try {
      if (api?.remove) {
        await api.remove(order.id);
        await loadOrders();
      } else {
        deleteRecord('salesOrders', order.id);
      }
      toast.success('Order deleted.');
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Failed to delete order.');
    } finally {
      setIsLoading(false);
    }
  };

  // Full customizable columns list for Generic Table
  const tableColumns = useMemo<ColumnDef<SalesOrder>[]>(() => {
    const allDefs: Record<string, ColumnDef<SalesOrder>> = {
      companyCode: {
        accessorKey: 'companyCode',
        header: sortableHeader('DVEPL CODE'),
        cell: ({ row }) => {
          const item = row.original as any;
          return <span className="font-semibold text-foreground">{item.companyCode || item.orderNo}</span>;
        },
      },
      orderTakenBy: {
        accessorKey: 'orderTakenById',
        header: 'ORDER TAKEN BY',
        cell: ({ row }) => {
          const item = row.original as any;
          const u = users.find((usr) => usr.id === item.orderTakenById);
          return u?.name || item.orderTakenBy || '—';
        },
      },
      assignedTo: {
        accessorKey: 'assignedUserIds',
        header: 'ASSIGNED TO',
        cell: ({ row }) => {
          const item = row.original as any;
          const ids: string[] = item.assignedUserIds || [];
          if (ids.length === 0) return '—';
          const names = ids.map((id) => users.find((u) => u.id === id)?.name || id).join(', ');
          return <span className="truncate max-w-[150px] inline-block" title={names}>{names}</span>;
        },
      },
      customerName: {
        accessorKey: 'customerName',
        header: 'PARTY NAME',
        cell: ({ row }) => {
          const item = row.original as any;
          return item.customerName || item.customer?.name || '—';
        },
      },
      caNo: {
        accessorKey: 'caNo',
        header: 'CA NO',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
      concernedPeople: {
        accessorKey: 'concernedPeople',
        header: 'CONCERNED PERSONS',
        cell: ({ getValue }) => {
          const arr = getValue() as string[];
          return Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : '—';
        },
      },
      contact: {
        accessorKey: 'contact',
        header: 'CONTACT',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
      orderTakenDate: {
        accessorKey: 'orderTakenDate',
        header: 'CONFIRM DATE',
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString('en-IN') : '—';
        },
      },
      deliveryTarget: {
        accessorKey: 'deliveryTarget',
        header: 'DELIVERY TARGET',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
      poDate: {
        accessorKey: 'poDate',
        header: 'PO DATE',
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString('en-IN') : '—';
        },
      },
      drawingConcernedPerson: {
        accessorKey: 'drawingConcernedPerson',
        header: 'DRAWING PERSON',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
      drawingApprovedDate: {
        accessorKey: 'drawingApprovedDate',
        header: 'DRAWING DATE',
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val ? new Date(val).toLocaleDateString('en-IN') : '—';
        },
      },
      drawingStatus: {
        accessorKey: 'drawingStatus',
        header: 'DRAWING STATUS',
        cell: ({ getValue }) => {
          const val = (getValue() as string) || 'Pending';
          const badge: Record<string, string> = {
            Approved: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
            Rejected: 'bg-rose-500/15 text-rose-500 border-rose-500/20',
            'In Process': 'bg-amber-500/15 text-amber-500 border-amber-500/20',
            Pending: 'bg-slate-500/15 text-slate-500 border-slate-500/20',
          };
          return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${badge[val] || ''}`}>{val}</span>;
        },
      },
      drawingRemarks: {
        accessorKey: 'drawingRemarks',
        header: 'DRAWING REMARKS',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
      itemCount: {
        accessorKey: 'lineItems',
        header: 'ITEMS',
        cell: ({ row }) => {
          const item = row.original as any;
          const items = item.lineItems || [];
          return <span className="font-semibold">{items.length || 1} item(s)</span>;
        },
      },
      total: {
        accessorKey: 'total',
        header: 'TOTAL AMT (₹)',
        cell: ({ row }) => {
          const item = row.original as any;
          const val = Number(item.total || item.totalAmount || 0);
          return <span className="font-bold text-emerald-600 dark:text-emerald-400">₹{val.toLocaleString('en-IN')}</span>;
        },
      },
      status: {
        accessorKey: 'status',
        header: 'STATUS',
        cell: ({ getValue }) => {
          const st = String(getValue() || 'pending').toLowerCase();
          const badges: Record<string, string> = {
            pending: 'bg-amber-500/15 text-amber-500 border-amber-500/20',
            'in-progress': 'bg-blue-500/15 text-blue-500 border-blue-500/20',
            completed: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
            'on-hold': 'bg-rose-500/15 text-rose-500 border-rose-500/20',
          };
          return (
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${badges[st] || 'bg-muted text-muted-foreground'}`}>
              {st}
            </span>
          );
        },
      },
      inspectionField: {
        accessorKey: 'inspectionField',
        header: 'INSPECTION FIELD',
        cell: ({ getValue }) => (getValue() as string) || '—',
      },
    };

    return ALL_COLUMN_KEYS
      .filter((col) => visibleColumns[col.id])
      .map((col) => allDefs[col.id]);
  }, [visibleColumns, users]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage client orders, multi-item line pricing, inspection notes, and assignments.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsBulkModalOpen(true)} className="gap-2">
            <Upload className="size-4" /> Bulk Upload
          </Button>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> Add Order
          </Button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">₹{revenueTotal.toLocaleString('en-IN')}</p>
          <div className="mt-2 text-xs text-muted-foreground">DVEPL Gross Value</div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-blue-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-blue-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Orders</p>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <ShoppingCart className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{orders.length}</p>
          <div className="mt-2 text-xs font-medium text-amber-500 flex items-center gap-1">
            <Clock className="size-3" /> {pendingCount} pending confirmation
          </div>
        </div>

        {/* In Progress */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-amber-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-amber-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">In Progress</p>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Clock className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{inProgressCount}</p>
          <div className="mt-2 text-xs text-muted-foreground">Active manufacturing / engineering</div>
        </div>

        {/* Completed */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completed Orders</p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{completedCount}</p>
          <div className="mt-2 text-xs text-muted-foreground">Dispatched & cleared</div>
        </div>
      </div>

      {/* Toolbar Filters & Column Customizer */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] border border-input rounded-md px-3 bg-background focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, codes, party name, item description, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Customizable Columns Dropdown */}
          <Popover>
            <PopoverTrigger render={<Button variant="outline" size="sm" className="gap-1.5 h-8" />}>
              <SlidersHorizontal className="size-3.5" /> Fields
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs">Show / Hide Columns</span>
                <div className="flex gap-2 text-[11px]">
                  <button type="button" className="text-primary hover:underline font-semibold" onClick={() => setAllColumns(true)}>All</button>
                  <button type="button" className="text-muted-foreground hover:underline font-semibold" onClick={() => setAllColumns(false)}>None</button>
                </div>
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {ALL_COLUMN_KEYS.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <Checkbox
                      checked={visibleColumns[col.id]}
                      onCheckedChange={() => toggleColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">STATUS:</span>
            <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val ?? '')}>
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="on-hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">SORT:</span>
            <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? 'date-newest')}>
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">Date Newest</SelectItem>
                <SelectItem value="date-oldest">Date Oldest</SelectItem>
                <SelectItem value="customer-asc">Customer A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="ghost" size="icon" onClick={() => void loadOrders()} title="Refresh">
            <RefreshCw className="size-4" />
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <GenericTable
        columns={tableColumns}
        data={processedOrders}
        onView={setViewingOrder}
        onEdit={openEdit}
        onDelete={handleDelete}
        isLoading={isLoading}
        showColumnVisibility={false}
      />

      {/* Add / Edit Order Modal */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="h-full w-full max-w-4xl p-0 flex flex-col gap-0 border-l shadow-2xl">
          <div className="bg-gradient-to-r from-primary/10 via-background to-transparent border-b p-6 pt-8 space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              {editingOrder ? 'Edit Order' : 'Add New Order'}
            </h2>
            <p className="text-xs text-muted-foreground">Complete assignment, line items, drawing, and inspection details.</p>
          </div>

          <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">

              {/* Assignment Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Users className="size-4" /> Assignment & Code
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">DVEPL Code *</Label>
                    <Input
                      value={formValues.companyCode}
                      onChange={(e) => setFormValues({ ...formValues, companyCode: e.target.value })}
                      placeholder="DVEPL-001"
                    />
                    {errors.companyCode && <p className="text-xs text-destructive">{errors.companyCode}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Status</Label>
                    <Select
                      value={formValues.status}
                      onValueChange={(val) => setFormValues({ ...formValues, status: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Order Taken By</Label>
                    <Select
                      value={formValues.orderTakenById}
                      onValueChange={(val) => setFormValues({ ...formValues, orderTakenById: val })}
                    >
                      <SelectTrigger><SelectValue placeholder="— Select user —" /></SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Order Information Section */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Info className="size-4" /> Order Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Party Name *</Label>
                    <Input
                      value={formValues.customerName}
                      onChange={(e) => setFormValues({ ...formValues, customerName: e.target.value })}
                      placeholder="Client Name"
                    />
                    {errors.customerName && <p className="text-xs text-destructive">{errors.customerName}</p>}
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">CA No</Label>
                    <Input
                      value={formValues.caNo}
                      onChange={(e) => setFormValues({ ...formValues, caNo: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Contact Details</Label>
                    <Input
                      value={formValues.contact}
                      onChange={(e) => setFormValues({ ...formValues, contact: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Order Confirm Date</Label>
                    <Input
                      type="date"
                      value={formValues.orderTakenDate}
                      onChange={(e) => setFormValues({ ...formValues, orderTakenDate: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Delivery Month Target</Label>
                    <Input
                      placeholder="e.g. June 2026"
                      value={formValues.deliveryTarget}
                      onChange={(e) => setFormValues({ ...formValues, deliveryTarget: e.target.value })}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">PO Date</Label>
                    <Input
                      type="date"
                      value={formValues.poDate}
                      onChange={(e) => setFormValues({ ...formValues, poDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Concerned Persons Tag Input */}
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Concerned Persons</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type name and press Add..."
                      value={cpInput}
                      onChange={(e) => setCpInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCP(); } }}
                    />
                    <Button type="button" onClick={handleAddCP} variant="secondary">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {concernedPeople.map((cp, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-muted px-2.5 py-1 rounded-md text-xs font-medium border">
                        {cp}
                        <X className="size-3 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => handleRemoveCP(idx)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawing Section */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Drawing Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Drawing Person</Label>
                    <Input
                      value={formValues.drawingConcernedPerson}
                      onChange={(e) => setFormValues({ ...formValues, drawingConcernedPerson: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Drawing Approved Date</Label>
                    <Input
                      type="date"
                      value={formValues.drawingApprovedDate}
                      onChange={(e) => setFormValues({ ...formValues, drawingApprovedDate: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Drawing Status</Label>
                    <Select
                      value={formValues.drawingStatus}
                      onValueChange={(val) => setFormValues({ ...formValues, drawingStatus: val })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Process">In Process</SelectItem>
                        <SelectItem value="Approved">Approved</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs font-semibold">Drawing Remarks</Label>
                    <Input
                      value={formValues.drawingRemarks}
                      onChange={(e) => setFormValues({ ...formValues, drawingRemarks: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Inspection Field Section */}
              <div className="space-y-3 border-t pt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Inspection & Notes</h3>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Inspection Field</Label>
                  <Textarea
                    placeholder="Enter inspection criteria, third party inspector details, or clearance notes..."
                    value={formValues.inspectionField}
                    onChange={(e) => setFormValues({ ...formValues, inspectionField: e.target.value })}
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              {/* Line Items & Pricing Section */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Line Items & Pricing</h3>
                  <Button type="button" size="sm" onClick={addLineItemRow} className="gap-1">
                    <Plus className="size-3.5" /> Add Item Row
                  </Button>
                </div>

                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted text-muted-foreground uppercase border-b">
                      <tr>
                        <th className="p-2 text-center w-10">#</th>
                        <th className="p-2 text-left">Item Description</th>
                        <th className="p-2 text-right w-20">Qty</th>
                        <th className="p-2 text-right w-28">Rate (₹)</th>
                        <th className="p-2 text-right w-20">GST %</th>
                        <th className="p-2 text-right w-32">Total (₹)</th>
                        <th className="p-2 text-center w-12">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {lineItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2 text-center font-bold text-muted-foreground">{idx + 1}</td>
                          <td className="p-1">
                            <Input
                              value={item.description}
                              onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                              placeholder="Item description"
                              className="h-8 text-xs"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => updateLineItem(item.id, 'qty', e.target.value)}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.rate}
                              onChange={(e) => updateLineItem(item.id, 'rate', e.target.value)}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="p-1">
                            <Input
                              type="number"
                              value={item.gstPercent}
                              onChange={(e) => updateLineItem(item.id, 'gstPercent', e.target.value)}
                              className="h-8 text-xs text-right"
                            />
                          </td>
                          <td className="p-2 text-right font-bold text-emerald-600">
                            ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-1 text-center">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteLineItemRow(item.id)}
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Line Item Totals Bar */}
                <div className="flex justify-end gap-6 bg-muted/40 p-3 rounded-lg border text-xs font-semibold">
                  <div>Subtotal: <span className="text-foreground">₹{totals.subtotal.toLocaleString('en-IN')}</span></div>
                  <div>GST Total: <span className="text-foreground">₹{totals.gstTotal.toLocaleString('en-IN')}</span></div>
                  <div className="text-sm font-bold text-primary">Grand Total: ₹{totals.grandTotal.toLocaleString('en-IN')}</div>
                </div>
              </div>
            </div>

            {/* Modal Footer Notifications & Actions */}
            <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-between sticky bottom-0 bg-background">
              <div className="flex items-center gap-4 text-xs font-medium">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sendWaNotif} onChange={(e) => setSendWaNotif(e.target.checked)} />
                  <MessageSquare className="size-3.5 text-emerald-500" /> WhatsApp
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={sendEmailNotif} onChange={(e) => setSendEmailNotif(e.target.checked)} />
                  <Mail className="size-3.5 text-blue-500" /> Email
                </label>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin size-4 mr-2" /> : null}
                  {editingOrder ? 'Save Order' : 'Create Order'}
                </Button>
              </div>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Bulk Upload Modal */}
      <Sheet open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <SheetContent side="right" className="max-w-md p-6">
          <SheetHeader>
            <SheetTitle>Bulk Upload Orders (.xlsx / .csv)</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <p className="text-xs text-muted-foreground">Upload an Excel or CSV file containing DVEPL code, party name, item details, qty, rate, and GST.</p>
            <Input type="file" accept=".xlsx,.xls,.csv" />
            <Button className="w-full gap-2">
              <Upload className="size-4" /> Upload & Process
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* View Details Drawer */}
      <Sheet open={Boolean(viewingOrder)} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <SheetContent side="right" className="max-w-lg p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Order Summary</SheetTitle>
          </SheetHeader>

          {viewingOrder && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-lg font-bold text-foreground">{(viewingOrder as any).companyCode || viewingOrder.orderNo}</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary uppercase">
                  {viewingOrder.status || 'pending'}
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Party & Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Party Name:</span> <p className="font-semibold text-foreground">{(viewingOrder as any).customerName || '—'}</p></div>
                  <div><span className="text-muted-foreground">CA No:</span> <p className="font-semibold text-foreground">{(viewingOrder as any).caNo || '—'}</p></div>
                  <div><span className="text-muted-foreground">Delivery Target:</span> <p className="font-semibold text-foreground">{(viewingOrder as any).deliveryTarget || '—'}</p></div>
                  <div><span className="text-muted-foreground">Contact:</span> <p className="font-semibold text-foreground">{(viewingOrder as any).contact || '—'}</p></div>
                  <div><span className="text-muted-foreground">Inspection Field:</span> <p className="font-semibold text-foreground">{(viewingOrder as any).inspectionField || '—'}</p></div>
                </div>
              </section>

              <section className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">Line Items Summary</h4>
                <div className="text-sm font-bold text-emerald-600">
                  Total Order Value: ₹{Number(viewingOrder.total || (viewingOrder as any).totalAmount || 0).toLocaleString('en-IN')}
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default OrdersPage;
