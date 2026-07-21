import { 
  LayoutDashboard, 
  Building2, 
  GitBranch, 
  Network, 
  Users2, 
  Award, 
  Wallet, 
  UserCheck, 
  CalendarDays, 
  Briefcase, 
  Clock, 
  DollarSign, 
  Handshake, 
  Contact, 
  MessageSquare, 
  FolderGit2, 
  ShieldCheck, 
  FileText, 
  History as AuditIcon, 
  Settings2,
  FolderOpen,
  FileCheck,
  Zap,
  HelpCircle,
  FileSpreadsheet,
  ShoppingCart,
  CheckSquare,
} from 'lucide-react';
import { ROUTES } from './routes';

export interface SidebarItem {
  name: string;
  icon: any;
  path: string;
  section?: string;
}

export const sidebarItems: SidebarItem[] = [
  { name: 'Dashboard', icon: LayoutDashboard, path: ROUTES.DASHBOARD },
  
  // Organization
  { name: 'Companies', icon: Building2, path: ROUTES.ORGANIZATION_COMPANIES, section: 'Organization' },
  { name: 'Branches', icon: GitBranch, path: ROUTES.ORGANIZATION_BRANCHES, section: 'Organization' },
  { name: 'Departments', icon: Network, path: ROUTES.ORGANIZATION_DEPARTMENTS, section: 'Organization' },
  { name: 'Teams', icon: Users2, path: ROUTES.ORGANIZATION_TEAMS, section: 'Organization' },
  { name: 'Designations', icon: Award, path: ROUTES.ORGANIZATION_DESIGNATIONS, section: 'Organization' },
  { name: 'Cost Centers', icon: Wallet, path: ROUTES.ORGANIZATION_COST_CENTERS, section: 'Organization' },

  // HRMS
  { name: 'Employees', icon: UserCheck, path: ROUTES.HRMS_EMPLOYEES, section: 'HRMS' },
  { name: 'Attendance', icon: Clock, path: ROUTES.HRMS_ATTENDANCE, section: 'HRMS' },
  { name: 'Leaves', icon: CalendarDays, path: ROUTES.HRMS_LEAVES, section: 'HRMS' },
  { name: 'Holidays', icon: CalendarDays, path: ROUTES.HRMS_HOLIDAYS, section: 'HRMS' },
  { name: 'Shift Management', icon: Clock, path: ROUTES.HRMS_SHIFTS, section: 'HRMS' },
  { name: 'Payroll', icon: DollarSign, path: ROUTES.HRMS_PAYROLL, section: 'HRMS' },
  { name: 'Documents', icon: FileText, path: ROUTES.HRMS_DOCUMENTS, section: 'HRMS' },

  // CRM
  { name: 'Customers', icon: Handshake, path: ROUTES.CRM_CUSTOMERS, section: 'CRM' },
  { name: 'Contact Persons', icon: Contact, path: ROUTES.CRM_CONTACTS, section: 'CRM' },
  { name: 'Communication History', icon: MessageSquare, path: ROUTES.CRM_COMMUNICATION, section: 'CRM' },

  // Lead Management & Tenders
  { name: 'Tender Requests', icon: FolderOpen, path: ROUTES.TENDER_REQUESTS, section: 'Lead Management' },
  { name: 'Tenders', icon: FolderGit2, path: ROUTES.TENDER_TENDERS, section: 'Lead Management' },
  { name: 'Technical Clarifications', icon: HelpCircle, path: ROUTES.TENDER_CLARIFICATIONS, section: 'Lead Management' },
  { name: 'BOQ Master', icon: FileSpreadsheet, path: ROUTES.TENDER_BOQS, section: 'Lead Management' },
  { name: 'Quotations', icon: FileText, path: ROUTES.TENDER_QUOTATIONS, section: 'Lead Management' },
  { name: 'Sales Orders', icon: ShoppingCart, path: ROUTES.TENDER_SALES_ORDERS, section: 'Lead Management' },
  { name: 'Government Departments', icon: Building2, path: ROUTES.TENDER_GOVERNMENT, section: 'Lead Management' },
  { name: 'Sections', icon: GitBranch, path: ROUTES.TENDER_SECTIONS, section: 'Lead Management' },
  { name: 'Divisions', icon: Network, path: ROUTES.TENDER_DIVISIONS, section: 'Lead Management' },
  { name: 'Sub Divisions', icon: Users2, path: ROUTES.TENDER_SUBDIVISIONS, section: 'Lead Management' },
  { name: 'Reference Codes', icon: FileCheck, path: ROUTES.TENDER_REF_CODES, section: 'Lead Management' },

  // Security (PRBAC)
  { name: 'Users', icon: UserCheck, path: ROUTES.SECURITY_USERS, section: 'Security' },
  { name: 'Roles', icon: ShieldCheck, path: ROUTES.SECURITY_ROLES, section: 'Security' },
  { name: 'Permissions', icon: Zap, path: ROUTES.SECURITY_PERMISSIONS, section: 'Security' },
  { name: 'Permission Groups', icon: FolderOpen, path: ROUTES.SECURITY_PERMISSION_GROUPS, section: 'Security' },
  { name: 'Approval Requests', icon: CheckSquare, path: ROUTES.SECURITY_APPROVAL_REQUESTS, section: 'Security' },

  // Engineering & Manufacturing
  { name: 'Design Projects', icon: FolderGit2, path: ROUTES.ENGINEERING_PROJECTS, section: 'Engineering' },
  { name: 'Drawings Master', icon: FolderOpen, path: ROUTES.ENGINEERING_DRAWINGS, section: 'Engineering' },
  { name: 'BOM Master', icon: Zap, path: ROUTES.ENGINEERING_BOMS, section: 'Engineering' },

  // Materials & Master Catalog
  { name: 'Materials Catalog', icon: Briefcase, path: ROUTES.MATERIAL_MATERIALS, section: 'Material Master' },
  { name: 'Material Categories', icon: GitBranch, path: ROUTES.MATERIAL_CATEGORIES, section: 'Material Master' },

  // Procurement & Purchase
  { name: 'Purchase Requests', icon: FileText, path: ROUTES.PURCHASE_REQUESTS, section: 'Procurement' },
  { name: 'Purchase Orders', icon: FileCheck, path: ROUTES.PURCHASE_ORDERS, section: 'Procurement' },

  // Inventory & Logistics
  { name: 'Warehouses', icon: Building2, path: ROUTES.INVENTORY_WAREHOUSES, section: 'Inventory & Warehousing' },
  { name: 'Stock Master', icon: Wallet, path: ROUTES.INVENTORY_STOCKS, section: 'Inventory & Warehousing' },
  { name: 'Stock Transfers', icon: GitBranch, path: ROUTES.INVENTORY_TRANSFERS, section: 'Inventory & Warehousing' },
  { name: 'Logistics Dispatches', icon: FileCheck, path: ROUTES.LOGISTICS_DISPATCHES, section: 'Inventory & Warehousing' },

  // Production Control
  { name: 'Production Plans', icon: CalendarDays, path: ROUTES.PRODUCTION_PLANS, section: 'Production' },
  { name: 'Work Orders', icon: FolderOpen, path: ROUTES.PRODUCTION_WORK_ORDERS, section: 'Production' },

  // Quality Assurance
  { name: 'Quality Inspections', icon: ShieldCheck, path: ROUTES.QUALITY_INSPECTIONS, section: 'Quality Assurance' },

  // Finance & Accounts
  { name: 'Customer Invoices', icon: FileText, path: ROUTES.FINANCE_INVOICES, section: 'Finance & Accounts' },
  { name: 'Received Payments', icon: DollarSign, path: ROUTES.FINANCE_PAYMENTS, section: 'Finance & Accounts' },
  { name: 'Office Expenses', icon: Wallet, path: ROUTES.FINANCE_EXPENSES, section: 'Finance & Accounts' },

  { name: 'Audit Logs', icon: AuditIcon, path: ROUTES.AUDIT_LOGS },
  { name: 'Settings', icon: Settings2, path: ROUTES.SETTINGS }
];
