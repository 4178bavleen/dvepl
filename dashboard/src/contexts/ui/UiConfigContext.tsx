import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SidebarItem } from '@/constants/sidebar';

// Types ----------------------------------------------------------
export interface NavLink {
  label: string;
  path: string;
}

export interface FooterLink {
  label: string;
  href: string;
}

export interface UiConfig {
  readonly sidebarItems: readonly SidebarItem[];
  readonly navLinks: readonly NavLink[];
  readonly footerLinks: readonly FooterLink[];
  readonly fallback: {
    readonly title: string;
    readonly message: string;
    readonly ctaLabel: string;
    readonly ctaPath: string;
  };
}

// Unified UI config source
import { defaultUiConfig } from '@/constants/uiConfig';

// Use the imported config as the initial state
const defaultConfig: UiConfig = defaultUiConfig;

// Context --------------------------------------------------------
const UiConfigContext = createContext<{ config: UiConfig; setConfig: React.Dispatch<React.SetStateAction<UiConfig>> } | undefined>(undefined);

export const UiConfigProvider = ({ children }: { children: ReactNode }) => {
  const [config, setConfig] = useState<UiConfig>(defaultConfig);
  return (
    <UiConfigContext.Provider value={{ config, setConfig }}>
      {children}
    </UiConfigContext.Provider>
  );
};

export const useUiConfig = () => {
  const ctx = useContext(UiConfigContext);
  if (!ctx) throw new Error('useUiConfig must be used within UiConfigProvider');
  return ctx;
};
