import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { boqsConfig } from '@/configs';

export function BoqsPage() {
  return <GenericCrudPage {...boqsConfig} />;
}

export default BoqsPage;
