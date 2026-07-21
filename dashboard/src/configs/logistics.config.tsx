import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { logisticsApi, salesOrderApi, securityApi } from '@/services/modules';

export const dispatchesConfig = {
  api: logisticsApi.dispatches,
  selectOptions: {
    salesOrderId: salesOrderApi.salesOrders.list,
    vehicleId: logisticsApi.vehicles.list,
    createdById: securityApi.users.list,
  },
  tableName: 'dispatches',
  moduleName: 'Logistics Dispatch',
  pluralName: 'Outbound Dispatches',
  zodSchema: z.object({
    dispatchNo: z.string().min(2, 'Enter dispatch number'),
    salesOrderId: z.string().min(1, 'Select sales order link'),
    vehicleId: z.string().optional().nullable(),
    driverName: z.string().optional().nullable(),
    driverPhone: z.string().optional().nullable(),
    ewayBillNo: z.string().optional().nullable(),
    dispatchDate: z.string().or(z.date()).default(() => new Date()),
    status: z.string().default('PENDING'),
    createdById: z.string().min(1, 'Creator account required'),
    remarks: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    dispatchNo: '',
    salesOrderId: '',
    vehicleId: '',
    driverName: '',
    driverPhone: '',
    ewayBillNo: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
    createdById: '',
    remarks: '',
  },
  breadcrumbs: [
    { label: 'Dashboard', href: '/' },
    { label: 'Outbound Fleet Logistics' },
  ],
  columns: [
    { accessorKey: 'dispatchNo', header: sortableHeader('LR/Dispatch No') },
    {
      accessorKey: 'salesOrderId',
      header: 'Sales Contract',
      cell: ({ row }) => {
        const item = row.original as any;
        return item.salesOrder?.orderNo || 'Loading...';
      },
    },
    { accessorKey: 'driverName', header: 'Driver' },
    { accessorKey: 'dispatchDate', header: 'Dispatched Date' },
    { accessorKey: 'status', header: 'Status' },
  ] as ColumnDef<any>[],
  fields: [
    { name: 'dispatchNo', label: 'Lorry Receipt / Dispatch No', type: 'text', placeholder: 'LR-2026-0001', required: true },
    { name: 'salesOrderId', label: 'Sales Order Contract', type: 'select', options: [], required: true },
    { name: 'createdById', label: 'Dispatch Officer', type: 'select', options: [], required: true },
    { name: 'vehicleId', label: 'Assigned Outbound Vehicle', type: 'select', options: [] },
    { name: 'driverName', label: 'Driver Full Name', type: 'text', placeholder: 'Rajesh Kumar' },
    { name: 'driverPhone', label: 'Driver Phone Contact', type: 'text', placeholder: '9876543210' },
    { name: 'ewayBillNo', label: 'GST E-Way Bill Number', type: 'text', placeholder: 'EW-2026-102938' },
    { name: 'dispatchDate', label: 'Dispatch Exit Date', type: 'date', required: true },
    {
      name: 'status',
      label: 'Fulfillment Stage',
      type: 'select',
      options: [
        { label: 'Pending Gate Exit', value: 'PENDING' },
        { label: 'Dispatched / In-Transit', value: 'DISPATCHED' },
        { label: 'Delivered to Site', value: 'DELIVERED' },
        { label: 'Cancelled Shipment', value: 'CANCELLED' },
      ],
    },
    { name: 'remarks', label: 'Logistics Notes', type: 'textarea' },
  ] as any[],
};
