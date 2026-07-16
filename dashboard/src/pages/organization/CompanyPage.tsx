import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { companiesConfig } from '@/constants/configs';

export function CompanyPage() {
  return <GenericCrudPage {...companiesConfig} />;
}

export default CompanyPage;
