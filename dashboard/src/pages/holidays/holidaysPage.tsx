import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { holidaysConfig } from '@/configs';

export function HolidaysPage() {
  return <GenericCrudPage {...holidaysConfig} />;
}

export default HolidaysPage;
