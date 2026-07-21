import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { crmApi, quotationApi, salesOrderApi, hrmsApi } from '@/services/modules';
import { SalesOrder } from '@/types/erp';

// ==========================================
// 22. SALES ORDER ROUTE CONFIG
// ==========================================
export const salesOrdersConfig = {
  api: salesOrderApi.salesOrders,
  selectOptions: {
    customerId: crmApi.customers.list,
    quotationId: quotationApi.quotations.list,
    createdById: hrmsApi.employees.list,
  },
  tableName: 'salesOrders',
  moduleName: 'Sales Order',
  pluralName: 'Sales Orders',
  zodSchema: z.object({
    customerId: z.string().min(1, 'Select customer account'),
    quotationId: z.string().min(1, 'Select linked quotation'),
    soNumber: z.string().min(2, 'Enter Sales Order Number'),
    totalValue: z.coerce.number().nonnegative(),
    deliveryDate: z.string().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    warrantyMonths: z.coerce.number().int().nonnegative().optional().nullable(),
    specialTerms: z.string().optional().nullable(),
    status: z.string().default('ACTIVE'),
  }),
  defaultFormValues: {
    customerId: '',
    quotationId: '',
    soNumber: '',
    totalValue: '0',
    deliveryDate: '',
    paymentTerms: '',
    warrantyMonths: '12',
    specialTerms: '',
    status: 'ACTIVE',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Sales Orders Pipeline' },
  ],
  columns: [
    { accessorKey: 'soNumber', header: sortableHeader('SO Number') },
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
      accessorKey: 'totalValue',
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
              val === 'ACTIVE'
                ? 'bg-primary/15 text-primary border border-primary/20'
                : val === 'IN_PROGRESS'
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                : val === 'COMPLETED'
                ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                : val === 'ON_HOLD'
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
      name: 'soNumber',
      label: 'Client Sales Order No',
      type: 'text',
      placeholder: 'SO-2026-0001',
      required: true,
    },
    {
      name: 'totalValue',
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
      name: 'warrantyMonths',
      label: 'Locked Warranty Scope (Months)',
      type: 'number',
      placeholder: '12',
    },
    {
      name: 'specialTerms',
      label: 'Contractual Special Terms',
      type: 'textarea',
      placeholder: 'Erection/Installation criteria...',
    },
    {
      name: 'status',
      label: 'Production Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'In Production', value: 'IN_PROGRESS' },
        { label: 'Delivered / Completed', value: 'COMPLETED' },
        { label: 'On Hold', value: 'ON_HOLD' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
  ] as any[],
  statsCards: (data: SalesOrder[]) => [
    { label: 'Total Orders Booked', value: data.length },
    {
      label: 'Order Pipeline Valuation',
      value: `₹${data
        .reduce((sum, item) => sum + Number(item.totalValue || 0), 0)
        .toLocaleString()}`,
    },
  ],
};
