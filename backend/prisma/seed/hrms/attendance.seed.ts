import { PrismaClient, Employee, Attendance } from "@prisma/client";

/**
 * Seeds attendance logs for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded attendance records
 */
export async function seedAttendance(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<Attendance[]> {
  console.log("🌱 Seeding Attendance Logs in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  const attendanceDays = [
    new Date("2026-07-12"),
    new Date("2026-07-13"),
  ];

  const seeded: any[] = [];

  for (const emp of employees) {
    for (const date of attendanceDays) {
      const codeNum = parseInt(emp.employeeCode.replace("EMP", ""));
      // Give even employees half-day or absent status occasionally for realistic variation
      const status = (codeNum % 7 === 0 && date.getDay() === 1) ? "ABSENT" : "PRESENT";

      const record = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: emp.id,
            date,
          },
        },
        update: {
          checkIn: status === "PRESENT" ? new Date(date.getTime() + 9 * 60 * 60 * 1000) : null,
          checkOut: status === "PRESENT" ? new Date(date.getTime() + 18 * 60 * 60 * 1000) : null,
          status,
        },
        create: {
          employeeId: emp.id,
          date,
          checkIn: status === "PRESENT" ? new Date(date.getTime() + 9 * 60 * 60 * 1000) : null,
          checkOut: status === "PRESENT" ? new Date(date.getTime() + 18 * 60 * 60 * 1000) : null,
          status,
        },
      });

      seeded.push(record);
    }
  }

  return seeded;
}
