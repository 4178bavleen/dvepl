import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { crmApi, quotationApi, salesOrderApi, hrmsApi } from '@/services/modules';
import { SalesOrder } from '@/types/erp';

// ==========================================
// 22. SALES ORDER ROUTE CONFIG
// ==========================================
export const salesOrdersConfig = {
  api: salesOrderApi.salesOrders,
  selectOptions: {
    customerId: crmApi.customers.list,
    createdById: hrmsApi.employees.list,
  },
  tableName: 'salesOrders',
  moduleName: 'Sales Order',
  pluralName: 'Sales Orders',
  zodSchema: z.object({
    customerId: z.string().min(1, 'Select customer account'),
    quotationId: z.string().min(1, 'Select linked quotation'),
    orderNo: z.string().min(2, 'Enter Sales Order Number'),
    total: z.coerce.number().nonnegative(),
    deliveryDate: z.string().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    warranty: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
    status: z.string().default('DRAFT'),
  }),
  defaultFormValues: {
    customerId: '',
    quotationId: '',
    orderNo: '',
    total: '0',
    deliveryDate: '',
    paymentTerms: '',
    warranty: '12 Months',
    remarks: '',
    status: 'DRAFT',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Sales Orders Pipeline' },
  ],
  columns: [
    { accessorKey: 'orderNo', header: sortableHeader('Order Number') },
    {
      accessorKey: 'customerId',
      header: 'Client Partner',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.customer?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'quotationId',
      header: 'Source Quotation',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.quotation?.quotationNo || 'Loading...';
      },
    },
    {
      accessorKey: 'total',
      header: 'Order Value',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              val === 'CONFIRMED'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : val === 'IN_PRODUCTION'
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                : val === 'READY'
                ? 'bg-indigo-500/15 text-indigo-500 border border-indigo-500/20'
                : val === 'DISPATCHED'
                ? 'bg-blue-500/15 text-blue-500 border border-blue-500/20'
                : val === 'COMPLETED'
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                : val === 'DRAFT'
                ? 'bg-slate-500/15 text-slate-500 border border-slate-500/20'
                : val === 'CANCELLED'
                ? 'bg-rose-500/15 text-rose-500 border border-rose-500/20'
                : 'bg-muted-foreground/15 text-muted-foreground'
            }`}
          >
            {val}
          </span>
        );
      },
    },
  ] as ColumnDef<SalesOrder>[],
  fields: [
    {
      name: 'customerId',
      label: 'Customer Partner',
      type: 'select',
      options: [],
      required: true,
    },
    {
      name: 'quotationId',
      label: 'Source Approved Quotation',
      type: 'select',
      options: [],
      required: true,
    },
    {
      name: 'orderNo',
      label: 'Client Sales Order No',
      type: 'text',
      placeholder: 'SO-2026-0001',
      required: true,
    },
    {
      name: 'total',
      label: 'Locked Contract Value (INR)',
      type: 'number',
      placeholder: '0',
      required: true,
    },
    {
      name: 'deliveryDate',
      label: 'Promised Delivery Date',
      type: 'date',
    },
    {
      name: 'paymentTerms',
      label: 'Locked Payment Terms',
      type: 'text',
      placeholder: 'e.g. Net 30 days',
    },
    {
      name: 'warranty',
      label: 'Locked Warranty Scope',
      type: 'text',
      placeholder: '12 Months',
    },
    {
      name: 'remarks',
      label: 'Contractual Special Terms / Remarks',
      type: 'textarea',
      placeholder: 'Erection/Installation criteria...',
    },
    {
      name: 'status',
      label: 'Production Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Confirmed', value: 'CONFIRMED' },
        { label: 'In Production', value: 'IN_PRODUCTION' },
        { label: 'Ready', value: 'READY' },
        { label: 'Dispatched', value: 'DISPATCHED' },
        { label: 'Delivered / Completed', value: 'COMPLETED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ] as any[],
  statsCards: (data: SalesOrder[]) => [
    { label: 'Total Orders Booked', value: data.length },
    {
      label: 'Order Pipeline Valuation',
      value: `₹${data
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toLocaleString()}`,
    },
  ],
};
