import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { workOrdersConfig } from '@/configs';

export function WorkOrdersPage() {
  return <GenericCrudPage {...workOrdersConfig} />;
}

export default WorkOrdersPage;
