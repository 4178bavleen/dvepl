import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { designationsConfig } from '@/configs';

export function DesignationPage() {
  return <GenericCrudPage {...designationsConfig} />;
}

export default DesignationPage;
