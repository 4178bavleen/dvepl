import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { tenderRequestsConfig } from '@/configs';

export function TenderRequestsPage() {
  return <GenericCrudPage {...tenderRequestsConfig} />;
}

export default TenderRequestsPage;
