import { 
  Employee, 
  Attendance, 
  Leave, 
  Salary, 
  EmployeeStatus, 
  AttendanceStatus, 
  LeaveStatus 
} from '../types/erp';

export const initialEmployees: Employee[] = [
  { 
    id: 'emp-1', 
    userId: 'user-1', 
    companyId: 'comp-1', 
    branchId: 'branch-1', 
    departmentId: 'dept-3', 
    teamId: null, 
    designationId: 'desg-1', 
    reportsToId: null, 
    employeeCode: 'EMP-001', 
    firstName: 'Gabriel', 
    lastName: 'Dhillon', 
    dateOfBirth: '1985-05-15T00:00:00Z', 
    gender: 'MALE', 
    dateOfJoining: '2015-06-01T00:00:00Z', 
    status: EmployeeStatus.ACTIVE, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'emp-2', 
    userId: 'user-2', 
    companyId: 'comp-1', 
    branchId: 'branch-1', 
    departmentId: 'dept-2', 
    teamId: 'team-3', 
    designationId: 'desg-3', 
    reportsToId: 'emp-1', 
    employeeCode: 'EMP-002', 
    firstName: 'Rajesh', 
    lastName: 'Kumar', 
    dateOfBirth: '1979-11-20T00:00:00Z', 
    gender: 'MALE', 
    dateOfJoining: '2018-09-10T00:00:00Z', 
    status: EmployeeStatus.ACTIVE, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  },
  { 
    id: 'emp-3', 
    userId: 'user-3', 
    companyId: 'comp-1', 
    branchId: 'branch-1', 
    departmentId: 'dept-1', 
    teamId: 'team-1', 
    designationId: 'desg-4', 
    reportsToId: 'emp-1', 
    employeeCode: 'EMP-003', 
    firstName: 'Priya', 
    lastName: 'Sharma', 
    dateOfBirth: '1992-04-03T00:00:00Z', 
    gender: 'FEMALE', 
    dateOfJoining: '2020-02-15T00:00:00Z', 
    status: EmployeeStatus.ACTIVE, 
    createdAt: new Date(2025, 0, 1).toISOString(), 
    updatedAt: new Date(2025, 0, 1).toISOString() 
  }
];

export const initialAttendances: Attendance[] = [
  { 
    id: 'att-1', 
    employeeId: 'emp-1', 
    date: new Date().toISOString().split('T')[0], 
    checkIn: new Date(new Date().setHours(9, 15, 0)).toISOString(), 
    checkOut: new Date(new Date().setHours(18, 30, 0)).toISOString(), 
    status: AttendanceStatus.PRESENT, 
    remarks: 'On time', 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'att-2', 
    employeeId: 'emp-2', 
    date: new Date().toISOString().split('T')[0], 
    checkIn: new Date(new Date().setHours(9, 30, 0)).toISOString(), 
    checkOut: new Date(new Date().setHours(18, 0, 0)).toISOString(), 
    status: AttendanceStatus.PRESENT, 
    remarks: 'Arrived at 9:30 AM', 
    createdAt: new Date().toISOString() 
  },
  { 
    id: 'att-3', 
    employeeId: 'emp-3', 
    date: new Date().toISOString().split('T')[0], 
    checkIn: null, 
    checkOut: null, 
    status: AttendanceStatus.ON_LEAVE, 
    remarks: 'Approved Casual Leave', 
    createdAt: new Date().toISOString() 
  }
];

export const initialLeaves: Leave[] = [
  { 
    id: 'leave-1', 
    employeeId: 'emp-3', 
    leaveType: 'CASUAL', 
    fromDate: new Date().toISOString().split('T')[0], 
    toDate: new Date(new Date().getTime() + 86400000).toISOString().split('T')[0], 
    reason: 'Personal family event', 
    status: LeaveStatus.APPROVED, 
    approvedById: 'emp-2', 
    createdAt: new Date(2026, 6, 12).toISOString(), 
    updatedAt: new Date(2026, 6, 12).toISOString() 
  },
  { 
    id: 'leave-2', 
    employeeId: 'emp-2', 
    leaveType: 'SICK', 
    fromDate: new Date(new Date().getTime() + 86400000 * 5).toISOString().split('T')[0], 
    toDate: new Date(new Date().getTime() + 86400000 * 7).toISOString().split('T')[0], 
    reason: 'Dental appointment & wisdom tooth removal', 
    status: LeaveStatus.PENDING, 
    approvedById: null, 
    createdAt: new Date(2026, 6, 14).toISOString(), 
    updatedAt: new Date(2026, 6, 14).toISOString() 
  }
];

export const initialSalaries: Salary[] = [
  { 
    id: 'sal-1', 
    employeeId: 'emp-1', 
    effectiveFrom: '2026-01-01', 
    basic: 150000, 
    hra: 60000, 
    allowances: 40000, 
    deductions: 20000, 
    ctc: 230000, 
    createdAt: new Date(2026, 0, 1).toISOString() 
  },
  { 
    id: 'sal-2', 
    employeeId: 'emp-2', 
    effectiveFrom: '2026-01-01', 
    basic: 85000, 
    hra: 34000, 
    allowances: 21000, 
    deductions: 10000, 
    ctc: 130000, 
    createdAt: new Date(2026, 0, 1).toISOString() 
  },
  { 
    id: 'sal-3', 
    employeeId: 'emp-3', 
    effectiveFrom: '2026-01-01', 
    basic: 55000, 
    hra: 22000, 
    allowances: 13000, 
    deductions: 5000, 
    ctc: 85000, 
    createdAt: new Date(2026, 0, 1).toISOString() 
  }
];
