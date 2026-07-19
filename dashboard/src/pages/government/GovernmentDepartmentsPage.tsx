import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { governmentConfig } from '@/constants/configs';

export function GovernmentDepartmentsPage() {
  return <GenericCrudPage {...governmentConfig} />;
}

export default GovernmentDepartmentsPage;
