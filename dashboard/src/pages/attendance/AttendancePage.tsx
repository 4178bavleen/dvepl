import React from 'react';
import { GenericCrudPage } from '@/components/shared/GenericCrudPage';
import { attendanceConfig } from '@/configs';

export function AttendancePage() {
  return <GenericCrudPage {...attendanceConfig} />;
}

export default AttendancePage;
