import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { materialsConfig } from '@/configs';

export function MaterialsPage() {
  return <GenericCrudPage {...materialsConfig} />;
}

export default MaterialsPage;
