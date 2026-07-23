import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { companiesConfig } from '@/configs';

export function CompanyPage() {
  return <GenericCrudPage {...companiesConfig} />;
}

export default CompanyPage;
