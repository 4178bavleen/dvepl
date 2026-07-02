import { prisma } from "../../src/lib/prisma";

import { seedOrganization } from "./Organization";
import { seedAuth } from "./auth";
import { seedHRMS } from "./hrms";

async function main() {
  console.log("Starting Database Seed");

  const organization = await seedOrganization();

  await seedAuth(prisma,{
    companyId: organization.company.id,
  });

  await seedHRMS();

  console.log("✅ Database Seed Completed");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });