import axios from 'axios';
import { useAuthStore } from '@/store/auth.store';
import { toast } from 'react-hot-toast';

let isLastRequestForbidden = false;

const originalToastError = toast.error;
(toast as any).error = (message: any, options: any) => {
  if (isLastRequestForbidden) {
    return originalToastError("You do not have enough permissions to perform this operation.", options);
  }
  return originalToastError(message, options);
};

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        useAuthStore.getState().logout();
      }
    }
    if (error.response?.status === 403) {
      isLastRequestForbidden = true;
      setTimeout(() => {
        isLastRequestForbidden = false;
      }, 300);
    }
    return Promise.reject(error);
  }
);
