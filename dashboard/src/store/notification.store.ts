import { create } from 'zustand';

interface NotificationItem {
  id: string;
  title: string;
  desc: string;
  date: string;
  read: boolean;
}

interface NotificationStore {
  notifications: NotificationItem[];
  addNotification: (title: string, desc: string) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [
    { id: '1', title: 'New Tender Request Assigned', desc: 'Central Railway Valve Supply needs review', date: '5m ago', read: false },
    { id: '2', title: 'Leave Approved', desc: 'Priya Sharma leave approved by Rajesh', date: '2h ago', read: false },
    { id: '3', title: 'Audit Alert', desc: 'Role permissions modified for HR Manager', date: '1d ago', read: true },
  ],
  addNotification: (title, desc) => set((state) => ({
    notifications: [
      { id: Math.random().toString(), title, desc, date: 'Just now', read: false },
      ...state.notifications
    ]
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, read: true }))
  })),
}));
