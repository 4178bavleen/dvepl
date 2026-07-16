import { 
  Company, 
  Branch, 
  Department, 
  Team, 
  Designation, 
  CostCenter, 
  Shift, 
  Holiday 
} from '../types/erp';

export const initialCompanies: Company[] = [
  { 
    id: 'comp-1', 
    name: 'Dhillon Valved Engineering Pvt Ltd (DVEPL)', 
    gst: '27AAAAA1111A1Z1', 
    pan: 'AAAAA1111A', 
    email: 'info@dvepl.com', 
    phone: '+91 22 5555 1234', 
    address: 'Plot 42, MIDC Industrial Area, Mumbai, MH, 400001', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'comp-2', 
    name: 'DVEPL Infrastructure Division', 
    gst: '27BBBBB2222B2Z2', 
    pan: 'BBBBB2222B', 
    email: 'infra@dvepl.com', 
    phone: '+91 22 5555 5678', 
    address: 'Building B, Technopark, Pune, MH, 411001', 
    isActive: true, 
    createdAt: new Date(2025, 3, 1).toISOString(), 
    updatedAt: new Date(2025, 3, 1).toISOString() 
  }
];

export const initialBranches: Branch[] = [
  { 
    id: 'branch-1', 
    companyId: 'comp-1', 
    name: 'Mumbai HQ', 
    code: 'B-MUM-HQ', 
    address: 'Plot 42, MIDC, Mumbai', 
    city: 'Mumbai', 
    state: 'Maharashtra', 
    pincode: '400001', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'branch-2', 
    companyId: 'comp-1', 
    name: 'Pune Manufacturing Plant', 
    code: 'B-PUN-MFG', 
    address: 'Chakan Industrial Phase 2, Pune', 
    city: 'Pune', 
    state: 'Maharashtra', 
    pincode: '410501', 
    isActive: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  },
  { 
    id: 'branch-3', 
    companyId: 'comp-2', 
    name: 'Delhi Regional Office', 
    code: 'B-DEL-RO', 
    address: 'Connaught Place, New Delhi', 
    city: 'Delhi', 
    state: 'Delhi', 
    pincode: '110001', 
    isActive: true, 
    createdAt: new Date(2025, 3, 1).toISOString(), 
    updatedAt: new Date(2025, 3, 1).toISOString() 
  }
];

export const initialDepartments: Department[] = [
  { 
    id: 'dept-1', 
    branchId: 'branch-1', 
    name: 'Sales & Marketing', 
    code: 'D-MUM-SM', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'dept-2', 
    branchId: 'branch-1', 
    name: 'Human Resources', 
    code: 'D-MUM-HR', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'dept-3', 
    branchId: 'branch-1', 
    name: 'Finance & Accounts', 
    code: 'D-MUM-FI', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'dept-4', 
    branchId: 'branch-2', 
    name: 'Production Control', 
    code: 'D-PUN-PC', 
    isActive: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  },
  { 
    id: 'dept-5', 
    branchId: 'branch-2', 
    name: 'Quality Assurance', 
    code: 'D-PUN-QA', 
    isActive: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  }
];

export const initialTeams: Team[] = [
  { 
    id: 'team-1', 
    departmentId: 'dept-1', 
    name: 'Tender & Bidding', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'team-2', 
    departmentId: 'dept-1', 
    name: 'Corporate Sales', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'team-3', 
    departmentId: 'dept-2', 
    name: 'Recruitment & Onboarding', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'team-4', 
    departmentId: 'dept-4', 
    name: 'Machining Line A', 
    isActive: true, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  }
];

export const initialDesignations: Designation[] = [
  { 
    id: 'desg-1', 
    title: 'Managing Director', 
    level: 10, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'desg-2', 
    title: 'General Manager - Operations', 
    level: 8, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'desg-3', 
    title: 'HR Manager', 
    level: 7, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'desg-4', 
    title: 'Senior Proposal Engineer', 
    level: 6, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'desg-5', 
    title: 'Quality Lead Specialist', 
    level: 5, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'desg-6', 
    title: 'Sales Representative', 
    level: 3, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialCostCenters: CostCenter[] = [
  { 
    id: 'cc-1', 
    companyId: 'comp-1', 
    departmentId: 'dept-1', 
    code: 'CC-MUM-SALES', 
    name: 'Sales Marketing HQ', 
    budget: 1500000.00, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'cc-2', 
    companyId: 'comp-1', 
    departmentId: 'dept-4', 
    code: 'CC-PUN-PROD', 
    name: 'Pune Manufacturing Plant Cost Center', 
    budget: 8500000.00, 
    createdAt: new Date(2025, 1, 1).toISOString(), 
    updatedAt: new Date(2025, 1, 1).toISOString() 
  },
  { 
    id: 'cc-3', 
    companyId: 'comp-1', 
    departmentId: 'dept-2', 
    code: 'CC-MUM-HR', 
    name: 'Human Resources Overhead', 
    budget: 450000.00, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialShifts: Shift[] = [
  { 
    id: 'shift-1', 
    name: 'Day Production Shift', 
    startTime: '09:00', 
    endTime: '18:00', 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'shift-2', 
    name: 'Night Assembly Shift', 
    startTime: '21:00', 
    endTime: '06:00', 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialHolidays: Holiday[] = [
  { id: 'hol-1', name: "New Year's Day", date: '2026-01-01T00:00:00.000Z', type: 'NATIONAL' },
  { id: 'hol-2', name: 'Independence Day', date: '2026-08-15T00:00:00.000Z', type: 'NATIONAL' },
  { id: 'hol-3', name: 'Republic Day', date: '2026-01-26T00:00:00.000Z', type: 'NATIONAL' }
];
