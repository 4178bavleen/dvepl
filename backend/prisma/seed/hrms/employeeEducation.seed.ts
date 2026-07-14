import { PrismaClient, Employee, EmployeeEducation } from "@prisma/client";

/**
 * Seeds educational records for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded education records
 */
export async function seedEmployeeEducation(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeEducation[]> {
  console.log("🌱 Seeding Employee Education in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeEducation.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const degrees = ["MBA in HR", "B.Tech in CS", "B.Com", "M.Tech in Production"];
  const institutions = ["Delhi University", "IIT Delhi", "Mumbai University", "BITS Pilani"];

  const educationData = employees.map((emp, index) => {
    const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));
    return {
      employeeId: emp.id,
      degree: degrees[index % degrees.length],
      institution: institutions[index % institutions.length],
      yearOfPassing: 2010 + (codeNum % 10),
      grade: codeNum % 2 === 0 ? "A" : "B",
    };
  });

  // Create education records in bulk
  await prisma.employeeEducation.createMany({
    data: educationData,
  });

  return prisma.employeeEducation.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
