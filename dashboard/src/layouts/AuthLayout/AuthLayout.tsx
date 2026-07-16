import React from 'react';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-muted/40">
      {children}
    </div>
  );
}
