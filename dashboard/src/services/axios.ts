import axios from 'axios';
import { useERPStore } from '@/store/erpStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/admin',
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Inject active companyId into the query parameters for all requests
    const companyId = useERPStore.getState().currentCompanyId;
    if (companyId) {
      config.params = {
        companyId,
        ...config.params,
      };
    }

    return config;
  },
  (error) => Promise.reject(error)
);
