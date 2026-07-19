import { 
  Tender, 
  TenderRequest, 
  GovernmentDepartment, 
  Section, 
  Division, 
  SubDivision, 
  ReferenceCode, 
  TenderRequestSource, 
  TenderRequestStatus, 
  TenderStatus, 
  ReferenceCodeAction 
} from '../types/erp';

export const initialGovernmentDepartments: GovernmentDepartment[] = [
  { 
    id: 'gd-1', 
    companyId: 'comp-1', 
    name: 'Military Engineer Services', 
    code: 'MES', 
    shortName: 'MES', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'gd-2', 
    companyId: 'comp-1', 
    name: 'Central Public Works Department', 
    code: 'CPWD', 
    shortName: 'CPWD', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialSections: Section[] = [
  { 
    id: 'sec-1', 
    companyId: 'comp-1', 
    departmentId: 'dept-1', 
    name: 'Zonal Engineering Wing', 
    code: 'SEC-ZEW', 
    isActive: true, 
    governmentDepartmentId: 'gd-1', 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialDivisions: Division[] = [
  { 
    id: 'div-1', 
    companyId: 'comp-1', 
    sectionId: 'sec-1', 
    name: 'Western Division', 
    code: 'DIV-WEST', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialSubDivisions: SubDivision[] = [
  { 
    id: 'sub-1', 
    companyId: 'comp-1', 
    divisionId: 'div-1', 
    name: 'Mumbai Sub-Division 1', 
    code: 'SUB-MUM1', 
    isActive: true, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialTenderRequests: TenderRequest[] = [
  { 
    id: 'tr-1', 
    companyId: 'comp-1', 
    customerId: 'cust-1', 
    assignedToId: 'user-3', 
    createdById: 'emp-3', 
    source: TenderRequestSource.EMAIL, 
    status: TenderRequestStatus.NEW, 
    title: 'Central Railway High Pressure Gate Valves Supply', 
    description: 'Request for high-performance cast carbon steel gate valves, 150 class, size range 2" to 12".', 
    estimatedValue: 1250000.00, 
    createdAt: new Date(2026, 6, 1).toISOString(), 
    updatedAt: new Date(2026, 6, 1).toISOString() 
  },
  { 
    id: 'tr-2', 
    companyId: 'comp-1', 
    customerId: 'cust-2', 
    assignedToId: 'user-3', 
    createdById: 'emp-3', 
    source: TenderRequestSource.WEBSITE, 
    status: TenderRequestStatus.QUALIFIED, 
    title: 'L&T Pipeline Project Butterfly Valves supply', 
    description: 'Requirement for triple eccentric metal seated butterfly valves for sea-water intake lines.', 
    estimatedValue: 4800000.00, 
    createdAt: new Date(2026, 6, 5).toISOString(), 
    updatedAt: new Date(2026, 6, 5).toISOString() 
  }
];

export const initialTenders: Tender[] = [
  { 
    id: 't-1', 
    companyId: 'comp-1', 
    tenderRequestId: 'tr-1', 
    customerId: 'cust-1', 
    departmentId: 'dept-1', 
    sectionId: 'sec-1', 
    divisionId: 'div-1', 
    subDivisionId: 'sub-1', 
    tenderNo: 'TND-2026-CR-089', 
    tenderCode: 'REF-2026-0001', 
    title: 'Supply and Testing of Cast Steel Gate Valves', 
    description: 'Formal public bid for CR central engineering wing. Tender code generated automatically. Scope includes production and API 598 testing.', 
    projectLocation: 'Central Railway Workshop, Kurla', 
    estimatedCost: 1250000.00, 
    publishedAt: '2026-07-02T12:00:00Z', 
    dueDate: '2026-08-15T15:00:00Z', 
    status: TenderStatus.OPEN, 
    createdById: 'user-3', 
    assignedToId: 'user-3', 
    governmentDepartmentId: 'gd-1', 
    createdAt: new Date(2026, 6, 2).toISOString(), 
    updatedAt: new Date(2026, 6, 2).toISOString() 
  },
  { 
    id: 't-2', 
    companyId: 'comp-1', 
    tenderRequestId: 'tr-2', 
    customerId: 'cust-2', 
    departmentId: 'dept-1', 
    sectionId: null, 
    divisionId: null, 
    subDivisionId: null, 
    tenderNo: 'LT-HE-PL-2026', 
    tenderCode: 'REF-2026-0002', 
    title: 'L&T Water Intake Lines Triple-Offset Butterfly Valves', 
    description: 'Seawater line butterfly valves bid submission prep. Custom dimensions and Duplex stainless steel body material required.', 
    projectLocation: 'L&T Facility, Hazira', 
    estimatedCost: 4800000.00, 
    publishedAt: '2026-07-06T10:00:00Z', 
    dueDate: '2026-08-30T17:00:00Z', 
    status: TenderStatus.IN_PROGRESS, 
    createdById: 'user-3', 
    assignedToId: 'user-2', 
    governmentDepartmentId: null, 
    createdAt: new Date(2026, 6, 6).toISOString(), 
    updatedAt: new Date(2026, 6, 6).toISOString() 
  }
];

export const initialReferenceCodes: ReferenceCode[] = [
  { 
    id: 'ref-code-1', 
    tenderId: 't-1', 
    oldReferenceCode: null, 
    newReferenceCode: 'REF-2026-0001', 
    actionType: ReferenceCodeAction.GENERATED, 
    actionReason: 'Initial setup of CR tender bid file', 
    actionBy: 'Priya Sharma', 
    createdAt: new Date(2026, 6, 2).toISOString() 
  },
  { 
    id: 'ref-code-2', 
    tenderId: 't-2', 
    oldReferenceCode: null, 
    newReferenceCode: 'REF-2026-0002', 
    actionType: ReferenceCodeAction.GENERATED, 
    actionReason: 'Initial setup of L&T tender bid file', 
    actionBy: 'Priya Sharma', 
    createdAt: new Date(2026, 6, 6).toISOString() 
  }
];
