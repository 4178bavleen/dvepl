import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { stockTransfersConfig } from '@/configs';

export function StockTransfersPage() {
  return <GenericCrudPage {...stockTransfersConfig} />;
}

export default StockTransfersPage;
