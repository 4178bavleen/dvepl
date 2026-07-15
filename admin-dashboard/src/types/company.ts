// Types mirroring the Prisma schema (Company -> Branch -> Department -> Team, Employee at any level)

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE' | 'TERMINATED';

export interface Company {
  id: string;
  name: string;
  gst?: string | null;
  pan?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyPayload {
  name: string;
  gst?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export type UpdateCompanyPayload = Partial<CreateCompanyPayload> & { isActive?: boolean };

export interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchPayload {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export type UpdateBranchPayload = Partial<CreateBranchPayload> & { isActive?: boolean };

export interface Department {
  id: string;
  branchId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateDepartmentPayload {
  name: string;
  code: string;
}

export type UpdateDepartmentPayload = Partial<CreateDepartmentPayload> & { isActive?: boolean };

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateTeamPayload {
  name: string;
}

export type UpdateTeamPayload = Partial<CreateTeamPayload> & { isActive?: boolean };

export interface Employee {
  id: string;
  companyId: string;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  designationId?: string | null;
  reportsToId?: string | null;
  employeeCode: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | null;
  gender?: string | null;
  dateOfJoining?: string | null;
  dateOfExit?: string | null;
  status: EmployeeStatus;
  createdAt: string;
}

export interface CreateEmployeePayload {
  employeeCode: string;
  firstName: string;
  lastName: string;
  branchId?: string | null;
  departmentId?: string | null;
  teamId?: string | null;
  dateOfJoining?: string;
  gender?: string;
  status?: EmployeeStatus;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload> & { dateOfExit?: string };