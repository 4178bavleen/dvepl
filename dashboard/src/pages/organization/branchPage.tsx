import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { branchesConfig } from '@/configs';

export function BranchPage() {
  return <GenericCrudPage {...branchesConfig} />;
}

export default BranchPage;
