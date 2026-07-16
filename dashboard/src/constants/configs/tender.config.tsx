import { ColumnDef } from '@tanstack/react-table';
import * as z from 'zod';
import { sortableHeader } from '@/components/tables/GenericTable';
import { crmApi, tenderApi } from '@/services/modules';
import { 
  Tender, 
  TenderRequest, 
  GovernmentDepartment, 
  Section, 
  Division, 
  SubDivision,
  ReferenceCode
} from '@/types/erp';

// ==========================================
// 16. TENDER REQUESTS ROUTE CONFIG
// ==========================================
export const tenderRequestsConfig = {
  api: tenderApi.requests,
  selectOptions: { customerId: crmApi.customers.list },
  tableName: 'tenderRequests',
  moduleName: 'Tender Request',
  pluralName: 'Tender Requests',
  zodSchema: z.object({
    customerId: z.string().min(1, 'Select customer'),
    title: z.string().min(2, 'Enter title details'),
    description: z.string().optional().nullable(),
    estimatedValue: z.coerce.number(),
    source: z.string().default('EMAIL'),
    status: z.string().default('NEW')
  }),
  defaultFormValues: { customerId: 'cust-1', title: '', description: '', estimatedValue: '0', source: 'EMAIL', status: 'NEW' },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tender Requests' }],
  columns: [
    { accessorKey: 'title', header: sortableHeader('Request Title') },
    { 
      accessorKey: 'customerId', 
      header: 'Client Account',
      cell: ({ getValue }) => {
        const id = getValue();
        if (id === 'cust-1') return 'Indian Railways';
        if (id === 'cust-2') return 'Larsen & Toubro';
        return 'ONGC';
      }
    },
    { accessorKey: 'estimatedValue', header: 'Estimated Value', cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}` },
    { accessorKey: 'source', header: 'Channel Origin' },
    { 
      accessorKey: 'status', 
      header: 'Status',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            val === 'NEW' ? 'bg-indigo-500/15 text-indigo-500' : 
            val === 'QUALIFIED' ? 'bg-success/15 text-success' : 
            'bg-muted-foreground/15 text-muted-foreground'
          }`}>
            {val}
          </span>
        );
      }
    }
  ] as ColumnDef<TenderRequest>[],
  fields: [
    { name: 'customerId', label: 'Client / Account', type: 'select', options: [
      { label: 'Indian Railways (CR)', value: 'cust-1' },
      { label: 'Larsen & Toubro Ltd', value: 'cust-2' },
      { label: 'ONGC', value: 'cust-3' }
    ], required: true },
    { name: 'title', label: 'Tender Request Title', type: 'text', placeholder: 'Supply of Ball Valves, 150 Class', required: true },
    { name: 'description', label: 'Scope Description', type: 'textarea', placeholder: 'Details of dimensions' },
    { name: 'estimatedValue', label: 'Estimated Project Value (INR)', type: 'number', placeholder: '1000000', required: true },
    { name: 'source', label: 'Origin Channel', type: 'select', options: [
      { label: 'Company Website', value: 'WEBSITE' },
      { label: 'Customer Referral', value: 'REFERRAL' },
      { label: 'Direct Email', value: 'EMAIL' },
      { label: 'WhatsApp Query', value: 'WHATSAPP' },
      { label: 'Manual RFP entry', value: 'MANUAL' }
    ] },
    { name: 'status', label: 'Status', type: 'select', options: [
      { label: 'New Lead', value: 'NEW' },
      { label: 'Assigned Engineer', value: 'ASSIGNED' },
      { label: 'Contacted Client', value: 'CONTACTED' },
      { label: 'Qualified Lead', value: 'QUALIFIED' },
      { label: 'Won Deal', value: 'WON' },
      { label: 'Lost Opportunity', value: 'LOST' }
    ] }
  ] as any[],
  statsCards: (data: TenderRequest[]) => [
    { label: 'Total RFPs Received', value: data.length },
    { label: 'Active Pipeline Valuation', value: `₹${data.reduce((sum, item) => sum + Number(item.estimatedValue || 0), 0).toLocaleString()}` }
  ]
};

