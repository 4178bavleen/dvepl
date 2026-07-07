export async function seedRolePermissions(
  prisma: any,
  companyId: string
) {
  console.log("🌱 Seeding Role Permissions...");

  const adminRole = await prisma.role.findUnique({
    where: {
      companyId_name: {
        companyId,
        name: "Admin",
      },
    },
  });

  if (!adminRole) {
    throw new Error("Admin role not found.");
  }

  const permissions = await prisma.permission.findMany();

  await Promise.all(
    permissions.map((permission) =>
      prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: adminRole.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: adminRole.id,
          permissionId: permission.id,
        },
      })
    )
  );
}