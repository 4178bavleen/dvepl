import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { customersConfig } from '@/constants/configs';

export function CustomersPage() {
  return <GenericCrudPage {...customersConfig} />;
}

export default CustomersPage;
