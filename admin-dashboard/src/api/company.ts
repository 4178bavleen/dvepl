import axiosInstance from "./axios";

// import {

//   UpdateCompanyPayload,
// } from "@/types/company";

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

// GET /roles
export const getCompany = () => axiosInstance.get("admin/company/read");
export const createCompany = (data: {
  name: string;
  gst?: string;
  pan?: string;
  email?: string;
  phone?: string;
  address?: string;
}) => axiosInstance.post("admin/company/create", data);

export const deleteCompany = (id: string) =>
  axiosInstance.delete(`admin/company/delete/${id}`);
export const updateCompany = (id: string) =>
  axiosInstance.put(`admin/company/update/${id}`);


