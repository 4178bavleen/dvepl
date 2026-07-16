import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { contactsConfig } from '@/constants/configs';

export function ContactPersonsPage() {
  return <GenericCrudPage {...contactsConfig} />;
}

export default ContactPersonsPage;
