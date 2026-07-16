import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { User } from '@/types/erp';

// ==========================================
// 23. USERS ROUTE CONFIG
// ==========================================
export const usersConfig = {
  tableName: 'users',
  moduleName: 'User File',
  pluralName: 'Security Users',
  zodSchema: z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
  }),
  defaultFormValues: { name: '', email: '', phone: '', isActive: true },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Access Directory' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('User Full Name') },
    { accessorKey: 'email', header: sortableHeader('Authorized Email') },
    { accessorKey: 'phone', header: 'Phone Line' },
    { 
      accessorKey: 'isActive', 
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getValue() ? 'bg-success/15 text-success' : 'bg-muted-foreground/15 text-muted-foreground'}`}>
          {getValue() ? 'Authorized' : 'Suspended'}
        </span>
      )
    }
  ] as ColumnDef<User>[],
  fields: [
    { name: 'name', label: 'Authorized Full Name', type: 'text', placeholder: 'Enter user full name', required: true },
    { name: 'email', label: 'Authorized Email', type: 'text', placeholder: 'user@company.com', required: true },
    { name: 'phone', label: 'Phone Line', type: 'text', placeholder: '+91 99999 88888' },
    { name: 'isActive', label: 'Authorized Active Account', type: 'checkbox' }
  ] as any[],
  statsCards: (data: User[]) => [
    { label: 'Security Profiles', value: data.length },
    { label: 'Active Sessions', value: 1 }
  ]
};

// ==========================================
// 24. ROLES CONFIG
// ==========================================
export const rolesConfig = {
  tableName: 'roles',
  moduleName: 'Role',
  pluralName: 'PRBAC Roles',
  zodSchema: z.object({
    name: z.string().min(2, 'Role name is required'),
    description: z.string().optional().nullable(),
    isSystem: z.boolean().default(false)
  }),
  defaultFormValues: { name: '', description: '', isSystem: false },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Security Roles' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Role Name') },
    { accessorKey: 'description', header: 'Description' },
    { 
      accessorKey: 'isSystem', 
      header: 'System Lock',
      cell: ({ getValue }) => getValue() ? 'Core System' : 'Custom'
    }
  ] as ColumnDef<any>[],
  fields: [
    { name: 'name', label: 'Role Title', type: 'text', placeholder: 'Sales Manager', required: true },
    { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Authorized parameters' },
    { name: 'isSystem', label: 'System Protected Role', type: 'checkbox' }
  ] as any[]
};

// ==========================================
// 25. PERMISSIONS CONFIG
// ==========================================
export const permissionsConfig = {
  tableName: 'permissions',
  moduleName: 'Permission',
  pluralName: 'Granular Policies',
  zodSchema: z.object({
    code: z.string().min(2, 'Code is required'),
    description: z.string().optional().nullable()
  }),
  defaultFormValues: { code: '', description: '' },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Security Policies' }],
  columns: [
    { accessorKey: 'code', header: sortableHeader('Policy Access Code') },
    { accessorKey: 'description', header: 'Description' }
  ] as ColumnDef<any>[],
  fields: [
    { name: 'code', label: 'Access Policy Code', type: 'text', placeholder: 'tender.cancel', required: true },
    { name: 'description', label: 'Action Description', type: 'text', placeholder: 'Permission to cancel tender filings' }
  ] as any[]
};

// ==========================================
// 26. PERMISSION GROUPS CONFIG
// ==========================================
export const permissionGroupsConfig = {
  tableName: 'permissionGroups',
  moduleName: 'Permission Group',
  pluralName: 'Policy Categories',
  zodSchema: z.object({
    name: z.string().min(2, 'Group Name is required'),
    description: z.string().optional().nullable()
  }),
  defaultFormValues: { name: '', description: '' },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Policy Categories' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Group Category Title') },
    { accessorKey: 'description', header: 'Category Description' }
  ] as ColumnDef<any>[],
  fields: [
    { name: 'name', label: 'Category Title', type: 'text', placeholder: 'Tender Operations', required: true },
    { name: 'description', label: 'Description', type: 'text', placeholder: 'Policy boundaries for tender operations' }
  ] as any[]
};
