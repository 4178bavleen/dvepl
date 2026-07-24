import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './routes/protected';
import { PublicRoute } from '@/app/routes/public';
import { UiConfigProvider } from '@/contexts/ui/uiConfigContext';
import NotFound from '@/pages/notFound';
import PageLoader from '@/components/ui/pageLoader';

// Auth
const LoginPage = lazy(() => import('@/pages/auth/loginPage'));

// Dashboard
const DashboardOverview = lazy(() => import('@/pages/dashboard/dashboardOverview'));

// Organization
const CompanyPage = lazy(() => import('@/pages/organization/companyPage'));
const BranchPage = lazy(() => import('@/pages/organization/branchPage'));
const DepartmentPage = lazy(() => import('@/pages/organization/departmentPage'));
const TeamPage = lazy(() => import('@/pages/organization/teamPage'));
const DesignationPage = lazy(() => import('@/pages/organization/designationPage'));
const CostCenterPage = lazy(() => import('@/pages/organization/costCenterPage'));

// Employee
const EmployeePage = lazy(() => import('@/pages/employee/employeePage'));
const AttendancePage = lazy(() => import('@/pages/attendance/attendancePage'));
const LeavePage = lazy(() => import('@/pages/leave/leavePage'));
const HolidaysPage = lazy(() => import('@/pages/holidays/holidaysPage'));
const ShiftsPage = lazy(() => import('@/pages/shifts/shiftsPage'));
const PayrollPage = lazy(() => import('@/pages/payroll/payrollPage'));
const DocumentsPage = lazy(() => import('@/pages/documents/documentsPage'));
const TasksPage = lazy(() => import('@/pages/tasks/tasksPage'));
const ReportsPage = lazy(() => import('@/pages/reports/reportsPage'));

// CRM
const CustomersPage = lazy(() => import('@/pages/customers/customersPage'));
const ContactPersonsPage = lazy(() => import('@/pages/contacts/contactPersonsPage'));
const CommunicationHistoryPage = lazy(() => import('@/pages/communication/communicationHistoryPage'));

// Tender
const TenderRequestsPage = lazy(() => import('@/pages/tender-requests/tenderRequestsPage'));
const TendersPage = lazy(() => import('@/pages/tenders/tendersPage'));
const GovernmentDepartmentsPage = lazy(() => import('@/pages/government/governmentDepartmentsPage'));
const SectionsPage = lazy(() => import('@/pages/tenders/sectionsPage'));
const DivisionsPage = lazy(() => import('@/pages/tenders/divisionsPage'));
const SubDivisionsPage = lazy(() => import('@/pages/tenders/subDivisionsPage'));
const ReferenceCodesPage = lazy(() => import('@/pages/tenders/referenceCodesPage'));
const TechnicalClarificationsPage = lazy(() => import('@/pages/tenders/technicalClarificationsPage'));
const QuotationsPage = lazy(() => import('@/pages/tenders/quotationsPage'));
const OrdersPage = lazy(() => import('@/pages/tenders/ordersPage'));
const VendorsPage = lazy(() => import('@/pages/vendors/vendorsPage'));
const BoqsPage = lazy(() => import('@/pages/tenders/boqsPage'));

// Engineering & Manufacturing
const EngineeringProjectsPage = lazy(() => import('@/pages/engineering/engineeringProjectsPage'));
const EngineeringDrawingsPage = lazy(() => import('@/pages/engineering/engineeringDrawingsPage'));
const BomsPage = lazy(() => import('@/pages/engineering/bomsPage'));

// Security & Audit
const UsersPage = lazy(() => import('@/pages/roles/usersPage'));
const RolesPage = lazy(() => import('@/pages/roles/rolesPage'));
const PermissionsPage = lazy(() => import('@/pages/permissions/permissionsPage'));
const PermissionGroupsPage = lazy(() => import('@/pages/permissions/permissionGroupsPage'));
const ApprovalRequestsPage = lazy(() => import('@/pages/roles/approvalRequestsPage'));
const AuditLogsPage = lazy(() => import('@/pages/audit/auditLogsPage'));

