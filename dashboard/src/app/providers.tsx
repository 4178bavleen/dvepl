import React from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './queryClient';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { ThemeProvider } from '@/contexts/themeContext';
import { AuthProvider } from '@/contexts/authContext';
import { PermissionProvider } from '@/contexts/permissionContext';

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
              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: { fontSize: '12px' }
                }}
              >
                {(t) => (
                  <ToastBar toast={t}>
                    {({ icon, message }) => (
                      <div className="flex items-center gap-2">
                        {icon}
                        <div>{message}</div>
                        {t.type !== 'loading' && (
                          <button
                            type="button"
                            onClick={() => toast.dismiss(t.id)}
                            className="ml-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
                            aria-label="Close"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    )}
                  </ToastBar>
                )}
              </Toaster>
            </TooltipProvider>
          </ThemeProvider>
        </PermissionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
