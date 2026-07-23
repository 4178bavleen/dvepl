import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/authContext';

export function PublicRoute() {
  const { isAuthenticated } = useAuth();

  // In real dashboard, we might redirect to home if already logged in.
  // For simulation, we just render the public page directly or redirect.
  return <Outlet />;
}
