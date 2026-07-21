import { sidebarItems as defaultSidebar } from '@/constants/sidebar';

export const defaultUiConfig = {
  sidebarItems: defaultSidebar,
  navLinks: [], // populate later if needed
  footerLinks: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Contact', href: '/contact' },
  ],
  fallback: {
    title: '404',
    message: 'The page you are looking for does not exist.',
    ctaLabel: 'Go to Dashboard',
    ctaPath: '/',
  },
} as const;
