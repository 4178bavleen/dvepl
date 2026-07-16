import { apiClient } from './axios';
import type { ApiResponse } from '@/types/api';
import { API_ENDPOINTS } from './endpoints';

type RecordData = { id: string; [key: string]: unknown };
type ResourceApi<T extends RecordData> = {
  list: () => Promise<T[]>;
  create: (data: Record<string, unknown>) => Promise<T>;
  update?: (id: string, data: Record<string, unknown>) => Promise<T>;
  remove?: (id: string) => Promise<void>;
};

const unwrap = async <T>(request: Promise<{ data: ApiResponse<T> }>) => {
  const response = await request;
  return response.data.data;
};

const resource = <T extends RecordData>(paths: { list: string; create: string; update: (id: string) => string; remove?: (id: string) => string }): ResourceApi<any> => ({
  list: () => unwrap(apiClient.get<ApiResponse<T[]>>(paths.list)),
  create: (data) => unwrap(apiClient.post<ApiResponse<T>>(paths.create, data)),
  update: (id, data) => unwrap(apiClient.put<ApiResponse<T>>(paths.update(id), data)),
  ...(paths.remove ? { remove: async (id: string) => { await apiClient.delete(paths.remove!(id)); } } : {}),
});

export const organizationApi = {
  companies: resource<RecordData>(API_ENDPOINTS.organization.companies),
  branches: {
    ...resource<RecordData>(API_ENDPOINTS.organization.branches),
    update: (id: string, data: Record<string, unknown>) => unwrap(apiClient.patch<ApiResponse<RecordData>>(API_ENDPOINTS.organization.branches.update(id), data)),
  },
  departments: {
    ...resource<RecordData>(API_ENDPOINTS.organization.departments),
    update: (id: string, data: Record<string, unknown>) => unwrap(apiClient.patch<ApiResponse<RecordData>>(API_ENDPOINTS.organization.departments.update(id), data)),
  },
  teams: resource<RecordData>(API_ENDPOINTS.organization.teams),
  designations: resource<RecordData>(API_ENDPOINTS.organization.designations),
  costCenters: resource<RecordData>(API_ENDPOINTS.organization.costCenters),
};

export type { ResourceApi };
