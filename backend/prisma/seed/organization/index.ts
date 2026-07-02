import { seedCompany } from "./company.seed";
import { seedBranch } from "./branch.seed";
import { seedDepartment } from "./department.seed";


export async function seedOrganization() {
  console.log("Seeding Organization...");

  const company = await seedCompany();

  const branch = await seedBranch(company.id);

  const departments = await seedDepartment(branch.id);



  return {
    company,
    branch,
    departments
  
  };
}