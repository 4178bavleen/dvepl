import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { costCentersConfig } from '@/configs';

export function CostCenterPage() {
  return <GenericCrudPage {...costCentersConfig} />;
}

export default CostCenterPage;
