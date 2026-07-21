import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { inspectionsConfig } from '@/configs';

export function InspectionsPage() {
  return <GenericCrudPage {...inspectionsConfig} />;
}

export default InspectionsPage;
