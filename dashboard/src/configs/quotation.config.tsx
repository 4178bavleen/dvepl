import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { crmApi, tenderApi, hrmsApi, quotationApi } from '@/services/modules';
import { Link } from 'react-router-dom';
import { ClipboardList, UserCheck } from 'lucide-react';
import { Quotation } from '@/types/erp';

// ==========================================
// 21. QUOTATION ROUTE CONFIG
// ==========================================
export const quotationsConfig = {
  api: quotationApi.quotations,
  selectOptions: {
    customerId: crmApi.customers.list,
    tenderId: tenderApi.tenders.list,
    createdById: hrmsApi.employees.list,
    approvedById: hrmsApi.employees.list,
  },
  tableName: 'quotations',
  moduleName: 'Quotation',
  pluralName: 'Quotations',
  zodSchema: z.object({
    customerId: z.string().min(1, 'Select customer'),
    tenderId: z.string().uuid('Invalid tender ID').optional().nullable(),
    materialCost: z.coerce.number().nonnegative(),
    labourCost: z.coerce.number().nonnegative(),
    transportCost: z.coerce.number().nonnegative().default(0),
    taxes: z.coerce.number().nonnegative().default(0),
    discount: z.coerce.number().nonnegative().default(0),
    margin: z.coerce.number().nonnegative().default(0),
    validityDays: z.coerce.number().int().positive().optional().nullable(),
    paymentTerms: z.string().optional().nullable(),
    deliveryDays: z.coerce.number().int().positive().optional().nullable(),
    warrantyMonths: z.coerce.number().int().nonnegative().optional().nullable(),
    specialTerms: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    status: z.string().default('DRAFT'),
    approvalRequired: z.boolean().default(true),
  }),
  defaultFormValues: {
    customerId: '',
    tenderId: '',
    materialCost: '0',
    labourCost: '0',
    transportCost: '0',
    taxes: '0',
    discount: '0',
    margin: '0',
    validityDays: '30',
    paymentTerms: '',
    deliveryDays: '15',
    warrantyMonths: '12',
    specialTerms: '',
    notes: '',
    status: 'DRAFT',
    approvalRequired: true,
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Quotations Pipeline' },
  ],
  columns: [
    { accessorKey: 'quotationNo', header: sortableHeader('Quotation No') },
    { accessorKey: 'revisionNo', header: sortableHeader('Rev') },
    {
      accessorKey: 'customerId',
      header: 'Client Partner',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.customer?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'tenderId',
      header: 'Linked Tender',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.tender?.title || 'None';
      },
    },
    {
      accessorKey: 'totalValue',
      header: 'Total Value',
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
              val === 'DRAFT'
                ? 'bg-muted-foreground/15 text-muted-foreground'
                : val === 'PENDING_APPROVAL'
                ? 'bg-warning/15 text-warning'
                : val === 'APPROVED'
                ? 'bg-success/15 text-success'
                : val === 'SENT'
                ? 'bg-primary/15 text-primary'
                : val === 'ACCEPTED'
                ? 'bg-emerald-500/15 text-emerald-500'
                : val === 'REJECTED'
                ? 'bg-danger/15 text-danger'
                : val === 'NEGOTIATING'
                ? 'bg-yellow-500/15 text-yellow-500'
                : val === 'REVISED'
                ? 'bg-indigo-500/15 text-indigo-500'
                : 'bg-muted-foreground/15 text-muted-foreground'
            }`}
          >
            {val}
          </span>
        );
      },
    },
  ] as ColumnDef<Quotation>[],
  fields: [
    {
      name: 'customerId',
      label: 'Client Account',
      type: 'select',
      options: [],
      required: true,
    },
    {
      name: 'tenderId',
      label: 'Linked Tender Project',
      type: 'select',
      options: [],
    },
    {
      name: 'materialCost',
      label: 'Material Cost (INR)',
      type: 'number',
      placeholder: '0',
      required: true,
    },
    {
      name: 'labourCost',
      label: 'Labour Cost (INR)',
      type: 'number',
      placeholder: '0',
      required: true,
    },
    {
      name: 'transportCost',
      label: 'Transport Cost (INR)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'taxes',
      label: 'Taxes / Duties (INR)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'discount',
      label: 'Discount Given (INR)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'margin',
      label: 'Markup Margin (INR)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'validityDays',
      label: 'Validity Duration (Days)',
      type: 'number',
      placeholder: '30',
    },
    {
      name: 'paymentTerms',
      label: 'Payment Milestones / Terms',
      type: 'text',
      placeholder: 'e.g. 50% advance, balance against delivery',
    },
    {
      name: 'deliveryDays',
      label: 'Delivery Timeline (Days)',
      type: 'number',
      placeholder: '15',
    },
    {
      name: 'warrantyMonths',
      label: 'Warranty Scope (Months)',
      type: 'number',
      placeholder: '12',
    },
    {
      name: 'specialTerms',
      label: 'Special Terms (Erect / Install)',
      type: 'textarea',
      placeholder: 'Unloading or crane charges detail...',
    },
    {
      name: 'notes',
      label: 'Internal Notes',
      type: 'textarea',
      placeholder: 'Detailed busbar or panel spec comments...',
    },
    {
      name: 'approvalRequired',
      label: 'Requires Sequential Approvals',
      type: 'checkbox',
    },
    {
      name: 'status',
      label: 'Workflow Status',
      type: 'select',
      options: [
        { label: 'Draft Mode', value: 'DRAFT' },
        { label: 'Pending Management Approval', value: 'PENDING_APPROVAL' },
        { label: 'Approved & Active', value: 'APPROVED' },
        { label: 'Sent to Client Account', value: 'SENT' },
        { label: 'Accepted by Client', value: 'ACCEPTED' },
        { label: 'Rejected by Client', value: 'REJECTED' },
        { label: 'Commercial Negotiations', value: 'NEGOTIATING' },
        { label: 'Superseded / Revised', value: 'REVISED' },
      ],
    },
  ] as any[],
  statsCards: (data: Quotation[]) => [
    { label: 'Total Quotes Issued', value: data.length },
    {
      label: 'Active Valuation Pipeline',
      value: `₹${data
        .reduce((sum, item) => sum + Number(item.totalValue || 0), 0)
        .toLocaleString()}`,
    },
  ],
};
