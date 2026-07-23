import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { governmentConfig } from '@/configs';

export function GovernmentDepartmentsPage() {
  return <GenericCrudPage {...governmentConfig} />;
}

export default GovernmentDepartmentsPage;
