import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { qualityApi, materialApi, securityApi } from '@/services/modules';

export const inspectionsConfig = {
  api: qualityApi.inspections,
  selectOptions: {
    productId: materialApi.materials.list,
    inspectedById: securityApi.users.list,
  },
  tableName: 'inspections',
  moduleName: 'Quality Inspection',
  pluralName: 'QA Inspections',
  zodSchema: z.object({
    inspectionNo: z.string().min(2, 'Enter inspection reference'),
    inspectionType: z.string().default('INCOMING'),
    productId: z.string().min(1, 'Select product to inspect'),
    quantity: z.coerce.number().positive(),
    inspectedQty: z.coerce.number().nonnegative(),
    acceptedQty: z.coerce.number().nonnegative(),
    rejectedQty: z.coerce.number().nonnegative(),
    status: z.string().default('PENDING'),
    inspectedById: z.string().min(1, 'Select inspector'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    inspectionNo: '',
    inspectionType: 'INCOMING',
    productId: '',
    quantity: '0',
    inspectedQty: '0',
    acceptedQty: '0',
    rejectedQty: '0',
    status: 'PENDING',
    inspectedById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Quality Control' },
  ],
  columns: [
    { accessorKey: 'inspectionNo', header: sortableHeader('Inspection Sheet No') },
    { accessorKey: 'inspectionType', header: 'Type' },
    {
      accessorKey: 'productId',
      header: 'Part / Product Name',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.product?.name || 'Loading...';
      },
    },
    { accessorKey: 'acceptedQty', header: 'Passed' },
    { accessorKey: 'rejectedQty', header: 'Failed' },
    { accessorKey: 'status', header: 'Review Status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'inspectionNo', label: 'Inspection Identifier No', type: 'text', placeholder: 'QA-2026-0001', required: true },
    { name: 'productId', label: 'Material Part / Finished Good model', type: 'select', options: [], required: true },
    { name: 'inspectedById', label: 'Assigned QA Inspector', type: 'select', options: [], required: true },
    { name: 'quantity', label: 'Total Lot Size', type: 'number', placeholder: '100', required: true },
    { name: 'inspectedQty', label: 'Inspected Lot Size Count', type: 'number', placeholder: '100', required: true },
    { name: 'acceptedQty', label: 'Accepted Count (Conforming)', type: 'number', placeholder: '100', required: true },
    { name: 'rejectedQty', label: 'Rejected Count (Defective)', type: 'number', placeholder: '0', required: true },
    {
      name: 'inspectionType',
      label: 'QA Segment',
      type: 'select',
      options: [
        { label: 'Incoming Material inspection', value: 'INCOMING' },
        { label: 'In-Process Line verification', value: 'PRODUCTION' },
        { label: 'Final Quality Release', value: 'FINAL' },
      ],
    },
    {
      name: 'status',
      label: 'QA Decision Status',
      type: 'select',
      options: [
        { label: 'Pending Assessment', value: 'PENDING' },
        { label: 'Assessment In Progress', value: 'IN_PROGRESS' },
        { label: 'Assessment Completed', value: 'COMPLETED' },
        { label: 'Lot Approved & Released', value: 'APPROVED' },
        { label: 'Lot Rejected / Red-Tagged', value: 'REJECTED' },
      ],
    },
    { name: 'remarks', label: 'Defect Analysis / NCR Comments', type: 'textarea' },
  ] as any[],
};
