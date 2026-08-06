// src/components/ui/sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logos/dvepl-logo.png';
import mobile_logo from '@/assets/logos/dvepl.png';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from 'lucide-react';
import { useERPStore } from '@/store/erpStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUiConfig } from '@/contexts/ui/uiConfigContext';

interface SidebarProps {
  isCollapsed: boolean;
  onCollapseChange: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export default function Sidebar({
  isCollapsed,
  onCollapseChange,
  isMobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const store = useERPStore();
  const { config } = useUiConfig();
  const sidebarItems = config.sidebarItems;
  const location = useLocation();

  const t = (key: string) => {
    return key;
  };

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (secName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [secName]: !prev[secName],
    }));
  };

  const currentUser = store.users.find((u) => u.id === store.currentUserId) as any;

  // Filter sidebar items based on pageAccess
  const visibleSidebarItems = React.useMemo(() => {
    if (!currentUser || !currentUser.pageAccess) return sidebarItems;

    // Always grant full access to Admins/Super Admins
    const isAdmin = currentUser.role?.toLowerCase().includes('admin') ||
      currentUser.name?.toLowerCase().includes('admin');
    if (isAdmin) return sidebarItems;

    const mapping: Record<string, string> = {
      'dashboard': 'dashboard',
      'companies': 'companies',
      'branches': 'branches',
      'departments': 'departments',
      'teams': 'teams',
      'designations': 'designations',
      'cost_centers': 'cost_centers',
      'employees': 'employees',
      'attendance': 'attendance',
      'leaves': 'leaves',
      'holidays': 'holidays',
      'shift_management': 'shift_management',
      'payroll': 'payroll',
      'documents': 'documents',
      'tasks': 'tasks',
      'customers': 'customers',
      'contact_persons': 'contacts',
      'communication_history': 'communication',
      'orders': 'orders',
      'delivery': 'delivery',
      'vendors': 'vendors',
      'inventory': 'inventory',
      'finance': 'finance',
      'tender_requests': 'tender_requests',
      'tenders': 'tenders',
      'technical_clarifications': 'technical_clarifications',
      'government_departments': 'government_departments',
      'sections': 'sections',
      'divisions': 'divisions',
      'sub_divisions': 'sub_divisions',
      'reference_codes': 'reference_codes',
      'users': 'users',
      'roles': 'roles',
      'approval_requests': 'approval_requests',
      'reports': 'reports',
      'audit_logs': 'audit_logs',
      'custom_fields': 'custom_fields',
      'recycle_bin': 'recycle_bin',
      'settings': 'settings',
      'export_orders': 'export_orders'
    };

    return sidebarItems.filter(item => {
      const normalizedKey = item.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const key = mapping[normalizedKey] || normalizedKey;
      return currentUser.pageAccess.includes(key);
    });
  }, [currentUser, sidebarItems]);

  const sections = React.useMemo(() => {
    return Array.from(
      new Set(visibleSidebarItems.filter((i) => i.section).map((i) => i.section))
    ) as string[];
  }, [visibleSidebarItems]);

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden md:flex flex-col h-full bg-card/85 dark:bg-card/45 backdrop-blur-md border-r border-border/50 shrink-0 transition-all duration-300 ease-in-out relative ${isCollapsed ? 'w-16' : 'w-80'
          }`}
        layout
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}
      >
        <div className="h-16 flex items-center justify-between px-4 border-border/50 shrink-0">
          {!isCollapsed && (
            <Link to="/" className="flex items-center gap-2 font-bold text-md tracking-tight hover:opacity-90">
              <img src={logo} alt="DVEPL Logo" className="" />
            </Link>
          )}
          {isCollapsed && (
            <img src={mobile_logo} alt="DVEPL Logo" className="h-7 w-7 rounded-lg mx-auto" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-[18px] h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm hover:bg-muted z-50 animate-in fade-in zoom-in duration-200"
            onClick={() => onCollapseChange(!isCollapsed)}
          >
            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4 px-3 space-y-6">
          <div className="space-y-1">
            {visibleSidebarItems.filter((i) => !i.section).map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 relative group ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                    } ${active
                      ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-xs'
                      : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                    }`}
                  title={item.name}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!isCollapsed && <span>{t(item.name)}</span>}
                </Link>
              );
            })}
          </div>

          {sections.map((secName) => {
            const isSectionExpanded = !!expandedSections[secName];
            return (
              <div key={secName} className="space-y-1.5">
                {!isCollapsed && (
                  <button
                    onClick={() => toggleSection(secName)}
                    className="w-full flex items-center justify-between text-sm font-bold text-foreground uppercase tracking-wider px-3 py-1.5 hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors group cursor-pointer"
                  >
                    <span>{t(secName)}</span>
                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${!isSectionExpanded ? '-rotate-90' : ''}`} />
                  </button>
                )}
                {isCollapsed && <div className="h-px bg-border/50 my-2 mx-2" />}

                <AnimatePresence initial={false}>
                  {(!isCollapsed && isSectionExpanded) || isCollapsed ? (
                    <motion.div
                      initial={isCollapsed ? undefined : { height: 0, opacity: 0 }}
                      animate={isCollapsed ? undefined : { height: 'auto', opacity: 1 }}
                      exit={isCollapsed ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: 'easeInOut' }}
                      className="space-y-1 overflow-hidden"
                    >
                      {visibleSidebarItems.filter((i) => i.section === secName).map((item) => {
                        const active = location.pathname === item.path;
                        return (
                          <Link
                            key={item.name}
                            to={item.path || '#'}
                            className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 relative group ${isCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                              } ${active
                                ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold shadow-xs'
                                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                              }`}
                            title={item.name}
                          >
                            <item.icon className="h-4.5 w-4.5 shrink-0" />
                            {!isCollapsed && <span>{t(item.name)}</span>}
                          </Link>
                        );
                      })}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Desktop Sidebar User Profile */}
        <div className="border-t border-border/50 p-4 bg-muted/5 shrink-0">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Avatar className="h-8 w-8 shrink-0 hover:ring-2 hover:ring-primary/40 transition-all duration-200 cursor-pointer">
              <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                {currentUser?.name?.slice(0, 2).toUpperCase() || 'GD'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">{currentUser?.name}</p>
                <p className="text-[10px] text-muted-foreground font-medium truncate">{currentUser?.role || 'Team Member'}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => onMobileOpenChange(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 350, mass: 0.6 }}
              className="fixed top-0 bottom-0 left-0 w-80 bg-card/95 backdrop-blur-md border-r border-border/50 z-50 p-4 flex flex-col justify-between md:hidden shadow-2xl"
            >
              <div className="space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <span className="font-bold text-md tracking-tight">DVEPL ERP</span>
                  <Button variant="ghost" size="sm" onClick={() => onMobileOpenChange(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="space-y-6">
                  <div className="space-y-1">
                    {visibleSidebarItems.filter((i) => !i.section).map((item) => (
                      <Link
                        key={item.name}
                        to={item.path || '#'}
                        onClick={() => onMobileOpenChange(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${location.pathname === item.path
                          ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                          : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                          }`}
                      >
                        <item.icon className="h-4.5 w-4.5" />
                        <span>{t(item.name)}</span>
                      </Link>
                    ))}
                  </div>
                  {sections.map((secName) => {
                    const isSectionExpanded = !!expandedSections[secName];
                    return (
                      <div key={secName} className="space-y-1.5">
                        <button
                          onClick={() => toggleSection(secName)}
                          className="w-full flex items-center justify-between text-sm font-bold text-foreground uppercase tracking-wider px-3 py-1.5 hover:text-foreground hover:bg-muted/30 rounded-lg transition-colors group cursor-pointer"
                        >
                          <span>{t(secName)}</span>
                          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${!isSectionExpanded ? '-rotate-90' : ''}`} />
                        </button>
                        <AnimatePresence initial={false}>
                          {isSectionExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="space-y-1 overflow-hidden"
                            >
                              {visibleSidebarItems.filter((i) => i.section === secName).map((item) => (
                                <Link
                                  key={item.name}
                                  to={item.path || '#'}
                                  onClick={() => onMobileOpenChange(false)}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${location.pathname === item.path
                                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-0.5'
                                    }`}
                                >
                                  <item.icon className="h-4.5 w-4.5" />
                                  <span>{t(item.name)}</span>
                                </Link>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              </div>
              <div className="border-t border-border/50 pt-4 mt-4 flex items-center gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {currentUser?.name?.slice(0, 2).toUpperCase() || 'GD'}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium truncate">{currentUser?.role || 'Team Member'}</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
