import { seedCompany } from "./company.seed";
import { seedBranch } from "./branch.seed";
import { seedDepartment } from "./department.seed";

interface SeedAuthParams {
  companyId: string;
}
export async function seedOrganization(prisma: any,{ companyId }: SeedAuthParams) {
  console.log("Seeding Organization...");

  const company = await seedCompany(prisma, companyId);

  const branch = await seedBranch(prisma, company.id);

  const departments = await seedDepartment(prisma, branch.id);



  return {
    company,
    branch,
    departments
  
  };
}