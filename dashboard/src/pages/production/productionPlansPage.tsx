import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { productionPlansConfig } from '@/configs';

export function ProductionPlansPage() {
  return <GenericCrudPage {...productionPlansConfig} />;
}

export default ProductionPlansPage;
