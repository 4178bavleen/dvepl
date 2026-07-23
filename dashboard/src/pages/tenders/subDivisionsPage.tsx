import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { subdivisionsConfig } from '@/configs';

export function SubDivisionsPage() {
  return <GenericCrudPage {...subdivisionsConfig} />;
}

export default SubDivisionsPage;
