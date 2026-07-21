import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/protected';
import { PublicRoute } from '@/app/routes/public';
import { UiConfigProvider } from '@/contexts/ui/UiConfigContext';
import NotFound from '@/pages/NotFound';

// Auth
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));

// Dashboard
const DashboardOverview = lazy(() => import('@/pages/dashboard/DashboardOverview'));

// Organization
const CompanyPage = lazy(() => import('@/pages/organization/CompanyPage'));
const BranchPage = lazy(() => import('@/pages/organization/BranchPage'));
const DepartmentPage = lazy(() => import('@/pages/organization/DepartmentPage'));
const TeamPage = lazy(() => import('@/pages/organization/TeamPage'));
const DesignationPage = lazy(() => import('@/pages/organization/DesignationPage'));
const CostCenterPage = lazy(() => import('@/pages/organization/CostCenterPage'));

// Employee
const EmployeePage = lazy(() => import('@/pages/employee/EmployeePage'));
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const LeavePage = lazy(() => import('@/pages/leave/LeavePage'));
const HolidaysPage = lazy(() => import('@/pages/holidays/HolidaysPage'));
const ShiftsPage = lazy(() => import('@/pages/shifts/ShiftsPage'));
const PayrollPage = lazy(() => import('@/pages/payroll/PayrollPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/DocumentsPage'));

// CRM
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage'));
const ContactPersonsPage = lazy(() => import('@/pages/contacts/ContactPersonsPage'));
const CommunicationHistoryPage = lazy(() => import('@/pages/communication/CommunicationHistoryPage'));

// Tender
const TenderRequestsPage = lazy(() => import('@/pages/tender-requests/TenderRequestsPage'));
const TendersPage = lazy(() => import('@/pages/tenders/TendersPage'));
const GovernmentDepartmentsPage = lazy(() => import('@/pages/government/GovernmentDepartmentsPage'));
const SectionsPage = lazy(() => import('@/pages/tenders/SectionsPage'));
const DivisionsPage = lazy(() => import('@/pages/tenders/DivisionsPage'));
const SubDivisionsPage = lazy(() => import('@/pages/tenders/SubDivisionsPage'));
const ReferenceCodesPage = lazy(() => import('@/pages/tenders/ReferenceCodesPage'));

// Security & Audit
const UsersPage = lazy(() => import('@/pages/roles/UsersPage'));
const RolesPage = lazy(() => import('@/pages/roles/RolesPage'));
const PermissionsPage = lazy(() => import('@/pages/permissions/PermissionsPage'));
const PermissionGroupsPage = lazy(() => import('@/pages/permissions/PermissionGroupsPage'));
const AuditLogsPage = lazy(() => import('@/pages/audit/AuditLogsPage'));

// Settings & Profiles
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/ProfilePage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/NotificationsPage'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[500px] w-full">
    <div className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground/65 font-bold animate-pulse">
      Initialising System
    </div>
  </div>
);

export function AppRouter() {
  return (
    <UiConfigProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Auth Routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardOverview />} />
              {/* Organization */}
              <Route path="/organization/companies" element={<CompanyPage />} />
              <Route path="/organization/branches" element={<BranchPage />} />
              <Route path="/organization/departments" element={<DepartmentPage />} />
              <Route path="/organization/teams" element={<TeamPage />} />
              <Route path="/organization/designations" element={<DesignationPage />} />
              <Route path="/organization/cost-centers" element={<CostCenterPage />} />
              {/* HRMS */}
              <Route path="/hrms/employees" element={<EmployeePage />} />
              <Route path="/hrms/attendance" element={<AttendancePage />} />
              <Route path="/hrms/leaves" element={<LeavePage />} />
              <Route path="/hrms/holidays" element={<HolidaysPage />} />
              <Route path="/hrms/shifts" element={<ShiftsPage />} />
              <Route path="/hrms/payroll" element={<PayrollPage />} />
              <Route path="/hrms/documents" element={<DocumentsPage />} />
              {/* CRM */}
              <Route path="/crm/customers" element={<CustomersPage />} />
              <Route path="/crm/contacts" element={<ContactPersonsPage />} />
              <Route path="/crm/communication" element={<CommunicationHistoryPage />} />
              {/* Tender Management */}
              <Route path="/tender/requests" element={<TenderRequestsPage />} />
              <Route path="/tender/tenders" element={<TendersPage />} />
              <Route path="/tender/government" element={<GovernmentDepartmentsPage />} />
              <Route path="/tender/sections" element={<SectionsPage />} />
              <Route path="/tender/divisions" element={<DivisionsPage />} />
              <Route path="/tender/subdivisions" element={<SubDivisionsPage />} />
              <Route path="/tender/reference-codes" element={<ReferenceCodesPage />} />
              {/* Security */}
              <Route path="/security/users" element={<UsersPage />} />
              <Route path="/security/roles" element={<RolesPage />} />
              <Route path="/security/permissions" element={<PermissionsPage />} />
              <Route path="/security/permission-groups" element={<PermissionGroupsPage />} />
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              {/* Settings */}
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/profile" element={<ProfilePage />} />
              <Route path="/settings/notifications" element={<NotificationsPage />} />
            </Route>

            {/* 404 Fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </UiConfigProvider>
  );
}
