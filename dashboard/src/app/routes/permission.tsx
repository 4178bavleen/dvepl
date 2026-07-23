import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { usePermissions } from '@/contexts/permissionContext';

interface PermissionGateProps {
  allowedPermissions: string[];
}

export function PermissionGate({ allowedPermissions }: PermissionGateProps) {
  const { hasPermission } = usePermissions();

  const isAllowed = allowedPermissions.some(perm => hasPermission(perm));

  if (!isAllowed) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
