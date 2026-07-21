import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { branchesConfig } from '@/configs';

export function BranchPage() {
  return <GenericCrudPage {...branchesConfig} />;
}

export default BranchPage;
