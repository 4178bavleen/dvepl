import { PrismaClient, Employee, EmployeeContact } from "@prisma/client";

/**
 * Seeds contact details for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded contacts
 */
export async function seedEmployeeContact(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeContact[]> {
  console.log("🌱 Seeding Employee Contacts in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeContact.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const contactsData: { employeeId: string; type: "PHONE" | "EMAIL" | "ADDRESS"; value: string; isPrimary: boolean }[] = [];

  for (const emp of employees) {
    const emailPrefix = `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}`;
    const codeNum = emp.employeeCode.replace("EMP", "");

    contactsData.push(
      { employeeId: emp.id, type: "PHONE", value: `98765${codeNum}432`, isPrimary: true },
      { employeeId: emp.id, type: "EMAIL", value: `${emailPrefix}@vibrantick.com`, isPrimary: true },
      { employeeId: emp.id, type: "ADDRESS", value: `Delhi Sector ${codeNum}`, isPrimary: false }
    );
  }

  // Bulk create contacts
  await prisma.employeeContact.createMany({
    data: contactsData,
  });

  return prisma.employeeContact.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
