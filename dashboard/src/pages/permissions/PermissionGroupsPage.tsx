import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { permissionGroupsConfig } from '@/constants/configs';

export function PermissionGroupsPage() {
  return <GenericCrudPage {...permissionGroupsConfig} />;
}

export default PermissionGroupsPage;
