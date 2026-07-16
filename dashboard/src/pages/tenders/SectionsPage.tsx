import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { sectionsConfig } from '@/constants/configs';

export function SectionsPage() {
  return <GenericCrudPage {...sectionsConfig} />;
}

export default SectionsPage;
