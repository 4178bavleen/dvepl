import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { teamsConfig } from '@/configs';

export function TeamPage() {
  return <GenericCrudPage {...teamsConfig} />;
}

export default TeamPage;
