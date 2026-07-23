import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { payrollConfig } from '@/configs';

export function PayrollPage() {
  return <GenericCrudPage {...payrollConfig} />;
}

export default PayrollPage;
