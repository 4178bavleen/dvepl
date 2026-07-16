import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { divisionsConfig } from '@/constants/configs';

export function DivisionsPage() {
  return <GenericCrudPage {...divisionsConfig} />;
}

export default DivisionsPage;
