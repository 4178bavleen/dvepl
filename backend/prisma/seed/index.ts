import { prisma } from "../../src/lib/prisma";

import { seedOrganization } from "./Organization";
import { seedAuth } from "./auth";
import { seedPermissions } from "./auth/permission.seed";
import { seedHrms } from "./hrms";
import { seedCrm } from "./crm";
import { seedTender } from "./tender";

async function main() {
  console.log("Starting Database Seed");

  const organization = await seedOrganization(prisma , { companyId: "07ABCDE1234F1Z5" });

  await seedAuth(prisma, {
    companyId: organization.company.id,
  });

  await seedHrms(prisma, {
    companyId: organization.company.id,
  });

  await seedCrm(prisma, {
    companyId: organization.company.id,
  });

  await seedTender(prisma, {
    companyId: organization.company.id,
  });

  console.log("✅ Database Seed Completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });