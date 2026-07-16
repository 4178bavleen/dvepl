import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { holidaysConfig } from '@/constants/configs';

export function HolidaysPage() {
  return <GenericCrudPage {...holidaysConfig} />;
}

export default HolidaysPage;
