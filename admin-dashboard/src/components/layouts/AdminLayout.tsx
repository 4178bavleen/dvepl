import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { NavLink, useLocation, Navigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  to: string;
  collapsed?: boolean;
}

function NavItem({ icon: Icon, label, to, collapsed }: NavItemProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <NavLink
      to={to}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-destructive text-destructive-foreground shadow-md"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      {!collapsed && <span className="flex-1 text-left">{label}</span>}
    </NavLink>
  );
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, isAdmin, user } = useAuth();

  // For demo purposes, allow any authenticated user to access admin
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Overview", to: "/admin" },
    { icon: Users, label: "Organization", to: "/admin/company" },
    { icon: Users, label: "Users", to: "/admin/users" },
     { icon: Users, label: "Role Management", to: "/admin/roles" },
    { icon: CreditCard, label: "Plans & Pricing", to: "/admin/plans" },
    { icon: FileText, label: "Message Logs", to: "/admin/logs" },
    { icon: CreditCard, label: "Payment History", to: "/admin/payments" },
    { icon: Settings, label: "System Settings", to: "/admin/settings" },
  ];

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={cn(
          "bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0 transition-all duration-300",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          <Link to="/admin" className={cn("flex items-center gap-3", collapsed && "justify-center w-full")}>
            <div className="h-10 w-10 rounded-xl bg-destructive flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-destructive-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h1 className="font-bold text-lg text-foreground">Admin Panel</h1>
                <p className="text-xs text-muted-foreground">System Management</p>
              </div>
            )}
          </Link>
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
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* Back to Dashboard */}
        <div className="px-3 pb-4">
          <Separator className="my-3" />
          <Button
            variant="ghost"
            asChild
            className={cn("w-full justify-start", collapsed && "justify-center")}
          >
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {!collapsed && "Back to Dashboard"}
            </Link>
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
