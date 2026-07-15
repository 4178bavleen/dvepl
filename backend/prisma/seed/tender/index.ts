import { PrismaClient } from "@prisma/client";
import { seedGovernmentDepartments } from "./governmentDepartment.seed";
import { seedSectionStructure } from "./sectionStructure.seed";
import { seedTenderRequests } from "./tenderRequest.seed";
import { seedTenders } from "./tender.seed";

interface SeedTenderParams {
  companyId: string;
}

/**
 * Coordinates and seeds the entire Tender Management module with 10 records per entity.
 */
export async function seedTender(
  prisma: PrismaClient,
  { companyId }: SeedTenderParams
): Promise<void> {
  console.log("🌱 Starting Tender Module Seeds...");

  // 1. Resolve basic HRMS / Org / Auth relationships
  const customers = await prisma.customer.findMany({ where: { companyId } });
  const users = await prisma.user.findMany({ where: { companyId } });
  const departments = await prisma.department.findMany({
    where: { branch: { companyId } },
  });
  const employees = await prisma.employee.findMany({ where: { companyId } });

  if (customers.length === 0 || users.length === 0 || departments.length === 0) {
    console.log("⚠️ CRM, Auth, or Organization seeds are missing. Skipping Tender Seeding.");
    return;
  }

  const targetCustomer = customers[0];
  const targetUser = users[0];
  const targetDept = departments[0];
  const targetEmployee = employees[0] || null;

  // 2. Seed 10 Government Departments
  const govDepts = await seedGovernmentDepartments(prisma, companyId);
  const firstGovDeptId = govDepts[0].id;

  // 3. Seed 10 Sections, Divisions, Subdivisions
  const structure = await seedSectionStructure(
    prisma,
    companyId,
    targetDept.id,
    firstGovDeptId
  );

  const sectionIds = structure.sections.map(s => s.id);
  const divisionIds = structure.divisions.map(d => d.id);
  const subDivisionIds = structure.subDivisions.map(s => s.id);
  const govDeptIds = govDepts.map(g => g.id);

  // 4. Seed 10 Tender Requests (Leads)
  const tenderRequests = await seedTenderRequests(
    prisma,
    companyId,
    targetCustomer.id,
    targetUser.id,
    targetEmployee ? targetEmployee.id : null
  );
  const tenderRequestIds = tenderRequests.map(tr => tr.id);

  // 5. Seed 10 Tenders (with Files, Remarks, Activities, ReferenceCodes)
  await seedTenders(
    prisma,
    companyId,
    targetCustomer.id,
    targetUser.id,
    tenderRequestIds,
    targetDept.id,
    sectionIds,
    divisionIds,
    subDivisionIds,
    govDeptIds
  );

  console.log("✅ Tender Module Seeding Completed.");
}
