import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="h-12 border-t border-border bg-card/20 flex items-center justify-between px-6 text-[12px] text-muted-foreground font-medium shrink-0">
      <span>&copy; {new Date().getFullYear()} DVEPL Dashboard.</span>
    </footer>
  );
};

export default Footer;
