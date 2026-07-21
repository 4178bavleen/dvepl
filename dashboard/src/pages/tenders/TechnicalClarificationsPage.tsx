import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { technicalClarificationsConfig } from '@/configs';

export function TechnicalClarificationsPage() {
  return <GenericCrudPage {...technicalClarificationsConfig} />;
}

export default TechnicalClarificationsPage;
