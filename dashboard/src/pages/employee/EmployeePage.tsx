import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { employeesConfig } from '@/constants/configs';

export function EmployeePage() {
  return <GenericCrudPage {...employeesConfig} />;
}

export default EmployeePage;
