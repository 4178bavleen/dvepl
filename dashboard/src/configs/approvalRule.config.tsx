import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { approvalRuleApi } from '@/services/modules';
import { useERPStore } from '@/store/erpStore';
import { ApprovalRule } from '@/types/erp';

// ==========================================
// 23. APPROVAL RULES CONFIG
// ==========================================
export const approvalRulesConfig = {
  api: approvalRuleApi.approvalRules,
  selectOptions: {
    roleId: async () => {
      const state = useERPStore.getState() as any;
      return state.roles || [];
    },
  },
  tableName: 'approvalRules',
  moduleName: 'Approval Rule',
  pluralName: 'Approval Rules',
  zodSchema: z.object({
    module: z.enum(['QUOTATION', 'PURCHASE_ORDER', 'LEAVE', 'EXPENSE', 'SALES_ORDER']),
    level: z.coerce.number().int().positive('Approval level must be a positive integer'),
    roleId: z.string().min(1, 'Select a role for this approval step'),
    minValue: z.coerce.number().nonnegative().optional().nullable(),
    maxValue: z.coerce.number().nonnegative().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    module: 'QUOTATION',
    level: '1',
    roleId: '',
    minValue: '0',
    maxValue: '1000000',
    isActive: true,
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Security' },
    { label: 'Approval Engine Rules' },
  ],
  columns: [
    { accessorKey: 'module', header: sortableHeader('Module Name') },
    { accessorKey: 'level', header: sortableHeader('Tier Level') },
    {
      accessorKey: 'roleId',
      header: 'Authorised PRBAC Role',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.role?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'minValue',
      header: 'Min Bound (₹)',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'maxValue',
      header: 'Max Bound (₹)',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    {
      accessorKey: 'isActive',
      header: 'Active',
      cell: ({ getValue }) => {
        const val = getValue() as boolean;
        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              val ? 'bg-success/15 text-success' : 'bg-muted-foreground/15 text-muted-foreground'
            }`}
          >
            {val ? 'Enabled' : 'Disabled'}
          </span>
        );
      },
    },
  ] as ColumnDef<ApprovalRule>[],
  fields: [
    {
      name: 'module',
      label: 'Target Engine Module',
      type: 'select',
      options: [
        { label: 'Quotations Proposal', value: 'QUOTATION' },
        { label: 'Sales Order Contracts', value: 'SALES_ORDER' },
        { label: 'Purchase Orders', value: 'PURCHASE_ORDER' },
        { label: 'HR Leaves Workflow', value: 'LEAVE' },
        { label: 'Expense Reimbursements', value: 'EXPENSE' },
      ],
      required: true,
    },
    {
      name: 'level',
      label: 'Sequential Level (1 = First)',
      type: 'number',
      placeholder: '1',
      required: true,
    },
    {
      name: 'roleId',
      label: 'Designated Sign-off Role',
      type: 'select',
      options: [],
      required: true,
    },
    {
      name: 'minValue',
      label: 'Minimum Limit Threshold (INR)',
      type: 'number',
      placeholder: '0',
    },
    {
      name: 'maxValue',
      label: 'Maximum Limit Threshold (INR)',
      type: 'number',
      placeholder: '1000000',
    },
    {
      name: 'isActive',
      label: 'Enabled / Active',
      type: 'checkbox',
    },
  ] as any[],
  statsCards: (data: ApprovalRule[]) => [
    { label: 'Total Approval Paths', value: data.length },
    {
      label: 'Active Quotation Tiers',
      value: data.filter((r) => r.module === 'QUOTATION' && r.isActive).length,
    },
  ],
};
