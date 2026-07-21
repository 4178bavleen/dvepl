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
  Zap
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

  // Tenders
  { name: 'Tender Requests', icon: FolderOpen, path: ROUTES.TENDER_REQUESTS, section: 'Tender Management' },
  { name: 'Tenders ', icon: FolderGit2, path: ROUTES.TENDER_TENDERS, section: 'Tender Management' },
  { name: 'Government Departments', icon: Building2, path: ROUTES.TENDER_GOVERNMENT, section: 'Tender Management' },
  { name: 'Sections', icon: GitBranch, path: ROUTES.TENDER_SECTIONS, section: 'Tender Management' },
  { name: 'Divisions', icon: Network, path: ROUTES.TENDER_DIVISIONS, section: 'Tender Management' },
  { name: 'Sub Divisions', icon: Users2, path: ROUTES.TENDER_SUBDIVISIONS, section: 'Tender Management' },
  { name: 'Reference Codes', icon: FileCheck, path: ROUTES.TENDER_REF_CODES, section: 'Tender Management' },
  { name: 'Technical Clarifications', icon: MessageSquare, path: ROUTES.TENDER_CLARIFICATIONS, section: 'Tender Management' },
  { name: 'Quotations', icon: FileText, path: ROUTES.TENDER_QUOTATIONS, section: 'Tender Management' },
  { name: 'Sales Orders', icon: FileCheck, path: ROUTES.TENDER_SALES_ORDERS, section: 'Tender Management' },

  // Security & Audits
  { name: 'Users', icon: UserCheck, path: ROUTES.SECURITY_USERS, section: 'Security' },
  { name: 'Roles', icon: ShieldCheck, path: ROUTES.SECURITY_ROLES, section: 'Security' },
  { name: 'Permissions', icon: Zap, path: ROUTES.SECURITY_PERMISSIONS, section: 'Security' },
  { name: 'Permission Groups', icon: FolderOpen, path: ROUTES.SECURITY_PERMISSION_GROUPS, section: 'Security' },
  { name: 'Approval Rules', icon: Settings2, path: ROUTES.SETTINGS_APPROVAL_RULES, section: 'Security' },
  { name: 'Audit Logs', icon: AuditIcon, path: ROUTES.AUDIT_LOGS },
  { name: 'Settings', icon: Settings2, path: ROUTES.SETTINGS }
];
