import { PrismaClient, Employee, Leave } from "@prisma/client";

/**
 * Seeds leave records for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded leave records
 */
export async function seedLeave(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<Leave[]> {
  console.log("🌱 Seeding Employee Leaves in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.leave.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const leavesData = [];

  for (const emp of employees) {
    const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));

    // Add a couple of leaves for each employee
    leavesData.push(
      {
        employeeId: emp.id,
        leaveType: "SICK",
        fromDate: new Date("2026-02-10"),
        toDate: new Date("2026-02-12"),
        reason: "Medical Checkup",
        status: "APPROVED" as const,
      },
      {
        employeeId: emp.id,
        leaveType: "CASUAL",
        fromDate: new Date("2026-08-01"),
        toDate: new Date("2026-08-03"),
        reason: "Personal Work",
        status: codeNum % 2 === 0 ? ("APPROVED" as const) : ("PENDING" as const),
      }
    );
  }

  // Create leaves in bulk
  await prisma.leave.createMany({
    data: leavesData,
  });

  return prisma.leave.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
