import React from 'react';

export default function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[600px] w-full bg-background/50 backdrop-blur-xs">
      {/* Premium DVEPL Letter Loading Wave with Bounce Effect */}
      <div className="flex items-center gap-2 py-4">
        <span className="text-6xl font-black text-primary tracking-tighter" style={{ animation: 'letterBounce 1.4s infinite ease-in-out', animationDelay: '0s' }}>D</span>
        <span className="text-6xl font-black text-primary tracking-tighter" style={{ animation: 'letterBounce 1.4s infinite ease-in-out', animationDelay: '0.15s' }}>V</span>
        <span className="text-6xl font-black text-primary tracking-tighter" style={{ animation: 'letterBounce 1.4s infinite ease-in-out', animationDelay: '0.3s' }}>E</span>
        <span className="text-6xl font-black text-primary tracking-tighter" style={{ animation: 'letterBounce 1.4s infinite ease-in-out', animationDelay: '0.45s' }}>P</span>
        <span className="text-6xl font-black text-primary tracking-tighter" style={{ animation: 'letterBounce 1.4s infinite ease-in-out', animationDelay: '0.6s' }}>L</span>
      </div>

      {/* Decorative shimmer progress bar underneath */}
      <div className="relative mt-6 w-36 h-1 bg-muted rounded-full overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-primary w-1/2 rounded-full" 
          style={{
            animationName: 'shimmer',
            animationDuration: '1.6s',
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear'
          }} 
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes letterBounce {
          0%, 100% {
            transform: translateY(0);
            filter: drop-shadow(0 0 0 transparent);
            opacity: 0.7;
          }
          50% {
            transform: translateY(-18px);
            filter: drop-shadow(0 12px 10px rgba(59, 130, 246, 0.45));
            opacity: 1;
          }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />

      {/* Status Message */}
      <div className="mt-4 text-center">
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground/60 font-semibold animate-pulse">
          Initialising System Modules
        </p>
      </div>
    </div>
  );
}
