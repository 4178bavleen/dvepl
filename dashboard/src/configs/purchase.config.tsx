import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { purchaseApi, securityApi, crmApi } from '@/services/modules';

// ==========================================
// 1. PURCHASE REQUESTS ROUTE CONFIG
// ==========================================
export const purchaseRequestsConfig = {
  api: purchaseApi.requests,
  selectOptions: {
    requestedById: securityApi.users.list,
  },
  tableName: 'purchaseRequests',
  moduleName: 'Purchase Request',
  pluralName: 'Purchase Requests',
  zodSchema: z.object({
    requestNo: z.string().min(2, 'Enter reference number'),
    title: z.string().min(2, 'Enter requisition title'),
    description: z.string().optional().nullable(),
    priority: z.string().default('MEDIUM'),
    status: z.string().default('DRAFT'),
    requestedById: z.string().min(1, 'Select requester'),
    requiredBy: z.string().or(z.date()).optional().nullable(),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    requestNo: '',
    title: '',
    description: '',
    priority: 'MEDIUM',
    status: 'DRAFT',
    requestedById: '',
    requiredBy: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Requisitions' },
  ],
  columns: [
    { accessorKey: 'requestNo', header: sortableHeader('Requisition No') },
    { accessorKey: 'title', header: sortableHeader('Title') },
    { accessorKey: 'priority', header: 'Priority' },
    { accessorKey: 'status', header: 'Status' },
    {
      accessorKey: 'requestedById',
      header: 'Requester',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.requestedBy?.name || 'Loading...';
      },
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'requestNo', label: 'Requisition Identifier', type: 'text', placeholder: 'PR-2026-0001', required: true },
    { name: 'title', label: 'Request Purpose', type: 'text', placeholder: 'Q3 Structural Steel Procurement', required: true },
    { name: 'requestedById', label: 'Requested By', type: 'select', options: [], required: true },
    {
      name: 'priority',
      label: 'Priority Level',
      type: 'select',
      options: [
        { label: 'Low priority', value: 'LOW' },
        { label: 'Medium default', value: 'MEDIUM' },
        { label: 'High priority', value: 'HIGH' },
        { label: 'Critical immediate', value: 'CRITICAL' },
      ],
    },
    { name: 'requiredBy', label: 'Expected By Date', type: 'date' },
    {
      name: 'status',
      label: 'Request Status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Submitted', value: 'SUBMITTED' },
        { label: 'Approved', value: 'APPROVED' },
        { label: 'Order Created', value: 'PO_CREATED' },
        { label: 'Cancelled', value: 'CANCELLED' },
      ],
    },
    { name: 'description', label: 'Specifications Details', type: 'textarea' },
    { name: 'remarks', label: 'Reviewer Comments', type: 'textarea' },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Total Requisitions', value: data.length },
    { label: 'Urgent / Critical', value: data.filter((r) => r.priority === 'CRITICAL').length },
  ],
};

// ==========================================
// 2. PURCHASE ORDERS ROUTE CONFIG
// ==========================================
export const purchaseOrdersConfig = {
  api: purchaseApi.orders,
  selectOptions: {
    vendorId: crmApi.customers.list,
    createdById: securityApi.users.list,
    requestId: purchaseApi.requests.list,
  },
  tableName: 'purchaseOrders',
  moduleName: 'Purchase Order',
  pluralName: 'Purchase Orders',
  zodSchema: z.object({
    poNo: z.string().min(2, 'Enter PO number'),
    vendorId: z.string().min(1, 'Select supplier'),
    requestId: z.string().optional().nullable(),
    orderDate: z.string().or(z.date()).default(() => new Date()),
    expectedDelivery: z.string().or(z.date()).optional().nullable(),
    status: z.string().default('DRAFT'),
    paymentTerms: z.string().optional().nullable(),
    shippingTerms: z.string().optional().nullable(),
    subtotal: z.coerce.number().nonnegative(),
    tax: z.coerce.number().nonnegative(),
    total: z.coerce.number().nonnegative(),
    createdById: z.string().min(1, 'Creator required'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    poNo: '',
    vendorId: '',
    requestId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDelivery: '',
    status: 'DRAFT',
    paymentTerms: '',
    shippingTerms: '',
    subtotal: '0',
    tax: '0',
    total: '0',
    createdById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Purchase Orders' },
  ],
  columns: [
    { accessorKey: 'poNo', header: sortableHeader('PO Number') },
    {
      accessorKey: 'vendorId',
      header: 'Supplier',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.vendor?.name || 'Loading...';
      },
    },
    { accessorKey: 'status', header: 'PO Status' },
    {
      accessorKey: 'total',
      header: 'Order Value',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'poNo', label: 'Purchase Order No', type: 'text', placeholder: 'PO-2026-0001', required: true },
    { name: 'vendorId', label: 'Supplier / Vendor', type: 'select', options: [], required: true },
    { name: 'requestId', label: 'Linked Requisition Link', type: 'select', options: [] },
    { name: 'createdById', label: 'Order Prepared By', type: 'select', options: [], required: true },
    { name: 'orderDate', label: 'PO Placement Date', type: 'date', required: true },
    { name: 'expectedDelivery', label: 'Fulfillment Target Date', type: 'date' },
    { name: 'subtotal', label: 'Subtotal Amount (INR)', type: 'number', placeholder: '10000', required: true },
    { name: 'tax', label: 'Applicable GST (INR)', type: 'number', placeholder: '1800', required: true },
    { name: 'total', label: 'Total Payable Value (INR)', type: 'number', placeholder: '11800', required: true },
    {
      name: 'status',
      label: 'Order Stage',
      type: 'select',
      options: [
        { label: 'Draft Draft', value: 'DRAFT' },
        { label: 'Approved & Signed', value: 'APPROVED' },
        { label: 'Sent to Vendor', value: 'SENT' },
        { label: 'Partially Received', value: 'PARTIAL_RECEIVED' },
        { label: 'Completed Fulfillment', value: 'COMPLETED' },
        { label: 'Cancelled Order', value: 'CANCELLED' },
      ],
    },
    { name: 'paymentTerms', label: 'Payment Terms Spec', type: 'text', placeholder: 'Net 30' },
    { name: 'shippingTerms', label: 'Shipping / Freight Terms', type: 'text', placeholder: 'FOB Origin' },
    { name: 'remarks', label: 'Fulfillment comments', type: 'textarea' },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'POs Placed', value: data.length },
    {
      label: 'Total PO Valuation',
      value: `₹${data
        .reduce((sum, item) => sum + Number(item.total || 0), 0)
        .toLocaleString()}`,
    },
  ],
};
