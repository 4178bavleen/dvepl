import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Public pages
import Home from "./pages/public/Home";
import Features from "./pages/public/Features";
import Pricing from "./pages/public/Pricing";
import UseCases from "./pages/public/UseCases";
import Integrations from "./pages/public/Integrations";
import About from "./pages/public/About";
import Contact from "./pages/public/Contact";

// Auth pages
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// Dashboard pages
import Index from "./pages/Index";
import Inbox from "./pages/Inbox";
import Contacts from "./pages/Contacts";
import Broadcasts from "./pages/Broadcasts";
import Chatbots from "./pages/Chatbots";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import Templates from "./pages/Templates";
import Automation from "./pages/Automation";
import TeamMembers from "./pages/TeamMembers";
import Billing from "./pages/Billing";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";

import UserManagement from "./pages/admin/UserManagement";
import RoleManagement from "./pages/admin/RoleManagement";
import PlansManagement from "./pages/admin/PlansManagement";
import MessageLogs from "./pages/admin/MessageLogs";
import PaymentHistory from "./pages/admin/PaymentHistory";
import SystemSettings from "./pages/admin/SystemSettings";


import AdminRoute from "./routes/AdminRoute"
import PermissionManagement from "./pages/admin/PermissionManagement";
import OrganizationManagement from "./pages/admin/CompanyManagement";
import OrganizationDetail from "./pages/admin/OrganizationDetail";
import CompanyManagement from "./pages/admin/CompanyManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/features" element={<Features />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/use-cases" element={<UseCases />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Dashboard Routes */}

            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />

            <Route path="/inbox" element={<Inbox />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/broadcasts" element={<Broadcasts />} />
            <Route path="/chatbots" element={<Chatbots />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/team" element={<TeamMembers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/help" element={<Help />} />

            {/* Admin Routes */}
            {/* <Route element={<AdminRoute />}> */}
              <Route path="/admin" element={<AdminDashboard />} />
              
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/company" element={<CompanyManagement />} />
              <Route path="/admin/campany/:id" element={<OrganizationDetail />} />
              <Route path="/admin/roles" element={<RoleManagement />} />
              <Route path="/admin/permissions" element={<PermissionManagement />} />
              <Route path="/admin/plans" element={<PlansManagement />} />
              <Route path="/admin/logs" element={<MessageLogs />} />
              <Route path="/admin/payments" element={<PaymentHistory />} />
              <Route path="/admin/settings" element={<SystemSettings />} />
            {/* </Route> */}

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
