import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { approvalRequestsConfig } from '@/configs';

export function ApprovalRequestsPage() {
  return <GenericCrudPage {...approvalRequestsConfig} />;
}

export default ApprovalRequestsPage;
