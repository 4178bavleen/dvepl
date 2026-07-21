import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { leaveConfig } from '@/configs';

export function LeavePage() {
  return <GenericCrudPage {...leaveConfig} />;
}

export default LeavePage;
