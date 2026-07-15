import axiosInstance from "./axios";

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
  updatedAt: string;
}

export interface CreateBranchPayload {
  companyId: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface UpdateBranchPayload {
  companyId?: string;
  name?: string;
  code?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
}

// GET All Branches
export const getBranches = () =>
  axiosInstance.get("admin/branch/read");

// GET Branch By ID
export const getBranchById = (id: string) =>
  axiosInstance.get(`admin/branch/read/${id}`);

// CREATE Branch
export const createBranch = (data: CreateBranchPayload) =>
  axiosInstance.post("admin/branch/create", data);

// UPDATE Branch
export const updateBranch = (
  id: string,
  data: UpdateBranchPayload
) => axiosInstance.put(`admin/branch/update/${id}`, data);

// DELETE Branch
export const deleteBranch = (id: string) =>
  axiosInstance.delete(`admin/branch/delete/${id}`);