// ==========================================
// 17. TENDER ROUTE CONFIG
// ==========================================
export const tendersConfig = {
  api: tenderApi.tenders,
  selectOptions: { customerId: crmApi.customers.list },
  tableName: 'tenders',
  moduleName: 'Tender Bidding File',
  pluralName: 'Tender Bids',
  zodSchema: z.object({
    customerId: z.string().min(1, 'Select customer'),
    tenderNo: z.string().min(2, 'Enter tender bidding file number'),
    title: z.string().min(2, 'Enter tender bidding title'),
    description: z.string().optional().nullable(),
    projectLocation: z.string().optional().nullable(),
    estimatedCost: z.coerce.number(),
    dueDate: z.string().min(2, 'Select due date'),
    status: z.string().default('DRAFT')
  }),
  defaultFormValues: { customerId: 'cust-1', tenderNo: '', title: '', description: '', projectLocation: '', estimatedCost: '0', dueDate: '', status: 'DRAFT' },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tenders Pipeline' }],
  columns: [
    { accessorKey: 'tenderCode', header: sortableHeader('System Ref Code') },
    { accessorKey: 'tenderNo', header: sortableHeader('Tender/RFP No') },
    { accessorKey: 'title', header: sortableHeader('Bid Name') },
    { accessorKey: 'estimatedCost', header: 'Estimated Cost', cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}` },
    { accessorKey: 'dueDate', header: 'Submission Due Date', cell: ({ getValue }) => new Date(getValue() as string).toLocaleDateString() },
    { 
      accessorKey: 'status', 
      header: 'Bid Status',
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            val === 'OPEN' ? 'bg-primary/15 text-primary' : 
            val === 'IN_PROGRESS' ? 'bg-warning/15 text-warning' : 
            val === 'COMPLETED' ? 'bg-success/15 text-success' : 
            'bg-muted-foreground/15 text-muted-foreground'
          }`}>
            {val}
          </span>
        );
      }
    }
  ] as ColumnDef<Tender>[],
  fields: [
    { name: 'customerId', label: 'Client Partner', type: 'select', options: [
      { label: 'Indian Railways (CR)', value: 'cust-1' },
      { label: 'Larsen & Toubro Ltd', value: 'cust-2' },
      { label: 'ONGC', value: 'cust-3' }
    ], required: true },
    { name: 'tenderNo', label: 'Client RFP Tender No', type: 'text', placeholder: 'TND-2026-CR-089', required: true },
    { name: 'title', label: 'Tender Project Name', type: 'text', placeholder: 'Supply and Testing of Cast Steel Gate Valves', required: true },
    { name: 'estimatedCost', label: 'Project Valuation Bid Value (INR)', type: 'number', placeholder: '1500000', required: true },
    { name: 'dueDate', label: 'Bid Submission Deadline', type: 'date', required: true },
    { name: 'projectLocation', label: 'Project Site Location', type: 'text', placeholder: 'Central Railway Workshop, Kurla' },
    { name: 'description', label: 'Internal Bid Scope Remarks', type: 'textarea', placeholder: 'Triple-offset body material parameters' },
    { name: 'status', label: 'Bid Pipeline Status', type: 'select', options: [
      { label: 'Draft Bid Doc', value: 'DRAFT' },
      { label: 'Open Public Bidding', value: 'OPEN' },
      { label: 'Assigned Estimator', value: 'ASSIGNED' },
      { label: 'In Progress Prep', value: 'IN_PROGRESS' },
      { label: 'Submitted to Client', value: 'SUBMITTED' },
      { label: 'Won and Awarded', value: 'COMPLETED' },
      { label: 'Cancelled Bidding', value: 'CANCELLED' }
    ] }
  ] as any[],
  statsCards: (data: Tender[]) => [
    { label: 'Total Tenders Listed', value: data.length },
    { label: 'Open For Bidding', value: data.filter(t => t.status === 'OPEN').length },
    { label: 'Bids in Preparation', value: data.filter(t => t.status === 'IN_PROGRESS').length },
    { label: 'Contracts Won', value: data.filter(t => t.status === 'COMPLETED').length, change: 'Revenue', trend: 'up' as const }
  ]
};