const SettingsPage = lazy(() => import('@/pages/settings/settingsPage'));
const ProfilePage = lazy(() => import('@/pages/profile/profilePage'));

// Materials & Master Catalog
const MaterialsPage = lazy(() => import('@/pages/material/materialsPage'));
const MaterialCategoriesPage = lazy(() => import('@/pages/material/materialCategoriesPage'));

// Procurement & Purchase
const PurchaseRequestsPage = lazy(() => import('@/pages/purchase/purchaseRequestsPage'));
const PurchaseOrdersPage = lazy(() => import('@/pages/purchase/purchaseOrdersPage'));

// Inventory & Warehousing
const WarehousesPage = lazy(() => import('@/pages/inventory/inventoryPage'));
const InventoryStocksPage = lazy(() => import('@/pages/inventory/inventoryPage'));
const StockTransfersPage = lazy(() => import('@/pages/inventory/inventoryPage'));
const LogisticsDispatchesPage = lazy(() => import('@/pages/inventory/inventoryPage'));

// Production
const ProductionPlansPage = lazy(() => import('@/pages/production/productionPlansPage'));
const WorkOrdersPage = lazy(() => import('@/pages/production/workOrdersPage'));

// Quality Assurance
const InspectionsPage = lazy(() => import('@/pages/qc/inspectionsPage'));

// Finance & Accounts
const InvoicesPage = lazy(() => import('@/pages/finance/invoicesPage'));
const PaymentsPage = lazy(() => import('@/pages/finance/paymentsPage'));
const ExpensesPage = lazy(() => import('@/pages/finance/expensesPage'));
const NotificationsPage = lazy(() => import('@/pages/notifications/notificationsPage'));



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
              <Route path="/hrms/tasks" element={<TasksPage />} />
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
              <Route path="/tender/clarifications" element={<TechnicalClarificationsPage />} />
              <Route path="/tender/quotations" element={<QuotationsPage />} />
               <Route path="/tender/orders" element={<OrdersPage />} />
              <Route path="/purchase/vendors" element={<VendorsPage />} />
              <Route path="/tender/boqs" element={<BoqsPage />} />
              {/* Security */}
              <Route path="/security/users" element={<UsersPage />} />
              <Route path="/security/roles" element={<RolesPage />} />
              <Route path="/security/permissions" element={<PermissionsPage />} />
              <Route path="/security/permission-groups" element={<PermissionGroupsPage />} />
              <Route path="/security/approval-requests" element={<ApprovalRequestsPage />} />
              
              {/* Engineering & Manufacturing */}
              <Route path="/engineering/projects" element={<EngineeringProjectsPage />} />
              <Route path="/engineering/drawings" element={<EngineeringDrawingsPage />} />
              <Route path="/engineering/boms" element={<BomsPage />} />

              {/* Materials & Master Catalog */}
              <Route path="/material/materials" element={<MaterialsPage />} />
              <Route path="/material/categories" element={<MaterialCategoriesPage />} />

              {/* Procurement & Purchase */}
              <Route path="/purchase/requests" element={<PurchaseRequestsPage />} />
              <Route path="/purchase/orders" element={<PurchaseOrdersPage />} />

              {/* Inventory & Warehousing */}
              <Route path="/inventory/warehouses" element={<WarehousesPage />} />
              <Route path="/inventory/stocks" element={<InventoryStocksPage />} />
              <Route path="/inventory/transfers" element={<StockTransfersPage />} />
              <Route path="/logistics/dispatches" element={<LogisticsDispatchesPage />} />

              {/* Production */}
              <Route path="/production/plans" element={<ProductionPlansPage />} />
              <Route path="/production/work-orders" element={<WorkOrdersPage />} />

              {/* Quality Assurance */}
              <Route path="/quality/inspections" element={<InspectionsPage />} />

              {/* Finance & Accounts */}
              <Route path="/finance/invoices" element={<InvoicesPage />} />
              <Route path="/finance/payments" element={<PaymentsPage />} />
              <Route path="/finance/expenses" element={<ExpensesPage />} />
              
              <Route path="/audit-logs" element={<AuditLogsPage />} />
              <Route path="/reports" element={<ReportsPage />} />
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
