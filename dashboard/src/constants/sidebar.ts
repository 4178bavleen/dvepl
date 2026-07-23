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
  Truck,
  Package,
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
  { name: 'Orders', icon: ShoppingCart, path: ROUTES.TENDER_ORDERS, section: 'CRM' },
  { name: 'Vendors', icon: Truck, path: ROUTES.PURCHASE_VENDORS, section: 'CRM' },
  { name: 'Inventory', icon: Package, path: ROUTES.INVENTORY_STOCKS, section: 'CRM' },

  // Lead Management & Tenders
  { name: 'Tender Requests', icon: FolderOpen, path: ROUTES.TENDER_REQUESTS, section: 'Lead Management' },
  { name: 'Tenders', icon: FolderGit2, path: ROUTES.TENDER_TENDERS, section: 'Lead Management' },
  { name: 'Technical Clarifications', icon: HelpCircle, path: ROUTES.TENDER_CLARIFICATIONS, section: 'Lead Management' },
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

 
  { name: 'Audit Logs', icon: AuditIcon, path: ROUTES.AUDIT_LOGS },
  { name: 'Settings', icon: Settings2, path: ROUTES.SETTINGS }
];
