import React, { createContext, useContext } from 'react';
import { useERPStore } from '@/store/erpStore';

interface PermissionContextType {
  hasPermission: (permissionCode: string) => boolean;
  permissions: string[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const rawPermissions = useERPStore(state => state.permissions);
  const permissions = React.useMemo(() => rawPermissions.map(p => p.code), [rawPermissions]);

  const hasPermission = (permissionCode: string) => {
    // In our simulated dashboard, we allow all admin functions
    return true;
  };

  return (
    <PermissionContext.Provider value={{ hasPermission, permissions }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
}
