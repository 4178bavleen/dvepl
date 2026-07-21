import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { productionPlansConfig } from '@/configs';

export function ProductionPlansPage() {
  return <GenericCrudPage {...productionPlansConfig} />;
}

export default ProductionPlansPage;
