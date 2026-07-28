import { apiClient } from './axios';
import { API_ENDPOINTS } from './endpoints';

interface LoginResponse {
  success: boolean;
  token: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; company: string | null; roles: string[]; permissions: string[] };
}

export interface ProfileResponse {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: { id: string; name: string } | null;
  roles: string[];
}

export const authService = {
  
  profile: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: ProfileResponse }>(API_ENDPOINTS.auth.profile);
    return data.data;
  },
};
