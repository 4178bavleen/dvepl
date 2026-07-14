import { PrismaClient, Employee, EmployeeShift } from "@prisma/client";

/**
 * Seeds shift assignments for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded employee shift assignments
 */
export async function seedEmployeeShift(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeShift[]> {
  console.log("🌱 Seeding Employee Shift Assignments in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeShift.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const shifts = await prisma.shift.findMany();
  const dayShift = shifts.find((s) => s.name === "Day Shift");
  const nightShift = shifts.find((s) => s.name === "Night Shift");

  const shiftsData: any[] = [];

  for (const emp of employees) {
    const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));
    // Assign Day Shift to even-coded employees and Night Shift to odd-coded ones
    const assignedShift = codeNum % 2 === 0 ? nightShift || dayShift : dayShift;

    if (assignedShift) {
      shiftsData.push({
        employeeId: emp.id,
        shiftId: assignedShift.id,
        effectiveFrom: new Date("2026-01-01"),
      });
    }
  }

  // Create assignments
  if (shiftsData.length > 0) {
    await prisma.employeeShift.createMany({
      data: shiftsData,
    });
  }

  return prisma.employeeShift.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
