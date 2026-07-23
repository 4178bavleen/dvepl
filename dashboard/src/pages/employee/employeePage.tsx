import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { employeesConfig } from '@/configs';

export function EmployeePage() {
  return <GenericCrudPage {...employeesConfig} />;
}

export default EmployeePage;
