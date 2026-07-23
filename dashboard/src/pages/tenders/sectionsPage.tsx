import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { sectionsConfig } from '@/configs';

export function SectionsPage() {
  return <GenericCrudPage {...sectionsConfig} />;
}

export default SectionsPage;
