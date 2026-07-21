import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { teamsConfig } from '@/configs';

export function TeamPage() {
  return <GenericCrudPage {...teamsConfig} />;
}

export default TeamPage;
