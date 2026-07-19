import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
      <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
      <p className="text-xs text-muted-foreground font-semibold">
        The page you are looking for does not exist.
      </p>
      <Link to="/">
        <Button
          variant="default"
          size="sm"
          className="h-9 px-4 text-xs font-semibold bg-primary text-white"
        >
          Go to Dashboard
        </Button>
      </Link>
    </div>
  );
}
