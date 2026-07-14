import { PrismaClient, Employee, EmployeeEmergencyContact } from "@prisma/client";

/**
 * Seeds emergency contacts for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded emergency contacts
 */
export async function seedEmployeeEmergencyContact(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeEmergencyContact[]> {
  console.log("🌱 Seeding Employee Emergency Contacts in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeEmergencyContact.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const contactsData = employees.map((emp) => {
    const codeNum = emp.employeeCode.replace("EMP", "");
    return {
      employeeId: emp.id,
      name: `Relation of ${emp.firstName}`,
      relationship: parseInt(codeNum) % 2 === 0 ? "Spouse" : "Parent",
      phone: `91111${codeNum}222`,
    };
  });

  // Create emergency contacts in bulk
  await prisma.employeeEmergencyContact.createMany({
    data: contactsData,
  });

  return prisma.employeeEmergencyContact.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