// ==========================================
// 18. GOVERNMENT DEPARTMENTS CONFIG
// ==========================================
export const governmentConfig = {
  api: tenderApi.governmentDepartments,
  tableName: 'governmentDepartments',
  moduleName: 'Government Department',
  pluralName: 'Govt Departments',
  zodSchema: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().optional().nullable(),
    shortName: z.string().optional().nullable(),
    isActive: z.boolean().default(true)
  }),
  defaultFormValues: { name: '', code: '', shortName: '', isActive: true },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Govt Departments' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Department Name') },
    { accessorKey: 'code', header: 'Department ID Code' },
    { accessorKey: 'shortName', header: 'Abbreviated Code' },
    { 
      accessorKey: 'isActive', 
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getValue() ? 'bg-success/15 text-success' : 'bg-muted-foreground/15 text-muted-foreground'}`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ] as ColumnDef<GovernmentDepartment>[],
  fields: [
    { name: 'name', label: 'Department Name', type: 'text', placeholder: 'Military Engineer Services', required: true },
    { name: 'code', label: 'Department Reference Code', type: 'text', placeholder: 'MES' },
    { name: 'shortName', label: 'Short Name Acronym', type: 'text', placeholder: 'MES' },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ] as any[]
};

// ==========================================
// 19. SECTIONS ROUTE CONFIG
// ==========================================
export const sectionsConfig = {
  api: tenderApi.sections,
  selectOptions: { departmentId: tenderApi.governmentDepartments.list },
  tableName: 'sections',
  moduleName: 'Tender Section',
  pluralName: 'Tender Sections',
  zodSchema: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().optional().nullable(),
    departmentId: z.string().min(1, 'Department is required'),
    isActive: z.boolean().default(true)
  }),
  defaultFormValues: { name: '', code: '', departmentId: 'dept-1', isActive: true },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tender Sections' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Section Name') },
    { accessorKey: 'code', header: 'Section Code' },
    { accessorKey: 'departmentId', header: 'Department Link ID' },
    { 
      accessorKey: 'isActive', 
      header: 'Status',
      cell: ({ getValue }) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getValue() ? 'bg-success/15 text-success' : 'bg-muted-foreground/15 text-muted-foreground'}`}>
          {getValue() ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ] as ColumnDef<Section>[],
  fields: [
    { name: 'departmentId', label: 'Link Department', type: 'select', options: [
      { label: 'Sales & Marketing', value: 'dept-1' },
      { label: 'Human Resources', value: 'dept-2' }
    ], required: true },
    { name: 'name', label: 'Section Name', type: 'text', placeholder: 'Zonal Engineering Wing', required: true },
    { name: 'code', label: 'Section Code', type: 'text', placeholder: 'SEC-ZEW' },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ] as any[]
};

// ==========================================
// 20. DIVISIONS ROUTE CONFIG
// ==========================================
export const divisionsConfig = {
  api: tenderApi.divisions,
  selectOptions: { sectionId: tenderApi.sections.list },
  tableName: 'divisions',
  moduleName: 'Tender Division',
  pluralName: 'Tender Divisions',
  zodSchema: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().optional().nullable(),
    sectionId: z.string().min(1, 'Section is required'),
    isActive: z.boolean().default(true)
  }),
  defaultFormValues: { name: '', code: '', sectionId: 'sec-1', isActive: true },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tender Divisions' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Division Name') },
    { accessorKey: 'code', header: 'Division Code' },
    { accessorKey: 'sectionId', header: 'Section Link ID' }
  ] as ColumnDef<Division>[],
  fields: [
    { name: 'sectionId', label: 'Link Section', type: 'select', options: [
      { label: 'Zonal Engineering Wing', value: 'sec-1' }
    ], required: true },
    { name: 'name', label: 'Division Name', type: 'text', placeholder: 'Western Division', required: true },
    { name: 'code', label: 'Division Code', type: 'text', placeholder: 'DIV-WEST' },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ] as any[]
};

