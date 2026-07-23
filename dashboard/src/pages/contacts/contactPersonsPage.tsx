import React from 'react';
import { GenericCrudPage } from '@/components/shared/genericCrudPage';
import { contactsConfig } from '@/configs';

export function ContactPersonsPage() {
  return <GenericCrudPage {...contactsConfig} />;
}

export default ContactPersonsPage;
