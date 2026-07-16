import React from 'react';

export default function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[500px] w-full">
      <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/65 font-bold animate-pulse">
        Initialising System
      </div>
    </div>
  );
}
