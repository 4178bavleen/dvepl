import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { warehousesConfig } from '@/configs';

export function WarehousesPage() {
  return <GenericCrudPage {...warehousesConfig} />;
}

export default WarehousesPage;
