import { apiClient } from './axios';

// Helper to unwrap data response
const unwrap = async <T>(request: Promise<{ data: { success: boolean; data: T; message?: string } }>) => {
  const response = await request;
  return response.data.data;
};

export const notificationApi = {
  configuration: {
    read: () => unwrap<any>(apiClient.get('/notification/configuration')),
    update: (data: any) => unwrap<any>(apiClient.put('/notification/configuration', data)),
  },
  events: {
    list: () => unwrap<any[]>(apiClient.get('/notification/event')),
    update: (id: string, data: any) => unwrap<any>(apiClient.put(`/notification/event/${id}`, data)),
  },
  templates: {
    list: (eventId?: string) => unwrap<any[]>(apiClient.get('/notification/templates', { params: eventId ? { eventId } : {} })),
    create: (data: any) => unwrap<any>(apiClient.post('/notification/templates', data)),
    update: (id: string, data: any) => unwrap<any>(apiClient.put(`/notification/templates/${id}`, data)),
    remove: (id: string) => apiClient.delete(`/notification/templates/${id}`).then(res => res.data),
  },
  recipients: {
    list: (eventId?: string) => unwrap<any[]>(apiClient.get('/notification/recipients', { params: eventId ? { eventId } : {} })),
    create: (data: any) => unwrap<any>(apiClient.post('/notification/recipients', data)),
    update: (id: string, data: any) => unwrap<any>(apiClient.put(`/notification/recipients/${id}`, data)),
    remove: (id: string) => apiClient.delete(`/notification/recipients/${id}`).then(res => res.data),
  },
  logs: {
    list: (params?: any) => apiClient.get('/notification/logs', { params }).then(res => res.data),
  },
  test: {
    sendEmail: (to: string) => apiClient.post('/notification/test/email', { to }).then(res => res.data),
  }
};
