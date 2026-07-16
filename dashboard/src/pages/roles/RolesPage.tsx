import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { rolesConfig } from '@/constants/configs';

export function RolesPage() {
  return <GenericCrudPage {...rolesConfig} />;
}

export default RolesPage;
