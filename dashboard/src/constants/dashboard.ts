// src/constants/dashboard.ts
// Single source of truth for all static/mock data used in DashboardOverview

export const initialDashboardTasks = [
  { id: 1, text: 'Review specs for Central Railway Bid', checked: false },
  { id: 2, text: 'Process salary payouts for Pune Plant', checked: true },
  { id: 3, text: 'Approve Priya Sharma leave application', checked: false },
  { id: 4, text: 'Complete onboarding for Gabriel Dhillon', checked: false },
];

export const attendanceTrendData = [
  { name: 'Mon', Present: 92, Absent: 8 },
  { name: 'Tue', Present: 95, Absent: 5 },
  { name: 'Wed', Present: 96, Absent: 4 },
  { name: 'Thu', Present: 94, Absent: 6 },
  { name: 'Fri', Present: 90, Absent: 10 },
];

export const revenueData = [
  { month: 'Jan', Revenue: 450000 },
  { month: 'Feb', Revenue: 520000 },
  { month: 'Mar', Revenue: 490000 },
  { month: 'Apr', Revenue: 610000 },
  { month: 'May', Revenue: 580000 },
  { month: 'Jun', Revenue: 680000 },
  { month: 'Jul', Revenue: 720000 },
];
