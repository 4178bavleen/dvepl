import { create } from 'zustand';
import { notificationApi } from '@/services/notification';
import { isAdminUser } from '@/utils/pagePermissions';

export interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  date: string;
  read: boolean;
  targetUrl: string;
}

interface NotificationStore {
  notifications: NotificationItem[];
  loading: boolean;
  fetchNotifications: (userEmail?: string, userRoles?: string[]) => Promise<void>;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
  clearNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  loading: false,

  fetchNotifications: async (userEmail, userRoles) => {
    set({ loading: true });
    try {
      // Fetch all system-wide logs by default so the admin user sees all dispatches
      const response = await notificationApi.logs.list({
        page: 1,
        limit: 10,
      });

      if (response && response.success) {
        const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
        const clearedIds = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
        
        // Filter logs so users only see notifications matching their email in the Bell dropdown
        const userLogs = response.data.filter((log: any) => {
          if (clearedIds.includes(log.id)) return false;
          if (!userEmail) return true;
          return log.recipient?.toLowerCase() === userEmail.toLowerCase();
        });

        const isAdmin = isAdminUser({ roles: userRoles || [] });

        const mapped: NotificationItem[] = userLogs.map((log: any) => {
          const createdDate = new Date(log.createdAt);
          const diffMs = Date.now() - createdDate.getTime();
          const diffMins = Math.floor(diffMs / 60000);
          const diffHours = Math.floor(diffMins / 60);
          let dateStr = "";
          
          if (diffMins < 1) dateStr = "Just now";
          else if (diffMins < 60) dateStr = `${diffMins}m ago`;
          else if (diffHours < 24) dateStr = `${diffHours}h ago`;
          else dateStr = createdDate.toLocaleDateString();

          // Determine target URL dynamically
          let targetUrl = "/";
          const subject = (log.subject || "").toLowerCase();
          const message = (log.message || "").toLowerCase();
          const eventCode = (log.eventCode || "").toUpperCase();

          if (eventCode.includes("TASK") || subject.includes("task") || message.includes("task")) {
            targetUrl = "/tasks";
          } else if (eventCode.includes("DRAWING") || subject.includes("drawing") || message.includes("drawing")) {
            targetUrl = "/export-orders";
          } else if (eventCode === "NEW_ORDER" || subject.includes("sales order") || subject.includes("order assigned") || message.includes("sales order") || message.includes("order")) {
            targetUrl = "/tender/orders";
          } else if (eventCode.includes("LEAVE") || subject.includes("leave") || message.includes("leave")) {
            targetUrl = "/hrms/leaves";
          } else if (eventCode.includes("TENDER") || subject.includes("tender") || message.includes("tender")) {
            targetUrl = "/tender/requests";
          } else if (eventCode === "PO_CREATED" || subject.includes("purchase order") || subject.includes("po-")) {
            targetUrl = "/purchase/orders";
          } else if (eventCode === "DELIVERY_DELAYED" || subject.includes("delivery") || subject.includes("dispatch")) {
            targetUrl = "/logistics/delivery";
          } else {
            targetUrl = isAdmin ? "/settings?section=notifications" : "/";
          }

          return {
            id: log.id,
            title: log.subject || `Trigger: ${log.eventCode}`,
            desc: `To: ${log.recipient} | ${log.message}`,
            date: dateStr,
            read: readIds.includes(log.id),
            targetUrl,
          };
        });

        set({ notifications: mapped });
      }
    } catch (e) {
      console.error("Failed to fetch user notifications:", e);
    } finally {
      set({ loading: false });
    }
  },

  markAllAsRead: () => set((state) => {
    const updated = state.notifications.map(n => ({ ...n, read: true }));
    const readIds = updated.map(n => n.id);
    localStorage.setItem('read_notifications', JSON.stringify(readIds));
    return { notifications: updated };
  }),

  markAsRead: (id: string) => set((state) => {
    const readIds = JSON.parse(localStorage.getItem('read_notifications') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('read_notifications', JSON.stringify(readIds));
    }
    const updated = state.notifications.map(n => n.id === id ? { ...n, read: true } : n);
    return { notifications: updated };
  }),

  clearAll: () => set((state) => {
    const clearedIds = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
    state.notifications.forEach(n => {
      if (!clearedIds.includes(n.id)) {
        clearedIds.push(n.id);
      }
    });
    localStorage.setItem('cleared_notifications', JSON.stringify(clearedIds));
    return { notifications: [] };
  }),

  clearNotification: (id: string) => set((state) => {
    const clearedIds = JSON.parse(localStorage.getItem('cleared_notifications') || '[]');
    if (!clearedIds.includes(id)) {
      clearedIds.push(id);
      localStorage.setItem('cleared_notifications', JSON.stringify(clearedIds));
    }
    const updated = state.notifications.filter(n => n.id !== id);
    return { notifications: updated };
  }),
}));