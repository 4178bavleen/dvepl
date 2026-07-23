import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { divisionsConfig } from '@/configs';

export function DivisionsPage() {
  return <GenericCrudPage {...divisionsConfig} />;
}

export default DivisionsPage;
