import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/genericTable';
import { inventoryApi, materialApi, securityApi } from '@/services/modules';

// ==========================================
// 1. WAREHOUSES ROUTE CONFIG
// ==========================================
export const warehousesConfig = {
  api: inventoryApi.warehouses,
  selectOptions: {},
  tableName: 'warehouses',
  moduleName: 'Warehouse Facility',
  pluralName: 'Warehouses Catalog',
  zodSchema: z.object({
    code: z.string().min(2, 'Enter unique code'),
    name: z.string().min(2, 'Enter facility name'),
    location: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    code: '',
    name: '',
    location: '',
    isActive: true,
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Warehousing' },
  ],
  columns: [
    { accessorKey: 'code', header: sortableHeader('Facility Code') },
    { accessorKey: 'name', header: sortableHeader('Facility Name') },
    { accessorKey: 'location', header: 'Physical Address' },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ getValue }) => (getValue() ? 'Active' : 'Inactive'),
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'code', label: 'Warehouse Code', type: 'text', placeholder: 'WH-MAIN-01', required: true },
    { name: 'name', label: 'Facility Name', type: 'text', placeholder: 'Central Finished Goods Depot', required: true },
    { name: 'location', label: 'Physical Location / Bin layout', type: 'text', placeholder: 'Sector 5, Industrial Area' },
    { name: 'isActive', label: 'Facility Operational Status', type: 'checkbox' },
  ] as any[],
};

// ==========================================
// 2. STOCK MASTER ROUTE CONFIG
// ==========================================
export const inventoryStocksConfig = {
  api: inventoryApi.stocks,
  selectOptions: {
    materialId: materialApi.materials.list,
    warehouseId: inventoryApi.warehouses.list,
  },
  tableName: 'inventories',
  moduleName: 'Stock Record',
  pluralName: 'Stock Ledger',
  zodSchema: z.object({
    materialId: z.string().min(1, 'Select material'),
    warehouseId: z.string().min(1, 'Select location'),
    batchNo: z.string().optional().nullable(),
    serialNo: z.string().optional().nullable(),
    quantity: z.coerce.number().nonnegative(),
    reservedQty: z.coerce.number().nonnegative().default(0),
    damagedQty: z.coerce.number().nonnegative().default(0),
    scrapQty: z.coerce.number().nonnegative().default(0),
    unitPrice: z.coerce.number().nonnegative(),
    expiryDate: z.string().or(z.date()).optional().nullable(),
  }),
  defaultFormValues: {
    materialId: '',
    warehouseId: '',
    batchNo: '',
    serialNo: '',
    quantity: '0',
    reservedQty: '0',
    damagedQty: '0',
    scrapQty: '0',
    unitPrice: '0',
    expiryDate: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Physical Stock Ledger' },
  ],
  columns: [
    {
      accessorKey: 'materialId',
      header: 'Material Part',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.material ? `${item.material.name} (${item.material.materialCode})` : 'Loading...';
      },
    },
    {
      accessorKey: 'warehouseId',
      header: 'Warehouse',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.warehouse?.name || 'Loading...';
      },
    },
    { accessorKey: 'quantity', header: sortableHeader('Qty On Hand') },
    {
      accessorKey: 'unitPrice',
      header: 'Book Value',
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'materialId', label: 'Material Part Catalog Item', type: 'select', options: [], required: true },
    { name: 'warehouseId', label: 'Storage Facility', type: 'select', options: [], required: true },
    { name: 'quantity', label: 'Quantity On Hand', type: 'number', placeholder: '100', required: true },
    { name: 'reservedQty', label: 'Reserved Quantity (Committed)', type: 'number', placeholder: '0', required: true },
    { name: 'damagedQty', label: 'Damaged Stock Qty', type: 'number', placeholder: '0', required: true },
    { name: 'scrapQty', label: 'Scrap/Waste Qty', type: 'number', placeholder: '0', required: true },
    { name: 'unitPrice', label: 'Inventory Cost Unit Price (INR)', type: 'number', placeholder: '100', required: true },
    { name: 'batchNo', label: 'Production Batch Ref', type: 'text', placeholder: 'B-STEEL-X45' },
    { name: 'serialNo', label: 'Unique Serial No', type: 'text', placeholder: 'S-77402' },
    { name: 'expiryDate', label: 'Material Shelf Life Expiry', type: 'date' },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: 'Unique Storage Rows', value: data.length },
    {
      label: 'Cumulate Physical Quantity',
      value: data.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    },
  ],
};

// ==========================================
// 3. STOCK TRANSFERS ROUTE CONFIG
// ==========================================
export const stockTransfersConfig = {
  api: inventoryApi.transfers,
  selectOptions: {
    fromWarehouseId: inventoryApi.warehouses.list,
    toWarehouseId: inventoryApi.warehouses.list,
    materialId: materialApi.materials.list,
    requestedById: securityApi.users.list,
  },
  tableName: 'stockTransfers',
  moduleName: 'Stock Transfer',
  pluralName: 'Stock Transfers',
  zodSchema: z.object({
    transferNo: z.string().min(2, 'Enter transfer number'),
    fromWarehouseId: z.string().min(1, 'Select source warehouse'),
    toWarehouseId: z.string().min(1, 'Select target warehouse'),
    materialId: z.string().min(1, 'Select material'),
    quantity: z.coerce.number().positive(),
    batchNo: z.string().optional().nullable(),
    status: z.string().default('REQUESTED'),
    requestedById: z.string().min(1, 'Select requester'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    transferNo: '',
    fromWarehouseId: '',
    toWarehouseId: '',
    materialId: '',
    quantity: '1',
    batchNo: '',
    status: 'REQUESTED',
    requestedById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Inter-Warehouse Transfers' },
  ],
  columns: [
    { accessorKey: 'transferNo', header: sortableHeader('Transfer No') },
    {
      accessorKey: 'fromWarehouseId',
      header: 'Source Location',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.fromWarehouse?.name || 'Loading...';
      },
    },
    {
      accessorKey: 'toWarehouseId',
      header: 'Destination Location',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.toWarehouse?.name || 'Loading...';
      },
    },
    { accessorKey: 'quantity', header: 'Quantity' },
    { accessorKey: 'status', header: 'Transfer Stage' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'transferNo', label: 'Transfer Sheet Reference', type: 'text', placeholder: 'TR-2026-0001', required: true },
    { name: 'fromWarehouseId', label: 'Source Depot', type: 'select', options: [], required: true },
    { name: 'toWarehouseId', label: 'Target Depot', type: 'select', options: [], required: true },
    { name: 'materialId', label: 'Select Part / Material', type: 'select', options: [], required: true },
    { name: 'quantity', label: 'Transfer Quantity', type: 'number', placeholder: '10', required: true },
    { name: 'requestedById', label: 'Transfer Initiated By', type: 'select', options: [], required: true },
    {
      name: 'status',
      label: 'Stage Status',
      type: 'select',
      options: [
        { label: 'Requested / Draft', value: 'REQUESTED' },
        { label: 'Approved Inter-Transit', value: 'APPROVED' },
        { label: 'Completed & Received', value: 'COMPLETED' },
        { label: 'Cancelled Request', value: 'CANCELLED' },
      ],
    },
    { name: 'batchNo', label: 'Fulfillment Batch No', type: 'text' },
    { name: 'remarks', label: 'Transfer Justification', type: 'textarea' },
  ] as any[],
};
