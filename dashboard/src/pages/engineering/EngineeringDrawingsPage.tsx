import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { engineeringDrawingsConfig } from '@/configs';

export function EngineeringDrawingsPage() {
  return <GenericCrudPage {...engineeringDrawingsConfig} />;
}

export default EngineeringDrawingsPage;
