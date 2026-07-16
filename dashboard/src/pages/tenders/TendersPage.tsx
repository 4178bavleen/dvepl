import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { tendersConfig } from '@/constants/configs';

export function TendersPage() {
  return <GenericCrudPage {...tendersConfig} />;
}

export default TendersPage;
