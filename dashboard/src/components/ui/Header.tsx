import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type Company = { id: string; name: string };

// Flexible type — accepts both the local User store type and ProfileResponse
type CurrentUser = {
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
} | null | undefined;

export type HeaderProps = {
  store: {
    theme: string;
    language: string;
    currentCompanyId: string;
    toggleTheme: () => void;
    setCompanyId: (id: string) => void;
    setLanguage: (lang: string) => void;
  };
  companies: Company[];
  currentUser: CurrentUser;
  t: (key: string) => string;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (v: boolean) => void;
  isProfileOpen: boolean;
  setIsProfileOpen: (v: boolean) => void;
  setIsMobileSidebarOpen: (v: boolean) => void;
  setIsCommandPaletteOpen: (v: boolean) => void;
  logout: () => void;
  navigate: (path: string) => void;
};

const Header: React.FC<HeaderProps> = ({
  store,
  companies,
  currentUser,
  t,
  isNotificationOpen,
  setIsNotificationOpen,
  isProfileOpen,
  setIsProfileOpen,
  setIsMobileSidebarOpen,
  setIsCommandPaletteOpen,
  logout,
  navigate,
}) => {
  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="md:hidden p-0 h-8 w-8 hover:bg-muted"
          onClick={() => setIsMobileSidebarOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Company / Workspace Switcher */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={store.currentCompanyId}
              onChange={(e) => {
                store.setCompanyId(e.target.value);
                toast.success(`Switched active enterprise.`);
              }}
              className="bg-muted/80 text-foreground border border-border rounded-lg text-xs font-semibold py-1.5 pl-2.5 pr-8 outline-none h-8 cursor-pointer hover:bg-muted transition-colors appearance-none max-w-[110px] sm:max-w-[180px] truncate"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-2.5 h-3 w-3 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Right Side Options */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar — triggers command palette */}
        <div
          onClick={() => setIsCommandPaletteOpen(true)}
          className="relative hidden md:flex items-center bg-muted/80 hover:bg-muted border border-border rounded-lg px-2.5 py-1.5 h-8 text-xs text-muted-foreground cursor-pointer w-48 transition-all duration-200 hover:border-muted-foreground/35 select-none"
        >
          <Search className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <span>{t('Search...')}</span>
          <span className="ml-auto font-mono text-[9px] bg-card border border-border px-1 py-0.5 rounded leading-none">Ctrl+K</span>
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={store.toggleTheme}
          className="h-8 w-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
        >
          {store.theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {/* Notification Center */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="h-8 w-8 p-0 hover:bg-muted relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1.5 h-1.5 w-1.5 bg-destructive rounded-full" />
          </Button>

          <AnimatePresence>
            {isNotificationOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2.5 w-80 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden"
                >
                  <div className="p-3 border-b border-border bg-muted/30 font-semibold text-xs flex justify-between items-center">
                    <span>Notifications</span>
                    <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">3 New</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-border/60">
                    <div className="p-3 hover:bg-muted/40 cursor-pointer transition-colors">
                      <p className="text-xs font-bold">New Tender Request Assigned</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Central Railway Valve Supply needs review</p>
                      <span className="text-[9px] text-muted-foreground/80 mt-1 block">5m ago</span>
                    </div>
                    <div className="p-3 hover:bg-muted/40 cursor-pointer transition-colors">
                      <p className="text-xs font-bold">Leave Approved</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Priya Sharma leave approved by Rajesh</p>
                      <span className="text-[9px] text-muted-foreground/80 mt-1 block">2h ago</span>
                    </div>
                    <div className="p-3 hover:bg-muted/40 cursor-pointer transition-colors">
                      <p className="text-xs font-bold">Audit Alert</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Role permissions modified for HR Manager</p>
                      <span className="text-[9px] text-muted-foreground/80 mt-1 block">1d ago</span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <Avatar
            className="h-7 w-7 cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all duration-200"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
              {(currentUser?.name as string)?.slice(0, 2).toUpperCase() ?? 'DU'}
            </AvatarFallback>
          </Avatar>

          <AnimatePresence>
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2.5 w-48 bg-card border border-border rounded-xl shadow-lg z-50 p-1 divide-y divide-border/60"
                >
                  <div className="px-3 py-2">
                    <p className="text-xs font-bold text-foreground">{currentUser?.name as string}</p>
                    <p className="text-[9px] text-muted-foreground truncate mt-0.5">{currentUser?.email as string}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      to="/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      <span>My Settings</span>
                    </Link>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsProfileOpen(false);
                        logout();
                        navigate('/login');
                      }}
                      className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Header;
