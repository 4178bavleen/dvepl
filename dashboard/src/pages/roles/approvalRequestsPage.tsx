import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { approvalRequestsConfig } from '@/configs';

export function ApprovalRequestsPage() {
  return <GenericCrudPage {...approvalRequestsConfig} />;
}

export default ApprovalRequestsPage;
