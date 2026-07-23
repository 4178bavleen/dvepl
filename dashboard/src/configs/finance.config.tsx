import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { financeApi, salesOrderApi, crmApi, securityApi } from '@/services/modules';

// ==========================================
// 1. CUSTOMER INVOICES ROUTE CONFIG
// ==========================================
export const invoicesConfig = {
  api: financeApi.invoices,
  selectOptions: {
    salesOrderId: salesOrderApi.salesOrders.list,
    customerId: crmApi.customers.list,
    createdById: securityApi.users.list,
  },
  tableName: 'invoices',
  moduleName: 'Customer Invoice',
  pluralName: 'Sales Invoices',
  zodSchema: z.object({
    invoiceNo: z.string().min(2, 'Enter invoice number'),
    invoiceType: z.string().default('SALES'),
    salesOrderId: z.string().optional().nullable(),
    customerId: z.string().min(1, 'Select customer'),
    invoiceDate: z.string().or(z.date()).default(() => new Date()),
    dueDate: z.string().or(z.date()).optional().nullable(),
    subtotal: z.coerce.number().nonnegative(),
    tax: z.coerce.number().nonnegative(),
    discount: z.coerce.number().nonnegative().default(0),
    total: z.coerce.number().nonnegative(),
    outstanding: z.coerce.number().nonnegative(),
    status: z.string().default('DRAFT'),
    createdById: z.string().min(1, 'Creator account required'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    invoiceNo: '',
    invoiceType: 'SALES',
    salesOrderId: '',
    customerId: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    subtotal: '0',
    tax: '0',
    discount: '0',
    total: '0',
    outstanding: '0',
    status: 'DRAFT',
    createdById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Receivables Invoices' },
  ],
  columns: [
    { accessorKey: 'invoiceNo', header: sortableHeader('Invoice No') },
    {
      accessorKey: 'customerId',
      header: 'Customer',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.customer?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'total',
      header: 'Invoice Total',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'outstanding',
      header: 'Balance Due',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    { accessorKey: 'status', header: 'Payment Status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'invoiceNo', label: 'Invoice Reference No', type: 'text', placeholder: 'INV-2026-0001', required: true },
    { name: 'customerId', label: 'Client / Debtor', type: 'select', options: [], required: true },
    { name: 'salesOrderId', label: 'Linked Sales Contract', type: 'select', options: [] },
    { name: 'createdById', label: 'Billed By Employee', type: 'select', options: [], required: true },
    { name: 'invoiceDate', label: 'Invoice Placement Date', type: 'date', required: true },
    { name: 'dueDate', label: 'Maturity / Payment Due', type: 'date' },
    { name: 'subtotal', label: 'Goods Valuation Subtotal (INR)', type: 'number', placeholder: '10000', required: true },
    { name: 'tax', label: 'Output GST (INR)', type: 'number', placeholder: '1800', required: true },
    { name: 'discount', label: 'Billed Discount (INR)', type: 'number', placeholder: '0', required: true },
    { name: 'total', label: 'Invoice Total Cost (INR)', type: 'number', placeholder: '11800', required: true },
    { name: 'outstanding', label: 'Outstanding Balance (INR)', type: 'number', placeholder: '11800', required: true },
    {
      name: 'status',
      label: 'Invoice Stage',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Approved Receivables', value: 'APPROVED' },
        { label: 'Sent to Customer', value: 'SENT' },
        { label: 'Paid in Part', value: 'PARTIAL_PAID' },
        { label: 'Fully Paid & Cleared', value: 'PAID' },
        { label: 'Overdue Balance', value: 'OVERDUE' },
        { label: 'Cancelled Invoice', value: 'CANCELLED' },
      ],
    },
    { name: 'remarks', label: 'Audit remarks', type: 'textarea' },
  ] as any[],
};

// ==========================================
// 2. RECEIVED PAYMENTS ROUTE CONFIG
// ==========================================
export const paymentsConfig = {
  api: financeApi.payments,
  selectOptions: {
    invoiceId: financeApi.invoices.list,
    receivedById: securityApi.users.list,
  },
  tableName: 'payments',
  moduleName: 'Receipt Payment',
  pluralName: 'Payments Ledger',
  zodSchema: z.object({
    paymentNo: z.string().min(2, 'Enter payment number'),
    invoiceId: z.string().min(1, 'Select invoice'),
    amount: z.coerce.number().positive(),
    paymentDate: z.string().or(z.date()).default(() => new Date()),
    paymentMethod: z.string().default('CASH'),
    referenceNo: z.string().optional().nullable(),
    receivedById: z.string().min(1, 'Select receiver account'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    paymentNo: '',
    invoiceId: '',
    amount: '1000',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    referenceNo: '',
    receivedById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Receipt Voucher Ledger' },
  ],
  columns: [
    { accessorKey: 'paymentNo', header: sortableHeader('Receipt No') },
    {
      accessorKey: 'invoiceId',
      header: 'Target Invoice No',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.invoice?.invoiceNo || 'Loading...';
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount Paid',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    { accessorKey: 'paymentMethod', header: 'Method' },
    { accessorKey: 'paymentDate', header: 'Receipt Date' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'paymentNo', label: 'Payment Receipt No', type: 'text', placeholder: 'RCPT-2026-0001', required: true },
    { name: 'invoiceId', label: 'Settled Sales Invoice', type: 'select', options: [], required: true },
    { name: 'amount', label: 'Amount Received (INR)', type: 'number', placeholder: '10000', required: true },
    { name: 'receivedById', label: 'Received & Handled By', type: 'select', options: [], required: true },
    { name: 'paymentDate', label: 'Transaction Settlement Date', type: 'date', required: true },
    {
      name: 'paymentMethod',
      label: 'Settlement Mode',
      type: 'select',
      options: [
        { label: 'Liquid Cash', value: 'CASH' },
        { label: 'Direct Bank Transfer', value: 'BANK_TRANSFER' },
        { label: 'Paper Cheque', value: 'CHEQUE' },
        { label: 'Demand Draft (DD)', value: 'DD' },
        { label: 'Corporate UPI / Scan', value: 'UPI' },
        { label: 'NEFT Transfer', value: 'NEFT' },
        { label: 'RTGS Settlement', value: 'RTGS' },
        { label: 'IMPS Realtime', value: 'IMPS' },
      ],
    },
    { name: 'referenceNo', label: 'Bank Txn Ref / UTR / Cheque No', type: 'text', placeholder: 'UTR1092830198' },
    { name: 'remarks', label: 'Deposit notes', type: 'textarea' },
  ] as any[],
};

// ==========================================
// 3. OFFICE EXPENSES ROUTE CONFIG
// ==========================================
export const expensesConfig = {
  api: financeApi.expenses,
  selectOptions: {
    createdById: securityApi.users.list,
  },
  tableName: 'expenses',
  moduleName: 'Operating Expense',
  pluralName: 'Out-Of-Pocket Expenses',
  zodSchema: z.object({
    expenseNo: z.string().min(2, 'Enter expense reference'),
    category: z.string().min(2, 'Enter category name'),
    amount: z.coerce.number().positive(),
    expenseDate: z.string().or(z.date()).default(() => new Date()),
    description: z.string().min(3, 'Specify details of expenditure'),
    createdById: z.string().min(1, 'Creator account required'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    expenseNo: '',
    category: '',
    amount: '100',
    expenseDate: new Date().toISOString().split('T')[0],
    description: '',
    createdById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Expenses Book' },
  ],
  columns: [
    { accessorKey: 'expenseNo', header: sortableHeader('Expense No') },
    { accessorKey: 'category', header: sortableHeader('Category') },
    {
      accessorKey: 'amount',
      header: 'Spent Value',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    { accessorKey: 'expenseDate', header: 'Expense Date' },
    { accessorKey: 'description', header: 'Purpose Detail' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'expenseNo', label: 'Voucher Number Reference', type: 'text', placeholder: 'EXP-2026-0001', required: true },
    { name: 'category', label: 'Expense Account / Heading', type: 'text', placeholder: 'Travel / Consumables / Machinery maintenance', required: true },
    { name: 'amount', label: 'Net Amount Paid (INR)', type: 'number', placeholder: '1000', required: true },
    { name: 'createdById', label: 'Prepared By Employee', type: 'select', options: [], required: true },
    { name: 'expenseDate', label: 'Payment Settlement Date', type: 'date', required: true },
    { name: 'description', label: 'Description / Line Item Purpose', type: 'text', placeholder: 'Diesel for generator backup run', required: true },
    { name: 'remarks', label: 'Approval notes', type: 'textarea' },
  ] as any[],
};
