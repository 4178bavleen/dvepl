import axiosInstance from "./axios";

export interface Team {
  id: string;
  departmentId: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamPayload {
  departmentId: string;
  name: string;
}

export interface UpdateTeamPayload {
  departmentId?: string;
  name?: string;
  isActive?: boolean;
}

// GET All Teams
export const getTeams = () =>
  axiosInstance.get("admin/team/read");

// GET Team By ID
export const getTeamById = (id: string) =>
  axiosInstance.get(`admin/team/read/${id}`);

// CREATE Team
export const createTeam = (data: CreateTeamPayload) =>
  axiosInstance.post("admin/team/create", data);

// UPDATE Team
export const updateTeam = (
  id: string,
  data: UpdateTeamPayload
) => axiosInstance.put(`admin/team/update/${id}`, data);

// DELETE Team
export const deleteTeam = (id: string) =>
  axiosInstance.delete(`admin/team/delete/${id}`);