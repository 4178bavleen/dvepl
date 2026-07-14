import { PrismaClient, Department, CostCenter, Prisma } from "@prisma/client";

const DEFAULT_COST_CENTERS = [
  { code: "CC-CORP", name: "Corporate / Overhead", deptCode: null, budget: 1000000.00 },
  { code: "CC-SALES", name: "Sales Operations", deptCode: "SALES", budget: 500000.00 },
  { code: "CC-HR", name: "Human Resources & Recruitment", deptCode: "HR", budget: 300000.00 },
  { code: "CC-ACC", name: "Finance & Accounts", deptCode: "ACC", budget: 200000.00 },
  { code: "CC-PROD", name: "Production & Assembly", deptCode: "PROD", budget: 1500000.00 },
];

/**
 * Seeds cost centers for the company, linking them to departments where applicable.
 * 
 * @param prisma The Prisma Client instance
 * @param companyId The ID of the seeded company
 * @param departments The list of seeded departments
 * @returns Array of seeded cost centers
 */
export async function seedCostCenter(
  prisma: PrismaClient,
  companyId: string,
  departments: Department[]
): Promise<CostCenter[]> {
  console.log("🌱 Seeding Cost Centers...");

  return Promise.all(
    DEFAULT_COST_CENTERS.map((cc) => {
      // Find the associated department if specified
      const department = cc.deptCode
        ? departments.find((d) => d.code === cc.deptCode)
        : null;

      return prisma.costCenter.upsert({
        where: {
          companyId_code: {
            companyId,
            code: cc.code,
          },
        },
        update: {
          name: cc.name,
          departmentId: department ? department.id : null,
          budget: new Prisma.Decimal(cc.budget),
        },
        create: {
          companyId,
          code: cc.code,
          name: cc.name,
          departmentId: department ? department.id : null,
          budget: new Prisma.Decimal(cc.budget),
        },
      });
    })
  );
}
