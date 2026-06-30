import type { PrismaClient } from "@prisma/client";
/**
 * Role belongs to a Company (companyId is required on Role),
 * so we first need a Company to seed a "Super Admin" Role under it.
 */
export async function seedCompany(prisma: PrismaClient): Promise<string> {
  const companyName = "Default Company";

  const company = await prisma.company.upsert({
    where: { gst: "SEED-DEFAULT-GST" }, // placeholder unique value for seeding
    update: {},
    create: {
      name: companyName,
      gst: "SEED-DEFAULT-GST",
      isActive: true,
    },
  });

  console.log(`✅ Company seeded: ${company.name}`);
  return company.id;
}

export async function seedRole(
  prisma: PrismaClient,
  companyId: string,
): Promise<string> {
  const roleName = "Super Admin";

  const role = await prisma.role.upsert({
    where: {
      companyId_name: {
        companyId,
        name: roleName,
      },
    },
    update: {},
    create: {
      companyId,
      name: roleName,
      description: "Full system access - seeded by default",
      isSystem: true,
    },
  });

  console.log(`✅ Role seeded: ${role.name}`);
  return role.id;
}

export async function seedAdmin(
  prisma: PrismaClient,
  companyId: string,
  roleId: string,
  hashUtil: { hashPassword: (plain: string) => Promise<string> },
): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@gmail.com";
  const plainPassword = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
  const phone = process.env.SEED_ADMIN_PHONE || "7894561230";

  const hashedPassword = await hashUtil.hashPassword(plainPassword);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      companyId,
      email,
      phone,
      passwordHash: hashedPassword,
      isEmailVerified: true,
      isPhoneVerified: true,
      isActive: true,
    },
  });

  // Link admin user to the Super Admin role (UserRole junction table)
  await prisma.userRole.upsert({
    where: {
      userId_roleId: {
        userId: admin.id,
        roleId,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      roleId,
    },
  });

  console.log(`✅ Admin seeded: ${admin.email}`);
}