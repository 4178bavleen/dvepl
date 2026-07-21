import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { shiftsConfig } from '@/configs';

export function ShiftsPage() {
  return <GenericCrudPage {...shiftsConfig} />;
}

export default ShiftsPage;
