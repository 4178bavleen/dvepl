import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { bomsConfig } from '@/configs';

export function BomsPage() {
  return <GenericCrudPage {...bomsConfig} />;
}

export default BomsPage;
