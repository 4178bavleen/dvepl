import { seedPermissionGroups } from "./permission-group.seed";
import { seedPermissions } from "./permission.seed";
import { seedRole } from "./role.seed";
import { seedAdmin } from "./admin.seed";


interface SeedAuthParams {
  companyId: string;
}

export async function seedAuth(prisma: any, { companyId }: SeedAuthParams) {
  console.log("🌱 Seeding Authentication...");

  const roles = await seedRole(prisma, companyId);
  const admin = await seedAdmin(prisma,companyId);

  return {
    roles,
    admin,
  };
}
