import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { purchaseRequestsConfig } from '@/configs';

export function PurchaseRequestsPage() {
  return <GenericCrudPage {...purchaseRequestsConfig} />;
}

export default PurchaseRequestsPage;
