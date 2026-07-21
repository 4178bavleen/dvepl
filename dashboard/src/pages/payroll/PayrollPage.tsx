import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { payrollConfig } from '@/configs';

export function PayrollPage() {
  return <GenericCrudPage {...payrollConfig} />;
}

export default PayrollPage;
