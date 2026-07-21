import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { tendersConfig } from '@/configs';

export function TendersPage() {
  return <GenericCrudPage {...tendersConfig} />;
}

export default TendersPage;
