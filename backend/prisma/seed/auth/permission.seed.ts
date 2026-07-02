import { PERMISSION_GROUPS, PERMISSIONS } from "./constants";

export async function seedPermissions() {
  console.log("🌱 Seeding Permissions...");

  const groups = await prisma.permissionGroup.findMany();

  const groupMap = new Map(
    groups.map((group) => [group.name, group.id])
  );

  const permissions = [
    {
      code: PERMISSIONS.DASHBOARD_VIEW,
      group: PERMISSION_GROUPS.DASHBOARD,
      description: "View dashboard",
    },

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

    {
      code: PERMISSIONS.ROLE_CREATE,
      group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
      description: "Create Role",
    },

    {
      code: PERMISSIONS.ROLE_VIEW,
      group: PERMISSION_GROUPS.ROLE_MANAGEMENT,
      description: "View Role",
    },

    {
      code: PERMISSIONS.LEAD_CREATE,
      group: PERMISSION_GROUPS.LEAD,
      description: "Create Lead",
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