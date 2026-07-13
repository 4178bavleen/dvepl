import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  Bot,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Users as UsersIcon,
  CreditCard,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  badge?: number;
  collapsed?: boolean;
}

function NavItem({ icon: Icon, label, to, badge, collapsed }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{label}</span>
          {badge && badge > 0 && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-bold",
                isActive
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-primary text-primary-foreground"
              )}
            >
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { logout } = useAuth();

  const mainNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", to: "/" },
     
    { icon: MessageSquare, label: "Inbox", to: "/inbox", badge: 12 },
    { icon: Users, label: "Contacts", to: "/contacts" },
    { icon: Megaphone, label: "Broadcasts", to: "/broadcasts" },
  ];

  const featureNavItems = [
    { icon: FileText, label: "Templates", to: "/templates" },
    { icon: Bot, label: "Automation", to: "/automation" },
    { icon: UsersIcon, label: "Team", to: "/team" },
    { icon: BarChart3, label: "Analytics", to: "/analytics" },
  ];

  const secondaryNavItems = [
    { icon: CreditCard, label: "Billing", to: "/billing" },
    { icon: Settings, label: "Settings", to: "/settings" },
    { icon: HelpCircle, label: "Help", to: "/help" },
  ];

  return (
    <aside
      className={cn(
        "bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-between">
        <NavLink to="/" className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
          {/* <div className="h-10 w-10 rounded-xl gradient-whatsapp flex items-center justify-center flex-shrink-0">
            <MessageSquare className="h-5 w-5 text-primary-foreground" />
          </div> */}
          <div>
           <img src="\public\dvepl-logo.png" alt="dvepl-logo"></img>
            </div>
          {!collapsed && (
            <div>
              {/* <h1 className="font-bold text-lg text-foreground">ChatFlow</h1>
              <p className="text-xs text-muted-foreground">WhatsApp Business</p> */}
            </div>
          )}
        </NavLink>
      </div>

      {/* Collapse Button */}
      <div className="px-3 mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "w-full justify-center text-muted-foreground hover:text-foreground",
            !collapsed && "justify-end"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto">
        <div className="space-y-1">
          {!collapsed && <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main</p>}
          {mainNavItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              to={item.to}
              badge={item.badge}
              collapsed={collapsed}
            />
          ))}
        </div>
        <div className="space-y-1">
          {!collapsed && <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Features</p>}
          {featureNavItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="px-3 pb-4 space-y-1">
        <Separator className="my-3" />
        {secondaryNavItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            to={item.to}
            collapsed={collapsed}
          />
        ))}
        
        {/* Admin Link */}
        <NavLink
          to="/login"
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
        >
          <Shield className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="flex-1 text-left">Admin Panel</span>}
        </NavLink>

        {/* User Profile */}
        <div
          className={cn(
            "flex items-center gap-3 p-3 mt-3 rounded-xl bg-muted/50",
            collapsed && "justify-center p-2"
          )}
        >
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">JD</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">John Doe</p>
              <p className="text-xs text-muted-foreground truncate">john@company.com</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  );
}
