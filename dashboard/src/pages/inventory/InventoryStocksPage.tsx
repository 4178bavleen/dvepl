import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { inventoryStocksConfig } from '@/configs';

export function InventoryStocksPage() {
  return <GenericCrudPage {...inventoryStocksConfig} />;
}

export default InventoryStocksPage;
