import React, { useState, useEffect } from 'react';
import Footer from '@/components/ui/Footer';
import Header from '@/components/ui/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X,
  FileCheck,
  Zap,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUiConfig } from '@/contexts/ui/UiConfigContext';

import { useERPStore } from '@/store/erpStore';
import { useAuth } from '@/contexts/AuthContext';
import { authService, type ProfileResponse } from '@/services/auth';
import { organizationApi } from '@/services/organization';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/ui/Sidebar';
import { translations } from '@/constants/translations';




export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = useERPStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  const t = (key: string) => {
    return key;
  };

  // Component UI States
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [headerCompanies, setHeaderCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // Sync theme with HTML tag
  useEffect(() => {
    const root = window.document.documentElement;
    if (store.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [store.theme]);

  useEffect(() => {
    let isMounted = true;
    void Promise.all([organizationApi.companies.list(), authService.profile()])
      .then(([companies, userProfile]) => {
        if (!isMounted) return;
        setHeaderCompanies(companies.map((company) => ({ id: company.id, name: String(company.name ?? '') })));
        setProfile(userProfile);
        if (userProfile.company?.id) store.setCompanyId(userProfile.company.id);
      })
      .catch(() => {
        // The page still renders with the local fallback data if the API is unavailable.
      });
    return () => { isMounted = false; };
  }, []);

  // Keyboard shortcut Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Responsive auto-collapse (when window width is under 1150px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1150) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sidebar Menu Config


  // Grouped items
  const { config } = useUiConfig();
  const sections = Array.from(new Set(config.sidebarItems.filter(i => i.section).map(i => i.section))) as string[];

  // Command palette filter
  const commandFilteredItems = config.sidebarItems.filter(item => 
    item.name.toLowerCase().includes(commandSearch.toLowerCase())
  );

  const handleCommandSelect = (path: string) => {
    navigate(path);
    setIsCommandPaletteOpen(false);
    setCommandSearch('');
  };

  const handleQuickAction = (action: string) => {
    setIsCommandPaletteOpen(false);
    setCommandSearch('');
    if (action === 'theme') {
      store.toggleTheme();
      toast.success(`Switched to ${store.theme === 'dark' ? 'light' : 'dark'} mode.`);
    } else {
      toast.success(`Action triggered: ${action}`);
    }
  };

  const companies = headerCompanies.length > 0 ? headerCompanies : store.companies;
  const currentUser = profile ?? store.users.find(u => u.id === store.currentUserId);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      
      {/* 1. COLLAPSIBLE SIDEBAR */}
      <Sidebar />

      {/* 2. MAIN LAYOUT CONTAINER */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* TOP NAVBAR */}
        <Header
          store={store}
          companies={companies}
          currentUser={currentUser as any}
          t={t}
          isNotificationOpen={isNotificationOpen}
          setIsNotificationOpen={setIsNotificationOpen}
          isProfileOpen={isProfileOpen}
          setIsProfileOpen={setIsProfileOpen}
          setIsMobileSidebarOpen={setIsMobileSidebarOpen}
          setIsCommandPaletteOpen={setIsCommandPaletteOpen}
          logout={logout}
          navigate={navigate}
        />

        {/* MAIN PAGE BODY */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 w-full min-w-0">
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
        
        {/* FOOTER */}
        <Footer />

      </div>

      {/* 3. COMMAND PALETTE MODAL (Ctrl + K) */}
      <AnimatePresence>
        {isCommandPaletteOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCommandPaletteOpen(false)}
              className="fixed inset-0 bg-black z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -40 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg bg-card border border-border shadow-2xl rounded-2xl z-50 overflow-hidden p-0"
            >
              {/* Search Bar */}
              <div className="flex items-center border-b border-border px-4 py-3 bg-muted/15">
                <Search className="h-4.5 w-4.5 text-muted-foreground mr-3" />
                <input 
                  type="text" 
                  placeholder="Type a menu page, configuration, or quick action..."
                  value={commandSearch}
                  onChange={(e) => setCommandSearch(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-xs text-foreground placeholder-muted-foreground"
                  autoFocus
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0 hover:bg-muted"
                  onClick={() => setIsCommandPaletteOpen(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto p-2 space-y-2">
                {/* Pages Group */}
                {commandFilteredItems.length > 0 && (
                  <div className="space-y-0.5">
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">Navigate To</p>
                    {commandFilteredItems.map((item) => (
                      <div
                        key={item.name}
                        onClick={() => handleCommandSelect(item.path || '/')}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-muted/80 rounded-lg cursor-pointer transition-all text-xs font-semibold text-foreground/90 hover:text-foreground"
                      >
                        <item.icon className="h-4.5 w-4.5 text-muted-foreground" />
                        <span>{item.name}</span>
                        <span className="ml-auto text-[9px] text-muted-foreground/60 bg-muted border border-border px-1 py-0.5 rounded uppercase font-medium">Page</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick actions */}
                {(!commandSearch || 'toggle theme mode dark light'.includes(commandSearch.toLowerCase())) && (
                  <div className="space-y-0.5">
                    <div className="h-px bg-border my-1" />
                    <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">Quick Actions</p>
                    
                    <div
                      onClick={() => handleQuickAction('theme')}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/80 rounded-lg cursor-pointer transition-all text-xs font-semibold text-foreground/90 hover:text-foreground"
                    >
                      <Zap className="h-4.5 w-4.5 text-yellow-500" />
                      <span>Toggle Dark / Light Mode</span>
                      <span className="ml-auto text-[9px] text-muted-foreground/60 bg-muted border border-border px-1 py-0.5 rounded uppercase font-medium">Sys</span>
                    </div>
                    
                    <div
                      onClick={() => handleQuickAction('Create New Tender File')}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/80 rounded-lg cursor-pointer transition-all text-xs font-semibold text-foreground/90 hover:text-foreground"
                    >
                      <FileCheck className="h-4.5 w-4.5 text-primary" />
                      <span>Generate Reference Code for Tender</span>
                      <span className="ml-auto text-[9px] text-muted-foreground/60 bg-muted border border-border px-1 py-0.5 rounded uppercase font-medium">Action</span>
                    </div>
                  </div>
                )}

                {commandFilteredItems.length === 0 && (
                  <div className="text-center py-6 text-xs text-muted-foreground font-medium">
                    No results found for "{commandSearch}"
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
export default DashboardLayout;
