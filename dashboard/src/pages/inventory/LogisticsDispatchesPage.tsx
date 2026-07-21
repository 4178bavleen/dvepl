import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { dispatchesConfig } from '@/configs';

export function LogisticsDispatchesPage() {
  return <GenericCrudPage {...dispatchesConfig} />;
}

export default LogisticsDispatchesPage;
