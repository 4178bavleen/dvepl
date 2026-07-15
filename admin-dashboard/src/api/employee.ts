import axiosInstance from "./axios";
// Sample API layer — swap paths once your real employee routes are wired up.


// export interface ListEmployeesParams {
//   branchId?: string;
//   departmentId?: string;
//   teamId?: string;
// }

// export const employeeApi = {
//   list: async (companyId: string, params?: ListEmployeesParams) => {
//     const res = await apiClient.get<ApiResponse<Employee[]>>(`${BASE}/read`, {
//       params: { companyId, ...params },
//     });
//     return res.data.data;
//   },

//   create: async (companyId: string, payload: CreateEmployeePayload) => {
//     const res = await apiClient.post<ApiResponse<Employee>>(`${BASE}/create`, { ...payload, companyId });
//     return res.data.data;
//   },

//   update: async (id: string, payload: UpdateEmployeePayload) => {
//     const res = await apiClient.patch<ApiResponse<Employee>>(`${BASE}/update/${id}`, payload);
//     return res.data.data;
//   },

//   delete: async (id: string) => {
//     await apiClient.delete(`${BASE}/delete/${id}`);
//   },
// };