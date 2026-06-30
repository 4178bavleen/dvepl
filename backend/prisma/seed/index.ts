import "dotenv/config";
import { prisma } from "../../src/lib/prisma";
import hashUtil from "../../src/utils/hashPassword";
import { seedCompany, seedRole, seedAdmin } from "./admin/index";

async function main() {
  const companyId = await seedCompany(prisma);
  const roleId = await seedRole(prisma, companyId);
  await seedAdmin(prisma, companyId, roleId, hashUtil);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });