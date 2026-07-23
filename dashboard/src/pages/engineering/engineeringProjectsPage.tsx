import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { engineeringProjectsConfig } from '@/configs';

export function EngineeringProjectsPage() {
  return <GenericCrudPage {...engineeringProjectsConfig} />;
}

export default EngineeringProjectsPage;
