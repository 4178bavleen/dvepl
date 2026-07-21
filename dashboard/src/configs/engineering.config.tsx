import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { engineeringApi, salesOrderApi } from '@/services/modules';

// ==========================================
// 1. ENGINEERING PROJECTS ROUTE CONFIG
// ==========================================
export const engineeringProjectsConfig = {
  api: engineeringApi.projects,
  selectOptions: {
    salesOrderId: salesOrderApi.salesOrders.list,
  },
  tableName: 'engineeringProjects',
  moduleName: 'Engineering Project',
  pluralName: 'Engineering Projects',
  zodSchema: z.object({
    salesOrderId: z.string().min(1, 'Select linked sales order'),
    name: z.string().min(2, 'Enter project name'),
    description: z.string().optional().nullable(),
    status: z.string().default('IN_DESIGN'),
  }),
  defaultFormValues: {
    salesOrderId: '',
    name: '',
    description: '',
    status: 'IN_DESIGN',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Engineering Projects' },
  ],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Project Name') },
    {
      accessorKey: 'salesOrderId',
      header: 'Sales Order Ref',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.salesOrder?.orderNo || 'Loading...';
      },
    },
    { accessorKey: 'status', header: 'Design Status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'salesOrderId', label: 'Linked Sales Order Contract', type: 'select', options: [], required: true },
    { name: 'name', label: 'Engineering Project Name', type: 'text', placeholder: 'P-500 Pump Assembly Design', required: true },
    { name: 'description', label: 'Scope / Spec Notes', type: 'textarea', placeholder: 'Specify design bounds...' },
    {
      name: 'status',
      label: 'Project Status',
      type: 'select',
      options: [
        { label: 'Draft Design', value: 'DRAFT' },
        { label: 'In Design Phase', value: 'IN_DESIGN' },
        { label: 'Client Approved', value: 'APPROVED' },
        { label: 'Design Completed', value: 'COMPLETED' },
        { label: 'On Hold / Suspended', value: 'SUSPENDED' },
      ],
    },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Design Projects', value: data.length },
    { label: 'In Active Design', value: data.filter((p) => p.status === 'IN_DESIGN').length },
  ],
};

// ==========================================
// 2. ENGINEERING DRAWINGS ROUTE CONFIG
// ==========================================
export const engineeringDrawingsConfig = {
  api: engineeringApi.drawings,
  selectOptions: {
    projectId: engineeringApi.projects.list,
  },
  tableName: 'engineeringDrawings',
  moduleName: 'Engineering Drawing',
  pluralName: 'Engineering Drawings',
  zodSchema: z.object({
    projectId: z.string().min(1, 'Select engineering project'),
    drawingNo: z.string().min(2, 'Enter drawing number reference'),
    title: z.string().min(2, 'Enter drawing title'),
    revision: z.coerce.number().int().nonnegative().default(1),
    status: z.string().default('DRAFT'),
  }),
  defaultFormValues: {
    projectId: '',
    drawingNo: '',
    title: '',
    revision: '1',
    status: 'DRAFT',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Design Drawings' },
  ],
  columns: [
    { accessorKey: 'drawingNo', header: sortableHeader('Drawing No') },
    { accessorKey: 'title', header: sortableHeader('Drawing Title') },
    { accessorKey: 'revision', header: 'Rev No' },
    { accessorKey: 'status', header: 'Approval status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'projectId', label: 'Linked Design Project', type: 'select', options: [], required: true },
    { name: 'drawingNo', label: 'Drawing Reference No', type: 'text', placeholder: 'DWG-ME-500-001', required: true },
    { name: 'title', label: 'Drawing Title', type: 'text', placeholder: 'Main Assembly Layout', required: true },
    { name: 'revision', label: 'Revision Sequence', type: 'number', placeholder: '1', required: true },
    {
      name: 'status',
      label: 'Drawing Stage',
      type: 'select',
      options: [
        { label: 'Draft Layout', value: 'DRAFT' },
        { label: 'Under Review', value: 'UNDER_REVIEW' },
        { label: 'Approved Drawing', value: 'APPROVED' },
        { label: 'Rejected / Redline', value: 'REJECTED' },
      ],
    },
  ] as any[],
};

// ==========================================
// 3. BOM (BILL OF MATERIALS) ROUTE CONFIG
// ==========================================
export const bomsConfig = {
  api: engineeringApi.boms,
  selectOptions: {
    projectId: engineeringApi.projects.list,
  },
  tableName: 'boms',
  moduleName: 'Bill of Materials (BOM)',
  pluralName: 'BOMs Master',
  zodSchema: z.object({
    projectId: z.string().min(1, 'Select engineering project'),
    bomNo: z.string().min(2, 'Enter BOM sequence reference'),
    description: z.string().optional().nullable(),
    status: z.string().default('DRAFT'),
  }),
  defaultFormValues: {
    projectId: '',
    bomNo: '',
    description: '',
    status: 'DRAFT',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'BOM Master Engine' },
  ],
  columns: [
    { accessorKey: 'bomNo', header: sortableHeader('BOM Master Ref') },
    { accessorKey: 'description', header: 'Product Specification' },
    { accessorKey: 'status', header: 'Workflow State' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'projectId', label: 'Design Project Link', type: 'select', options: [], required: true },
    { name: 'bomNo', label: 'BOM Reference Identifier', type: 'text', placeholder: 'BOM-500-REV1', required: true },
    { name: 'description', label: 'Specification Comments', type: 'textarea', placeholder: 'O-ring and impeller spec requirements...' },
    {
      name: 'status',
      label: 'BOM Stage',
      type: 'select',
      options: [
        { label: 'Draft', value: 'DRAFT' },
        { label: 'Under Technical Review', value: 'UNDER_REVIEW' },
        { label: 'Approved for Production', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
      ],
    },
  ] as any[],
};
