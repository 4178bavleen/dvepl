import { PrismaClient, Employee, EmployeeDocument } from "@prisma/client";

/**
 * Seeds identity and professional documents for multiple employees in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param employees The list of seeded employees
 * @returns List of seeded documents
 */
export async function seedEmployeeDocument(
  prisma: PrismaClient,
  employees: Employee[]
): Promise<EmployeeDocument[]> {
  console.log("🌱 Seeding Employee Documents in bulk...");

  const employeeIds = employees.map((emp) => emp.id);

  // Purge existing records for idempotency
  await prisma.employeeDocument.deleteMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });

  const documentsData: { employeeId: string; documentType: string; fileUrl: string; fileName: string }[] = [];

  for (const emp of employees) {
    const code = emp.employeeCode.toLowerCase();
    documentsData.push(
      { employeeId: emp.id, documentType: "AADHAR", fileUrl: `minio/documents/${code}_aadhar.pdf`, fileName: "aadhar.pdf" },
      { employeeId: emp.id, documentType: "PAN", fileUrl: `minio/documents/${code}_pan.pdf`, fileName: "pan.pdf" }
    );
  }

  // Create documents in bulk
  await prisma.employeeDocument.createMany({
    data: documentsData,
  });

  return prisma.employeeDocument.findMany({
    where: {
      employeeId: {
        in: employeeIds,
      },
    },
  });
}
