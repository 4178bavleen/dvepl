import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useERPStore } from '@/store/erpStore';
import { toast } from 'react-hot-toast';

const getRequiredPermission = (pathname: string): string | null => {
  // exact matches
  if (pathname === '/profile') return null;
  if (pathname === '/') return 'dashboard';
  
  if (pathname.startsWith('/finance')) return 'finance';
  if (pathname.startsWith('/settings/custom-fields')) return 'custom_fields';
  if (pathname.startsWith('/settings/recycle-bin')) return 'recycle_bin';
  if (pathname.startsWith('/settings/notifications')) return 'notifications';
  if (pathname.startsWith('/settings')) return 'settings';
  if (pathname.startsWith('/export-orders')) return 'export_orders';

  const routePermissionMap: Record<string, string> = {
    '/organization/companies': 'companies',
    '/organization/branches': 'branches',
    '/organization/departments': 'departments',
    '/organization/teams': 'teams',
    '/organization/designations': 'designations',
    '/organization/cost-centers': 'cost_centers',
    '/hrms/employees': 'employees',
    '/hrms/attendance': 'attendance',
    '/hrms/leaves': 'leaves',
    '/hrms/holidays': 'holidays',
    '/hrms/shifts': 'shift_management',
    '/hrms/payroll': 'payroll',
    '/hrms/documents': 'documents',
    '/hrms/tasks': 'tasks',
    '/crm/customers': 'customers',
    '/crm/contacts': 'contacts',
    '/crm/communication': 'communication',
    '/tender/requests': 'tender_requests',
    '/tender/tenders': 'tenders',
    '/tender/government': 'government_departments',
    '/tender/sections': 'sections',
    '/tender/divisions': 'divisions',
    '/tender/subdivisions': 'sub_divisions',
    '/tender/reference-codes': 'reference_codes',
    '/tender/clarifications': 'technical_clarifications',
    '/tender/quotations': 'quotations',
    '/tender/orders': 'orders',
    '/purchase/vendors': 'vendors',
    '/tender/boqs': 'boqs',
    '/security/roles': 'roles',
    '/security/approval-requests': 'approval_requests',
    '/engineering/projects': 'engineering_projects',
    '/engineering/drawings': 'engineering_drawings',
    '/engineering/boms': 'boms',
    '/material/materials': 'materials',
    '/material/categories': 'material_categories',
    '/purchase/requests': 'purchase_requests',
    '/purchase/orders': 'orders',
    '/inventory/warehouses': 'inventory',
    '/inventory/stocks': 'inventory',
    '/inventory/transfers': 'inventory',
    '/logistics/dispatches': 'inventory',
    '/logistics/delivery': 'delivery',
    '/audit-logs': 'audit_logs',
    '/reports': 'reports'
  };

  return routePermissionMap[pathname] || null;
};

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const store = useERPStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const currentUser = store.users.find((u) => u.id === store.currentUserId) as any;

  if (currentUser) {
    const isAdmin = currentUser.role?.toLowerCase().includes('admin') || 
                    currentUser.name?.toLowerCase().includes('admin');
    if (!isAdmin) {
      const requiredPermission = getRequiredPermission(location.pathname);
      if (requiredPermission && (!Array.isArray(currentUser.pageAccess) || !currentUser.pageAccess.includes(requiredPermission))) {
        toast.error("You do not have enough permissions to perform this operation.");
        return <Navigate to="/profile" replace />;
      }
    }
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
