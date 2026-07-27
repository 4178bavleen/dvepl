// src/components/ui/sidebar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/logos/dvepl-logo.png';
import mobile_logo from '@/assets/logos/dvepl.png';
import {
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { useERPStore } from '@/store/erpStore';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useUiConfig } from '@/contexts/ui/uiConfigContext';
import { translations } from '@/constants/translations';

export default function Sidebar() {
  const store = useERPStore();
  const { config } = useUiConfig();
  const sidebarItems = config.sidebarItems;
  const location = useLocation();


  const t = (key: string) => {
    return key;
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const currentUser = store.users.find((u) => u.id === store.currentUserId);

  /* sidebar items moved to UiConfigContext */

  const sections = Array.from(
    new Set(sidebarItems.filter((i) => i.section).map((i) => i.section))
  ) as string[];

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        className={`hidden md:flex flex-col h-full bg-card border-r border-border shrink-0 transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-16' : 'w-80'
          }`}
        layout
        transition={{ type: 'spring', stiffness: 250, damping: 30 }}>
        <div className="h-16 flex items-center justify-between px-4 border-border">
          {!isSidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2 font-bold text-md tracking-tight hover:opacity-90">
              <img src={logo} alt="DVEPL Logo" className="" />
              
            </Link>
          )}
          {isSidebarCollapsed && (
            <img src={mobile_logo} alt="DVEPL Logo" className="h-7 w-7 rounded-lg" />
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute -right-3 top-[18px] h-6 w-6 rounded-full border border-border bg-background p-0 shadow-sm hover:bg-muted z-50"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-4 px-3 space-y-6">
          <div className="space-y-1">
            {sidebarItems.filter((i) => !i.section).map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                    } ${active ? 'bg-primary text-white font-semibold shadow-sm' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                    }`}
                  title={item.name}
                >
                  <item.icon className="h-4.5 w-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span>{t(item.name)}</span>}
                </Link>
              );
            })}
          </div>
          {sections.map((secName) => (
            <div key={secName} className="space-y-1.5">
              {!isSidebarCollapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3">{t(secName)}</p>
              )}
              {isSidebarCollapsed && <div className="h-px bg-border my-2 mx-2" />}
              <div className="space-y-1">
                {sidebarItems.filter((i) => i.section === secName).map((item) => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path || '#'}
                      className={`flex items-center rounded-lg text-xs font-medium transition-all duration-200 ${isSidebarCollapsed ? 'justify-center p-2' : 'gap-3 px-3 py-2'
                        } ${active ? 'bg-primary text-white font-semibold shadow-sm' : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                        }`}
                      title={item.name}
                    >
                      <item.icon className="h-4.5 w-4.5 shrink-0" />
                      {!isSidebarCollapsed && <span>{t(item.name)}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </motion.aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 20, stiffness: 350, mass: 0.5 }}
              className="fixed top-0 bottom-0 left-0 w-80 bg-card border-r border-border z-50 p-4 flex flex-col justify-between md:hidden"
            >
              <div className="space-y-6 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <span className="font-bold text-md tracking-tight">DVEPL ERP</span>
                  <Button variant="ghost" size="sm" onClick={() => setIsMobileSidebarOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <nav className="space-y-6">
                  <div className="space-y-1">
                    {sidebarItems.filter((i) => !i.section).map((item) => (
                      <Link
                        key={item.name}
                        to={item.path || '#'}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${location.pathname === item.path ? 'bg-primary text-white font-semibold' : 'text-muted-foreground'
                          }`}
                      >
                        <item.icon className="h-4.5 w-4.5" />
                        <span>{t(item.name)}</span>
                      </Link>
                    ))}
                  </div>
                  {sections.map((secName) => (
                    <div key={secName} className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3">{t(secName)}</p>
                      <div className="space-y-1">
                        {sidebarItems.filter((i) => i.section === secName).map((item) => (
                          <Link
                            key={item.name}
                            to={item.path || '#'}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium ${location.pathname === item.path ? 'bg-primary text-white font-semibold' : 'text-muted-foreground'
                              }`}
                          >
                            <item.icon className="h-4.5 w-4.5" />
                            <span>{t(item.name)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </nav>
              </div>
              <div className="border-t border-border pt-4 mt-4 flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">GD</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs font-bold text-foreground">{currentUser?.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">Super Admin</p>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
