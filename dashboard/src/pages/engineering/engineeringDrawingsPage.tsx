import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { engineeringDrawingsConfig } from '@/configs';

export function EngineeringDrawingsPage() {
  return <GenericCrudPage {...engineeringDrawingsConfig} />;
}

export default EngineeringDrawingsPage;
