import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { boqsConfig } from '@/configs';

export function BoqsPage() {
  return <GenericCrudPage {...boqsConfig} />;
}

export default BoqsPage;
