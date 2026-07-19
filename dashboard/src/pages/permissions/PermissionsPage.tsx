import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { permissionsConfig } from '@/constants/configs';

export function PermissionsPage() {
  return <GenericCrudPage {...permissionsConfig} />;
}

export default PermissionsPage;
