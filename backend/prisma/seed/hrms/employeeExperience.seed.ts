import { PrismaClient, Employee, EmployeeExperience } from "@prisma/client";

/**
 * Seeds professional experience records for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded experience records
 */
export async function seedEmployeeExperience(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeExperience[]> {
  console.log("🌱 Seeding Employee Experience in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeExperience.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const companies = ["Previous Solutions Ltd", "Global Enterprises", "Standard Tech Inc", "Industrial Corp"];
  const roles = ["Assistant Manager", "Production Engineer", "Sales Executive", "Financial Analyst"];

  const experienceData = employees.map((emp, index) => {
    const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));
    const yearOffset = codeNum % 3;

    return {
      employeeId: emp.id,
      companyName: companies[index % companies.length],
      designation: roles[index % roles.length],
      fromDate: new Date(2015 + yearOffset, 5, 1),
      toDate: new Date(2020 + yearOffset, 11, 31),
    };
  });

  // Create experience records in bulk
  await prisma.employeeExperience.createMany({
    data: experienceData,
  });

  return prisma.employeeExperience.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
