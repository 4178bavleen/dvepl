import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { subdivisionsConfig } from '@/constants/configs';

export function SubDivisionsPage() {
  return <GenericCrudPage {...subdivisionsConfig} />;
}

export default SubDivisionsPage;
