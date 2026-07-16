import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { teamsConfig } from '@/constants/configs';

export function TeamPage() {
  return <GenericCrudPage {...teamsConfig} />;
}

export default TeamPage;
