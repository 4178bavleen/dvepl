import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { productionApi, materialApi, securityApi, salesOrderApi } from '@/services/modules';

// ==========================================
// 1. PRODUCTION PLANS ROUTE CONFIG
// ==========================================
export const productionPlansConfig = {
  api: productionApi.plans,
  selectOptions: {
    createdById: securityApi.users.list,
  },
  tableName: 'productionPlans',
  moduleName: 'Production Plan',
  pluralName: 'Production Schedules',
  zodSchema: z.object({
    planNo: z.string().min(2, 'Enter plan number'),
    name: z.string().min(2, 'Enter plan name'),
    description: z.string().optional().nullable(),
    startDate: z.string().or(z.date()).default(() => new Date()),
    endDate: z.string().or(z.date()).optional().nullable(),
    status: z.string().default('DRAFT'),
    createdById: z.string().min(1, 'Creator account required'),
  }),
  defaultFormValues: {
    planNo: '',
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    status: 'DRAFT',
    createdById: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Production Scheduling' },
  ],
  columns: [
    { accessorKey: 'planNo', header: sortableHeader('Plan Sheet No') },
    { accessorKey: 'name', header: sortableHeader('Schedule Name') },
    { accessorKey: 'status', header: 'Plan Stage' },
    { accessorKey: 'startDate', header: 'Starts At' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'planNo', label: 'Plan Reference Sheet', type: 'text', placeholder: 'PLAN-2026-Q3-01', required: true },
    { name: 'name', label: 'Plan / Campaign Name', type: 'text', placeholder: 'August Pump Batch Run', required: true },
    { name: 'createdById', label: 'Scheduled By Planner', type: 'select', options: [], required: true },
    { name: 'startDate', label: 'Production Launch Date', type: 'date', required: true },
    { name: 'endDate', label: 'Completion Target Date', type: 'date' },
    {
      name: 'status',
      label: 'Campaign Stage',
      type: 'select',
      options: [
        { label: 'Draft / Backlog', value: 'DRAFT' },
        { label: 'Approved & Released', value: 'APPROVED' },
        { label: 'In Manufacturing Run', value: 'IN_PROGRESS' },
        { label: 'Fully Completed', value: 'COMPLETED' },
        { label: 'Cancelled Schedule', value: 'CANCELLED' },
      ],
    },
    { name: 'description', label: 'Campaign Objective Notes', type: 'textarea' },
  ] as any[],
};

// ==========================================
// 2. WORK ORDERS ROUTE CONFIG
// ==========================================
export const workOrdersConfig = {
  api: productionApi.workOrders,
  selectOptions: {
    productId: materialApi.materials.list,
    assignedToId: securityApi.users.list,
    createdById: securityApi.users.list,
    productionPlanId: productionApi.plans.list,
    salesOrderId: salesOrderApi.salesOrders.list,
  },
  tableName: 'workOrders',
  moduleName: 'Work Order',
  pluralName: 'Shop Floor Work Orders',
  zodSchema: z.object({
    orderNo: z.string().min(2, 'Enter unique order number'),
    productId: z.string().min(1, 'Select product to manufacture'),
    quantity: z.coerce.number().positive(),
    startDate: z.string().or(z.date()).default(() => new Date()),
    dueDate: z.string().or(z.date()).optional().nullable(),
    status: z.string().default('DRAFT'),
    priority: z.string().default('MEDIUM'),
    assignedToId: z.string().optional().nullable(),
    createdById: z.string().min(1, 'Creator account required'),
    productionPlanId: z.string().optional().nullable(),
    salesOrderId: z.string().optional().nullable(),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    orderNo: '',
    productId: '',
    quantity: '10',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    status: 'DRAFT',
    priority: 'MEDIUM',
    assignedToId: '',
    createdById: '',
    productionPlanId: '',
    salesOrderId: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Work Orders' },
  ],
  columns: [
    { accessorKey: 'orderNo', header: sortableHeader('Work Order Ref') },
    {
      accessorKey: 'productId',
      header: 'Product to Manufacture',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.product?.name || 'Loading...';
      },
    },
    { accessorKey: 'quantity', header: 'Target Qty' },
    { accessorKey: 'priority', header: 'Priority' },
    { accessorKey: 'status', header: 'Stage Status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'orderNo', label: 'Work Order Reference ID', type: 'text', placeholder: 'WO-2026-0001', required: true },
    { name: 'productId', label: 'Target Product Model', type: 'select', options: [], required: true },
    { name: 'quantity', label: 'Manufacturing Target Quantity', type: 'number', placeholder: '10', required: true },
    { name: 'createdById', label: 'Created By Operator', type: 'select', options: [], required: true },
    { name: 'assignedToId', label: 'Floor Supervisor / Machine Operator', type: 'select', options: [] },
    { name: 'startDate', label: 'Production Commencement', type: 'date', required: true },
    { name: 'dueDate', label: 'Deadline Target', type: 'date' },
    { name: 'productionPlanId', label: 'Plan Schedule Run Link', type: 'select', options: [] },
    { name: 'salesOrderId', label: 'Sales Contract Link', type: 'select', options: [] },
    {
      name: 'priority',
      label: 'Dispatch Urgency',
      type: 'select',
      options: [
        { label: 'Low priority', value: 'LOW' },
        { label: 'Medium standard', value: 'MEDIUM' },
        { label: 'High priority', value: 'HIGH' },
        { label: 'Critical line halt', value: 'CRITICAL' },
      ],
    },
    {
      name: 'status',
      label: 'Order Stage',
      type: 'select',
      options: [
        { label: 'Draft / Queued', value: 'DRAFT' },
        { label: 'Approved Routing', value: 'APPROVED' },
        { label: 'In Assembly Phase', value: 'IN_PROGRESS' },
        { label: 'On Hold', value: 'ON_HOLD' },
        { label: 'Finished Good Complete', value: 'COMPLETED' },
        { label: 'Cancelled Order', value: 'CANCELLED' },
      ],
    },
    { name: 'remarks', label: 'Special Fabrication Instructions', type: 'textarea' },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Work Orders Released', value: data.length },
    { label: 'In Assembly Phase', value: data.filter((w) => w.status === 'IN_PROGRESS').length },
  ],
};
