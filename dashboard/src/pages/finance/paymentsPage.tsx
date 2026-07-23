import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { paymentsConfig } from '@/configs';

export function PaymentsPage() {
  return <GenericCrudPage {...paymentsConfig} />;
}

export default PaymentsPage;
