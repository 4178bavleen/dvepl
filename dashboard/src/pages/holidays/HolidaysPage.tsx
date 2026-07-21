import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { holidaysConfig } from '@/configs';

export function HolidaysPage() {
  return <GenericCrudPage {...holidaysConfig} />;
}

export default HolidaysPage;
