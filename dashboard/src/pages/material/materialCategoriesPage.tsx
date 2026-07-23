import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { materialCategoriesConfig } from '@/configs';

export function MaterialCategoriesPage() {
  return <GenericCrudPage {...materialCategoriesConfig} />;
}

export default MaterialCategoriesPage;
