import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { payrollConfig } from '@/constants/configs';

export function PayrollPage() {
  return <GenericCrudPage {...payrollConfig} />;
}

export default PayrollPage;
