import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { departmentsConfig } from '@/configs';

export function DepartmentPage() {
  return <GenericCrudPage {...departmentsConfig} />;
}

export default DepartmentPage;
