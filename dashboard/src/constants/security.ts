import { 
  User, 
  Role, 
  PermissionGroup, 
  Permission, 
  AuditLog 
} from '../types/erp';

export const initialUsers: User[] = [
  { 
    id: 'user-1', 
    name: 'Gabriel Dhillon', 
    companyId: 'comp-1', 
    email: 'gabriel.dhillon@dvepl.com', 
    phone: '+91 99999 88888', 
    isEmailVerified: true, 
    isPhoneVerified: true, 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'user-2', 
    name: 'Rajesh Kumar', 
    companyId: 'comp-1', 
    email: 'rajesh.kumar@dvepl.com', 
    phone: '+91 98888 77777', 
    isEmailVerified: true, 
    isPhoneVerified: false, 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'user-3', 
    name: 'Priya Sharma', 
    companyId: 'comp-1', 
    email: 'priya.sharma@dvepl.com', 
    phone: '+91 97777 66666', 
    isEmailVerified: true, 
    isPhoneVerified: true, 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialRoles: Role[] = [
  { 
    id: 'role-1', 
    companyId: 'comp-1', 
    name: 'Super Admin', 
    description: 'Full access to all ERP modules', 
    isSystem: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'role-2', 
    companyId: 'comp-1', 
    name: 'HR Manager', 
    description: 'Manage employee directories, payroll, leaves, attendance', 
    isSystem: false, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'role-3', 
    companyId: 'comp-1', 
    name: 'Tender Executive', 
    description: 'Prepare proposal bids, view/edit tenders, manage client data', 
    isSystem: false, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialPermissionGroups: PermissionGroup[] = [
  { id: 'pg-1', name: 'Organization Settings', description: 'Configure companies, branches, departments' },
  { id: 'pg-2', name: 'HRMS Management', description: 'Control staff directory, logs, salaries' },
  { id: 'pg-3', name: 'Tender Operations', description: 'Manage incoming tender requests and formal bids' },
  { id: 'pg-4', name: 'PRBAC Security', description: 'Assign roles and fine-tune access controls' }
];

export const initialPermissions: Permission[] = [
  { id: 'p-1', groupId: 'pg-1', code: 'organization.view', description: 'View organization elements' },
  { id: 'p-2', groupId: 'pg-1', code: 'organization.write', description: 'Modify branches and offices' },
  { id: 'p-3', groupId: 'pg-2', code: 'employee.view', description: 'Access employee profile directory' },
  { id: 'p-4', groupId: 'pg-2', code: 'employee.write', description: 'Add/Edit employee files and salaries' },
  { id: 'p-5', groupId: 'pg-2', code: 'payroll.run', description: 'Recalculate salaries and generate slips' },
  { id: 'p-6', groupId: 'pg-3', code: 'tender.view', description: 'View public and private tender pipelines' },
  { id: 'p-7', groupId: 'pg-3', code: 'tender.write', description: 'Upload and submit tender filings' },
  { id: 'p-8', groupId: 'pg-3', code: 'tender.approve', description: 'Sign off on bid valuations' }
];

export const initialAuditLogs: AuditLog[] = [
  { 
    id: 'log-1', 
    userId: 'user-1', 
    module: 'System', 
    recordId: 'sys-init', 
    action: 'INIT', 
    oldValue: null, 
    newValue: { version: '1.0.0', initialized: true }, 
    ipAddress: '192.168.1.100', 
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0', 
    createdAt: new Date(2026, 6, 15, 9, 0, 0).toISOString() 
  },
  { 
    id: 'log-2', 
    userId: 'user-3', 
    module: 'TenderRequest', 
    recordId: 'tr-1', 
    action: 'CREATE', 
    oldValue: null, 
    newValue: { title: 'Central Railway High Pressure Gate Valves Supply' }, 
    ipAddress: '192.168.1.105', 
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 
    createdAt: new Date(2026, 6, 15, 11, 20, 0).toISOString() 
  }
];
