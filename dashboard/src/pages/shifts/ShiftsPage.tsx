import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { shiftsConfig } from '@/constants/configs';

export function ShiftsPage() {
  return <GenericCrudPage {...shiftsConfig} />;
}

export default ShiftsPage;
