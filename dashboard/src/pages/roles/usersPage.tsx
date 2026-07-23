import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { usersConfig } from '@/configs';

export function UsersPage() {
  return <GenericCrudPage {...usersConfig} />;
}

export default UsersPage;