// ==========================================
// 21. SUB DIVISIONS ROUTE CONFIG
// ==========================================
export const subdivisionsConfig = {
  api: tenderApi.subDivisions,
  selectOptions: { divisionId: tenderApi.divisions.list },
  tableName: 'subDivisions',
  moduleName: 'Tender Sub Division',
  pluralName: 'Tender Sub Divisions',
  zodSchema: z.object({
    name: z.string().min(2, 'Name is required'),
    code: z.string().optional().nullable(),
    divisionId: z.string().min(1, 'Division is required'),
    isActive: z.boolean().default(true)
  }),
  defaultFormValues: { name: '', code: '', divisionId: 'div-1', isActive: true },
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tender Sub Divisions' }],
  columns: [
    { accessorKey: 'name', header: sortableHeader('Sub Division Name') },
    { accessorKey: 'code', header: 'Sub Division Code' },
    { accessorKey: 'divisionId', header: 'Division Link ID' }
  ] as ColumnDef<SubDivision>[],
  fields: [
    { name: 'divisionId', label: 'Link Division', type: 'select', options: [
      { label: 'Western Division', value: 'div-1' }
    ], required: true },
    { name: 'name', label: 'Sub Division Name', type: 'text', placeholder: 'Mumbai Sub-Division 1', required: true },
    { name: 'code', label: 'Sub Division Code', type: 'text', placeholder: 'SUB-MUM1' },
    { name: 'isActive', label: 'Active', type: 'checkbox' }
  ] as any[]
};

// ==========================================
// 22. REFERENCE CODES CONFIG (READ ONLY)
// ==========================================
export const referenceCodesConfig = {
  api: tenderApi.referenceCodes,
  readOnly: true,
  tableName: 'referenceCodes',
  moduleName: 'Reference Code Transaction',
  pluralName: 'Reference Codes',
  zodSchema: z.object({}),
  defaultFormValues: {},
  breadcrumbs: [{ label: 'Dashboard', href: '/' }, { label: 'Tenders', href: '/tender/tenders' }, { label: 'Reference Codes' }],
  columns: [
    { 
      accessorKey: 'tenderId', 
      header: 'Assigned Tender',
      cell: ({ getValue }) => {
        const id = getValue() as string;
        if (id === 't-1') return 'Supply and Testing of Cast Steel Gate Valves (TND-2026-CR-089)';
        if (id === 't-2') return 'L&T Butterfly Valves supply (LT-HE-PL-2026)';
        return id || 'System Generated';
      }
    },
    { accessorKey: 'oldReferenceCode', header: 'Old Reference Code', cell: ({ getValue }) => getValue() || '—' },
    { accessorKey: 'newReferenceCode', header: 'Reference Code', cell: ({ getValue }) => getValue() || '—' },
    { accessorKey: 'actionType', header: 'Action Type' },
    { accessorKey: 'actionReason', header: 'Audit Reason' },
    { accessorKey: 'actionBy', header: 'Generated By' },
    { accessorKey: 'createdAt', header: 'Timestamp', cell: ({ getValue }) => getValue() ? new Date(getValue() as string).toLocaleString() : '—' }
  ] as ColumnDef<any>[],
  fields: [] as any[],
  statsCards: (data: any[]) => [
    { label: 'Total Codes Issued', value: data.length }
  ]
};
