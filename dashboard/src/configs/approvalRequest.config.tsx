import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { workflowApi, securityApi } from '@/services/modules';

export const approvalRequestsConfig = {
  api: workflowApi.approvalRequests,
  selectOptions: {
    assignedToId: securityApi.users.list,
    requestedById: securityApi.users.list,
  },
  tableName: 'approvalRequests',
  moduleName: 'Approval Request',
  pluralName: 'Approval Requests',
  zodSchema: z.object({
    recordId: z.string().min(1, 'Enter Target Record ID'),
    status: z.string().default('PENDING'),
    assignedToId: z.string().optional().nullable(),
    requestedById: z.string().min(1, 'Select requester'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    recordId: '',
    status: 'PENDING',
    assignedToId: '',
    requestedById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Approval Request Inbox' },
  ],
  columns: [
    { accessorKey: 'recordId', header: sortableHeader('Record Ref ID') },
    {
      accessorKey: 'requestedById',
      header: 'Requested By',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.requestedBy?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'assignedToId',
      header: 'Assigned Approver',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.assignedTo?.name || 'Loading...';
      },
    },
    { accessorKey: 'status', header: 'Status' },
    { accessorKey: 'remarks', header: 'Remarks / Comments' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'recordId', label: 'Target Record UUID', type: 'text', placeholder: 'e.g. Quotation ID', required: true },
    { name: 'requestedById', label: 'Requester Account', type: 'select', options: [], required: true },
    { name: 'assignedToId', label: 'Sign-off Approver', type: 'select', options: [] },
    { name: 'remarks', label: 'Review Remarks / Reason', type: 'textarea', placeholder: 'Review description...' },
    {
      name: 'status',
      label: 'Stage Status',
      type: 'select',
      options: [
        { label: 'Pending Sign-off', value: 'PENDING' },
        { label: 'Approved & Signed', value: 'APPROVED' },
        { label: 'Rejected', value: 'REJECTED' },
        { label: 'Cancelled Request', value: 'CANCELLED' },
      ],
    },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Total Requests Raised', value: data.length },
    { label: 'Pending Action', value: data.filter((req) => req.status === 'PENDING').length },
  ],
};
