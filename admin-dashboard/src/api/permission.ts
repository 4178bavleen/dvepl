import  axiosInstance from "./axios";

export interface PermissionDTO {
  id: string;
  code: string;
  description?: string;
  groupId?: string | null;
  groupName?: string | null;
}

export interface PermissionGroupDTO {
  id: string;
  name: string;
  description?: string;
  permissions: {
    id: string;
    code: string;
    description?: string;
  }[];
}

// GET /admin/permission/list -> catalog grouped by module
export const getPermissionGroups = () =>
  axiosInstance.get("/admin/permission-group/");


export const getPermissions = () =>
  axiosInstance.get("/admin/permission/list");
// POST /admin/permission
export const createPermission = (data: {
  code: string;
  description?: string;
  groupId?: string | null;
}) => axiosInstance.post("/admin/permission", data);

// PATCH /admin/permission/:id
export const updatePermission = (
  id: string,
  data: { code?: string; description?: string; groupId?: string | null },
) => axiosInstance.patch(`/admin/permission/${id}`, data);

// DELETE /admin/permission/:id  (pass force=true to cascade-remove from roles/users)
export const deletePermission = (id: string, force = false) =>
  axiosInstance.delete(`/admin/permission/${id}`, { params: { force } });

// Flattens the grouped /list response into a single array — convenient for
// tables, search, and the role permission-picker, which don't need the grouping.

export function flattenPermissionGroups(
  groups: PermissionGroupDTO[],
): PermissionDTO[] {
  return groups.flatMap((group) =>
    group.permissions.map((permission) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description,
      groupId: group.id,
      groupName: group.name,
    })),
  );
}