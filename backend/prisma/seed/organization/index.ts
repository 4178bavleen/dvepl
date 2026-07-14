import { seedCompany } from "./company.seed";
import { seedBranch } from "./branch.seed";
import { seedDepartment } from "./department.seed";
import { seedTeam } from "./team.seed";
import { seedDesignation } from "./designation.seed";
import { seedCostCenter } from "./cost-center.seed";

interface SeedAuthParams {
  companyId: string;
}
export async function seedOrganization(prisma: any,{ companyId }: SeedAuthParams) {
  console.log("Seeding Organization...");

  const company = await seedCompany(prisma, companyId);

  const branch = await seedBranch(prisma, company.id);

  const departments = await seedDepartment(prisma, branch.id);

  const teams = await seedTeam(prisma, departments);

  const designations = await seedDesignation(prisma);

  const costCenters = await seedCostCenter(prisma, company.id, departments);

  return {
    company,
    branch,
    departments,
    teams,
    designations,
    costCenters
  };
}