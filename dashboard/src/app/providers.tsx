import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { PermissionProvider } from '@/contexts/PermissionContext';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PermissionProvider>
          <ThemeProvider>
            <TooltipProvider>
              {children}
              <Toaster position="top-right" toastOptions={{ style: { fontSize: '12px' } }} />
            </TooltipProvider>
          </ThemeProvider>
        </PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
