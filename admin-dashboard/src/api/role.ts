// Adjust the import below to match whatever axios/fetch instance @/api/user.ts uses.
// I'm assuming the same client + response shape (response.data.data) you already use for getUsers.
import axiosInstance from "./axios";

export interface PermissionDTO {
  id: string;
  name: string; // e.g. "users.create"
  module: string; // e.g. "Users" - used to group checkboxes in the UI
  description?: string;
}

export interface RoleDTO {
  id: string;
  name: string;
  description?: string;
  permissions: PermissionDTO[];
  usersCount?: number;
  createdAt: string | number;
}

// GET /roles
export const getRoles = () => axiosInstance.get("admin/role/");

// GET /roles/:id
export const getRoleById = (id: string) => axiosInstance.get(`admin/role/${id}`);

// POST /roles  { name, description, permissionIds }
export const createRole = (data: {
  name: string;
  description?: string;
  permissionIds: string[];
}) => axiosInstance.post("/admin/role/create", data);

// PATCH /roles/:id  { name, description }
export const updateRole = (
  id: string,
  data: { name?: string; description?: string },
) => axiosInstance.patch(`/roles/${id}`, data);

// DELETE /roles/:id
export const deleteRole = (id: string) => axiosInstance.delete(`/roles/${id}`);

// GET /permissions  -> full catalogue of assignable permissions
export const getPermissions = () => axiosInstance.get("/admin/permission/list");

// PUT /admin/permission/role/:id  { permissionIds } -- full sync of a role's permissions
export const updateRolePermissions = (id: string, permissionIds: string[]) =>
  axiosInstance.put(`/admin/permission/role/${id}`, { permissionIds });