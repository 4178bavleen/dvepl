import { PrismaClient, Employee, Salary, Prisma } from "@prisma/client";

/**
 * Seeds salary structures for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded salaries
 */
export async function seedSalary(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<Salary[]> {
  console.log("🌱 Seeding Employee Salaries in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.salary.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const salariesData: any[] = [];

  for (const emp of employees) {
    const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));
    // Compute a mock salary package based on their employee ID
    const baseValue = 30000 + (codeNum * 5000);
    const basic = baseValue;
    const hra = baseValue * 0.4;
    const allowances = baseValue * 0.15;
    const deductions = baseValue * 0.08;
    const ctc = basic + hra + allowances - deductions;

    salariesData.push({
      employeeId: emp.id,
      effectiveFrom: new Date("2026-01-01"),
      basic: new Prisma.Decimal(basic),
      hra: new Prisma.Decimal(hra),
      allowances: new Prisma.Decimal(allowances),
      deductions: new Prisma.Decimal(deductions),
      ctc: new Prisma.Decimal(ctc),
    });
  }

  // Create salaries
  // Since Prisma Client createMany supports Decimal, this works cleanly
  await prisma.salary.createMany({
    data: salariesData,
  });

  return prisma.salary.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
