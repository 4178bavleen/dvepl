import { create } from 'zustand';
import { 
  EmployeeStatus, AttendanceStatus, LeaveStatus, 
  CommunicationType, TenderStatus, TenderRequestSource, TenderRequestStatus,
  ReferenceCodeAction, Company, Branch, Department, Team, Designation,
  CostCenter, User, Role, PermissionGroup, Permission, Employee, 
  Attendance, Leave, Salary, Customer, ContactPerson, CommunicationHistory,
  Tender, TenderRequest, GovernmentDepartment, Section, Division,
  SubDivision, ReferenceCode, AuditLog, Shift, Holiday
} from '../types/erp';

interface ERPStore {
  companies: Company[];
  branches: Branch[];
  departments: Department[];
  teams: Team[];
  designations: Designation[];
  costCenters: CostCenter[];
  users: User[];
  roles: Role[];
  permissions: Permission[];
  permissionGroups: PermissionGroup[];
  employees: Employee[];
  attendances: Attendance[];
  leaves: Leave[];
  salaries: Salary[];
  customers: Customer[];
  contactPersons: ContactPerson[];
  communicationHistories: CommunicationHistory[];
  tenders: Tender[];
  tenderRequests: TenderRequest[];
  governmentDepartments: GovernmentDepartment[];
  sections: Section[];
  divisions: Division[];
  subDivisions: SubDivision[];
  referenceCodes: ReferenceCode[];
  auditLogs: AuditLog[];
  shifts: Shift[];
  holidays: Holiday[];

  // Session settings
  currentCompanyId: string;
  currentUserId: string;
  currentWorkspace: string;
  theme: 'light' | 'dark';
  language: string;

  // Actions
  setCompanyId: (id: string) => void;
  setUserId: (id: string) => void;
  setWorkspace: (ws: string) => void;
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;

  // CRUD Actions
  addRecord: (table: string, data: any) => any;
  updateRecord: (table: string, id: string, data: any) => void;
  deleteRecord: (table: string, id: string) => void;
  addAuditLog: (module: string, recordId: string, action: string, oldValue?: any, newValue?: any) => void;
}

import {
  initialCompanies,
  initialBranches,
  initialDepartments,
  initialTeams,
  initialDesignations,
  initialCostCenters,
  initialUsers,
  initialRoles,
  initialPermissionGroups,
  initialPermissions,
  initialEmployees,
  initialAttendances,
  initialLeaves,
  initialSalaries,
  initialCustomers,
  initialContactPersons,
  initialCommunicationHistories,
  initialGovernmentDepartments,
  initialSections,
  initialDivisions,
  initialSubDivisions,
  initialTenderRequests,
  initialTenders,
  initialShifts,
  initialHolidays,
  initialReferenceCodes,
  initialAuditLogs
} from '../constants';

// Combine into Zustand store
export const useERPStore = create<ERPStore>((set) => ({
  companies: initialCompanies,
  branches: initialBranches,
  departments: initialDepartments,
  teams: initialTeams,
  designations: initialDesignations,
  costCenters: initialCostCenters,
  users: initialUsers,
  roles: initialRoles,
  permissionGroups: initialPermissionGroups,
  permissions: initialPermissions,
  employees: initialEmployees,
  attendances: initialAttendances,
  leaves: initialLeaves,
  salaries: initialSalaries,
  customers: initialCustomers,
  contactPersons: initialContactPersons,
  communicationHistories: initialCommunicationHistories,
  tenders: initialTenders,
  tenderRequests: initialTenderRequests,
  governmentDepartments: initialGovernmentDepartments,
  sections: initialSections,
  divisions: initialDivisions,
  subDivisions: initialSubDivisions,
  referenceCodes: initialReferenceCodes,
  auditLogs: initialAuditLogs,
  shifts: initialShifts,
  holidays: initialHolidays,

  // Selected states
  currentCompanyId: 'comp-1',
  currentUserId: 'user-1',
  currentWorkspace: 'Default Workspace',
  theme: 'light',
  language: 'English',

  setCompanyId: (id) => set({ currentCompanyId: id }),
  setUserId: (id) => set({ currentUserId: id }),
  setWorkspace: (ws) => set({ currentWorkspace: ws }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setLanguage: (lang) => set({ language: lang }),

  addAuditLog: (module, recordId, action, oldValue = null, newValue = null) => {
    const newLog: AuditLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      userId: useERPStore.getState().currentUserId,
      module,
      recordId,
      action,
      oldValue,
      newValue,
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome Agentic UI',
      createdAt: new Date().toISOString()
    };
    set((state) => ({ auditLogs: [newLog, ...state.auditLogs] }));
  },

  addRecord: (table, data) => {
    const id = `${table.toLowerCase().slice(0, 3)}-${Math.random().toString(36).substr(2, 9)}`;
    const newRecord = {
      ...data,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set((state: any) => {
      const records = state[table] || [];
      const updatedList = [newRecord, ...records];
      
      // Auto-trigger reference code generator if we are adding a Tender
      let updatedReferenceCodes = state.referenceCodes;
      if (table === 'tenders') {
        const sequence = (state.referenceCodes.length + 1).toString().padStart(4, '0');
        const code = `REF-${new Date().getFullYear()}-${sequence}`;
        newRecord.tenderCode = code;

        const newRefCodeRecord: ReferenceCode = {
          id: `ref-code-${Math.random().toString(36).substr(2, 9)}`,
          tenderId: id,
          oldReferenceCode: null,
          newReferenceCode: code,
          actionType: ReferenceCodeAction.GENERATED,
          actionReason: 'Automatic code generation on tender registration',
          actionBy: state.users.find((u: any) => u.id === state.currentUserId)?.name || 'System',
          createdAt: new Date().toISOString()
        };
        updatedReferenceCodes = [newRefCodeRecord, ...state.referenceCodes];
      }

      return {
        [table]: updatedList,
        referenceCodes: updatedReferenceCodes
      };
    });

    useERPStore.getState().addAuditLog(table, id, 'CREATE', null, data);
    return newRecord;
  },

  updateRecord: (table, id, data) => {
    let oldRecord: any = null;
    set((state: any) => {
      const records = state[table] || [];
      const index = records.findIndex((r: any) => r.id === id);
      if (index === -1) return {};

      oldRecord = records[index];
      const newRecord = {
        ...oldRecord,
        ...data,
        updatedAt: new Date().toISOString()
      };

      const updatedList = [...records];
      updatedList[index] = newRecord;

      return { [table]: updatedList };
    });

    useERPStore.getState().addAuditLog(table, id, 'UPDATE', oldRecord, data);
  },

  deleteRecord: (table, id) => {
    let oldRecord: any = null;
    set((state: any) => {
      const records = state[table] || [];
      const index = records.findIndex((r: any) => r.id === id);
      if (index === -1) return {};

      oldRecord = records[index];
      const updatedList = records.filter((r: any) => r.id !== id);

      return { [table]: updatedList };
    });

    useERPStore.getState().addAuditLog(table, id, 'DELETE', oldRecord, null);
  }
}));
