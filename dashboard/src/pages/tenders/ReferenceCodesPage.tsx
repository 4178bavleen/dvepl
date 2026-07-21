import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { referenceCodesConfig } from '@/configs';

export function ReferenceCodesPage() {
  return <GenericCrudPage {...referenceCodesConfig} />;
}

export default ReferenceCodesPage;
