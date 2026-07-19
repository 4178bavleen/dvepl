import React from 'react';

export function ErrorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center bg-destructive/5 text-destructive p-8">
      {children}
    </div>
  );
}
