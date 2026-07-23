import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { communicationConfig } from '@/configs';

export function CommunicationHistoryPage() {
  return <GenericCrudPage {...communicationConfig} />;
}

export default CommunicationHistoryPage;
