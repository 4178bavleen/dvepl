import axiosInstance from "./axios";

export interface Department {
  id: string;
  branchId: string;
  name: string;
  code: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDepartmentPayload {
  branchId: string;
  name: string;
  code: string;
}

export interface UpdateDepartmentPayload {
  branchId?: string;
  name?: string;
  code?: string;
  isActive?: boolean;
}

// GET All Departments
export const getDepartments = () =>
  axiosInstance.get("admin/department/read");

// GET Department By ID
export const getDepartmentById = (id: string) =>
  axiosInstance.get(`admin/department/read/${id}`);

// CREATE Department
export const createDepartment = (data: CreateDepartmentPayload) =>
  axiosInstance.post("admin/department/create", data);

// UPDATE Department
export const updateDepartment = (
  id: string,
  data: UpdateDepartmentPayload
) => axiosInstance.put(`admin/department/update/${id}`, data);

// DELETE Department
export const deleteDepartment = (id: string) =>
  axiosInstance.delete(`admin/department/delete/${id}`);