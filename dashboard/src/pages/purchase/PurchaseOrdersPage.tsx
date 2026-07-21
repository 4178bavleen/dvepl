import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { purchaseOrdersConfig } from '@/configs';

export function PurchaseOrdersPage() {
  return <GenericCrudPage {...purchaseOrdersConfig} />;
}

export default PurchaseOrdersPage;
