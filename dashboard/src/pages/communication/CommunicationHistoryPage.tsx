import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { communicationConfig } from '@/configs';

export function CommunicationHistoryPage() {
  return <GenericCrudPage {...communicationConfig} />;
}

export default CommunicationHistoryPage;
