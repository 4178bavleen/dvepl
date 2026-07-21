import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { materialApi, crmApi } from '@/services/modules';

// ==========================================
// 1. MATERIALS CATALOG ROUTE CONFIG
// ==========================================
export const materialsConfig = {
  api: materialApi.materials,
  selectOptions: {
    categoryId: materialApi.categories.list,
    preferredVendorId: crmApi.customers.list,
  },
  tableName: 'materials',
  moduleName: 'Material Item',
  pluralName: 'Materials Catalog',
  zodSchema: z.object({
    materialCode: z.string().min(2, 'Enter unique code'),
    name: z.string().min(2, 'Enter material name'),
    description: z.string().optional().nullable(),
    hsnCode: z.string().optional().nullable(),
    gst: z.coerce.number().min(0).max(100),
    unit: z.string().min(1, 'Select base unit'),
    weight: z.coerce.number().optional().nullable(),
    color: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    preferredVendorId: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    materialCode: '',
    name: '',
    description: '',
    hsnCode: '',
    gst: '18',
    unit: 'PCS',
    weight: '',
    color: '',
    categoryId: '',
    preferredVendorId: '',
    isActive: true,
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Materials Catalog' },
  ],
  columns: [
    { accessorKey: 'materialCode', header: sortableHeader('Code') },
    { accessorKey: 'name', header: sortableHeader('Name') },
    { accessorKey: 'unit', header: 'Unit' },
    {
      accessorKey: 'gst',
      header: 'GST Rate',
      cell: ({ getValue }) => `${getValue()}%`,
    },
    {
      accessorKey: 'categoryId',
      header: 'Category',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.category?.name || 'Unassigned';
      },
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (getValue() ? 'Active' : 'Inactive'),
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'materialCode', label: 'Material/Part Code', type: 'text', placeholder: 'PART-STEEL-001', required: true },
    { name: 'name', label: 'Item Name', type: 'text', placeholder: 'Cold Rolled Steel Sheet', required: true },
    { name: 'unit', label: 'Base Unit of Measure', type: 'text', placeholder: 'KG, PCS, MTR', required: true },
    { name: 'gst', label: 'GST Percentage', type: 'number', placeholder: '18', required: true },
    { name: 'hsnCode', label: 'HSN Code', type: 'text', placeholder: '7208' },
    { name: 'categoryId', label: 'Material Category', type: 'select', options: [] },
    { name: 'preferredVendorId', label: 'Preferred Supplier', type: 'select', options: [] },
    { name: 'weight', label: 'Unit Weight (KG)', type: 'number' },
    { name: 'color', label: 'Color Spec', type: 'text' },
    { name: 'description', label: 'Part Description', type: 'textarea' },
    { name: 'isActive', label: 'Active Catalog Status', type: 'checkbox' },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Total Cataloged Parts', value: data.length },
    { label: 'Active Materials', value: data.filter((m) => m.isActive).length },
  ],
};

// ==========================================
// 2. MATERIAL CATEGORIES ROUTE CONFIG
// ==========================================
export const materialCategoriesConfig = {
  api: materialApi.categories,
  selectOptions: {},
  tableName: 'materialCategories',
  moduleName: 'Material Category',
  pluralName: 'Material Categories',
  zodSchema: z.object({
    code: z.string().min(2, 'Enter code prefix'),
    name: z.string().min(2, 'Enter category name'),
    description: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    code: '',
    name: '',
    description: '',
    isActive: true,
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Material Categories' },
  ],
  columns: [
    { accessorKey: 'code', header: sortableHeader('Category Code') },
    { accessorKey: 'name', header: sortableHeader('Category Name') },
    { accessorKey: 'description', header: 'Description' },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (getValue() ? 'Active' : 'Inactive'),
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'code', label: 'Category Prefix', type: 'text', placeholder: 'STEEL', required: true },
    { name: 'name', label: 'Category Title', type: 'text', placeholder: 'Steel & Ferrous Alloys', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'isActive', label: 'Active', type: 'checkbox' },
  ] as any[],
};
