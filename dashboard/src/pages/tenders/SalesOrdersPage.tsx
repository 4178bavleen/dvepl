import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { salesOrdersConfig } from '@/configs';

export function SalesOrdersPage() {
  return <GenericCrudPage {...salesOrdersConfig} />;
}

export default SalesOrdersPage;
