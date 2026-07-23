import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { purchaseOrdersConfig } from '@/configs';

export function PurchaseOrdersPage() {
  return <GenericCrudPage {...purchaseOrdersConfig} />;
}

export default PurchaseOrdersPage;
