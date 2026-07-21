import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { expensesConfig } from '@/configs';

export function ExpensesPage() {
  return <GenericCrudPage {...expensesConfig} />;
}

export default ExpensesPage;
