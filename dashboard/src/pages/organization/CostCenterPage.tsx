import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { costCentersConfig } from '@/constants/configs';

export function CostCenterPage() {
  return <GenericCrudPage {...costCentersConfig} />;
}

export default CostCenterPage;
