import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { designationsConfig } from '@/constants/configs';

export function DesignationPage() {
  return <GenericCrudPage {...designationsConfig} />;
}

export default DesignationPage;
