import { PERMISSION_GROUPS, PERMISSIONS } from "./constants";

export async function seedPermissions(prisma: any) {
  console.log("🌱 Seeding Permissions...");

  const groups = await prisma.permissionGroup.findMany();

  const groupMap = new Map(
    groups.map((group) => [group.name, group.id])
  );

 
const permissions = [
  // Dashboard
  {
    code: PERMISSIONS.DASHBOARD_VIEW,
    group: PERMISSION_GROUPS.DASHBOARD,
    description: "View Dashboard",
  },

  // User Management
  {
    code: PERMISSIONS.USER_CREATE,
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Create User",
  },
  {
    code: PERMISSIONS.USER_VIEW,
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "View Users",
  },
  {
    code: PERMISSIONS.USER_UPDATE,
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Update Users",
  },
  {
    code: PERMISSIONS.USER_DELETE,
    group: PERMISSION_GROUPS.USER_MANAGEMENT,
    description: "Delete Users",
  },

  // Role Management
  {
    code: PERMISSIONS.ROLE_CREATE,
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Create Role",
  },
  {
    code: PERMISSIONS.ROLE_VIEW,
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "View Roles",
  },
  {
    code: PERMISSIONS.ROLE_UPDATE,
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Update Roles",
  },
  {
    code: PERMISSIONS.ROLE_DELETE,
    group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
    description: "Delete Roles",
  },

  // Employee
  {
    code: PERMISSIONS.EMPLOYEE_CREATE,
    group: PERMISSION_GROUPS.EMPLOYEE,
    description: "Create Employee",
  },
  {
    code: PERMISSIONS.EMPLOYEE_VIEW,
    group: PERMISSION_GROUPS.EMPLOYEE,
    description: "View Employees",
  },
  {
    code: PERMISSIONS.EMPLOYEE_UPDATE,
    group: PERMISSION_GROUPS.EMPLOYEE,
    description: "Update Employee",
  },
  {
    code: PERMISSIONS.EMPLOYEE_DELETE,
    group: PERMISSION_GROUPS.EMPLOYEE,
    description: "Delete Employee",
  },

  // Company
  {
    code: PERMISSIONS.COMPANY_CREATE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Create Company",
  },
  {
    code: PERMISSIONS.COMPANY_VIEW,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "View Company",
  },
  {
    code: PERMISSIONS.COMPANY_UPDATE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Update Company",
  },
  {
    code: PERMISSIONS.COMPANY_DELETE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Delete Company",
  },

  // Branch
  {
    code: PERMISSIONS.BRANCH_CREATE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Create Branch",
  },
  {
    code: PERMISSIONS.BRANCH_VIEW,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "View Branches",
  },
  {
    code: PERMISSIONS.BRANCH_UPDATE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Update Branch",
  },
  {
    code: PERMISSIONS.BRANCH_DELETE,
    group: PERMISSION_GROUPS.ORGANIZATION,
    description: "Delete Branch",
  },

  // Customer
  {
    code: PERMISSIONS.CUSTOMER_CREATE,
    group: PERMISSION_GROUPS.CRM,
    description: "Create Customer",
  },
  {
    code: PERMISSIONS.CUSTOMER_VIEW,
    group: PERMISSION_GROUPS.CRM,
    description: "View Customers",
  },
  {
    code: PERMISSIONS.CUSTOMER_UPDATE,
    group: PERMISSION_GROUPS.CRM,
    description: "Update Customer",
  },
  {
    code: PERMISSIONS.CUSTOMER_DELETE,
    group: PERMISSION_GROUPS.CRM,
    description: "Delete Customer",
  },

  // Lead
  {
    code: PERMISSIONS.LEAD_CREATE,
    group: PERMISSION_GROUPS.LEAD,
    description: "Create Lead",
  },
  {
    code: PERMISSIONS.LEAD_VIEW,
    group: PERMISSION_GROUPS.LEAD,
    description: "View Leads",
  },
  {
    code: PERMISSIONS.LEAD_UPDATE,
    group: PERMISSION_GROUPS.LEAD,
    description: "Update Lead",
  },
  {
    code: PERMISSIONS.LEAD_DELETE,
    group: PERMISSION_GROUPS.LEAD,
    description: "Delete Lead",
  },
  {
    code: PERMISSIONS.LEAD_ASSIGN,
    group: PERMISSION_GROUPS.LEAD,
    description: "Assign Lead",
  },
];

  return Promise.all(
    permissions.map((permission) =>
      prisma.permission.upsert({
        where: {
          code: permission.code,
        },
        update: {
          description: permission.description,
          groupId: groupMap.get(permission.group),
        },
        create: {
          code: permission.code,
          description: permission.description,
          groupId: groupMap.get(permission.group),
        },
      })
    )
  );
}