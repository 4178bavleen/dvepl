import React, { createContext, useContext } from 'react';

interface PermissionContextType {
  hasPermission: (permissionCode: string) => boolean;
  permissions: string[];
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const permissions = React.useMemo(() => [] as string[], []);

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
