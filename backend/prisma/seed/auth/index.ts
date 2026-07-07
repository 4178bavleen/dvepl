import { seedPermissionGroups } from "./permission-group.seed";
import { seedPermissions } from "./permission.seed";
import { seedRole } from "./role.seed";
import { seedAdmin } from "./admin.seed";
import { seedRolePermissions } from "./role-permission.seed";


interface SeedAuthParams {
  companyId: string;
}

export async function seedAuth(prisma: any, { companyId }: SeedAuthParams) {
  console.log("🌱 Seeding Authentication...");

await seedPermissionGroups(prisma);    // permission groups 
 
await seedPermissions(prisma);           

const role = await seedRole(prisma, companyId);

await seedRolePermissions(prisma, companyId);

const admin = await seedAdmin(prisma, companyId);

return {
  role,
  admin,
};
}
