import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { invoicesConfig } from '@/configs';

export function InvoicesPage() {
  return <GenericCrudPage {...invoicesConfig} />;
}

export default InvoicesPage;
