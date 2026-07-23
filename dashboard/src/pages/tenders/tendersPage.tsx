import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { tendersConfig } from '@/configs';

export function TendersPage() {
  return <GenericCrudPage {...tendersConfig} />;
}

export default TendersPage;
