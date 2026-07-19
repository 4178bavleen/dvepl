export const PERMISSION_GROUPS = {
  DASHBOARD: "Dashboard",
  USER_MANAGEMENT: "User Management",
  ROLE_MANAGEMENT: "Role Management",
  EMPLOYEE: "Employee Management",
  ORGANIZATION: "Organization",
  CRM: "CRM",
  LEAD: "Tender Request Management",
  TENDER: "Tender Management",
} as const;

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: "dashboard.view",

  // User Management
  USER_CREATE: "user.create",
  USER_VIEW: "user.view",
  USER_UPDATE: "user.update",
  USER_DELETE: "user.delete",

  // Role Management
  ROLE_CREATE: "role.create",
  ROLE_VIEW: "role.view",
  ROLE_UPDATE: "role.update",
  ROLE_DELETE: "role.delete",

  // Employee
  EMPLOYEE_CREATE: "employee.create",
  EMPLOYEE_VIEW: "employee.view",
  EMPLOYEE_UPDATE: "employee.update",
  EMPLOYEE_DELETE: "employee.delete",

  // Company
  COMPANY_CREATE: "company.create",
  COMPANY_VIEW: "company.view",
  COMPANY_UPDATE: "company.update",
  COMPANY_DELETE: "company.delete",

  // Branch
  BRANCH_CREATE: "branch.create",
  BRANCH_VIEW: "branch.view",
  BRANCH_UPDATE: "branch.update",
  BRANCH_DELETE: "branch.delete",

  // Customer
  CUSTOMER_CREATE: "customer.create",
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_UPDATE: "customer.update",
  CUSTOMER_DELETE: "customer.delete",

  // Tender Request
  TENDER_REQUEST_CREATE: "tenderRequest.create",
  TENDER_REQUEST_VIEW: "tenderRequest.view",
  TENDER_REQUEST_UPDATE: "tenderRequest.update",
  TENDER_REQUEST_DELETE: "tenderRequest.delete",
  TENDER_REQUEST_ASSIGN: "tenderRequest.assign",

  // Tender Management
  TENDER_CREATE: "tender.create",
  TENDER_VIEW: "tender.view",
  TENDER_UPDATE: "tender.update",
  TENDER_DELETE: "tender.delete",
} as const;
