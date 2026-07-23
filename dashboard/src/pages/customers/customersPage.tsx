import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { customersConfig } from '@/configs';

export function CustomersPage() {
  return <GenericCrudPage {...customersConfig} />;
}

export default CustomersPage;
