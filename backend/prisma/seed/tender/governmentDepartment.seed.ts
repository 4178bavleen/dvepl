import { PrismaClient, GovernmentDepartment } from "@prisma/client";

const GOV_DEPTS = [
  { name: "Military Engineer Services", code: "GOV-MES", shortName: "MES" },
  { name: "Central Public Works Department", code: "GOV-CPWD", shortName: "CPWD" },
  { name: "Public Works Department", code: "GOV-PWD", shortName: "PWD" },
  { name: "National Highways Authority of India", code: "GOV-NHAI", shortName: "NHAI" },
  { name: "Delhi Metro Rail Corporation", code: "GOV-DMRC", shortName: "DMRC" },
  { name: "National Thermal Power Corporation", code: "GOV-NTPC", shortName: "NTPC" },
  { name: "Bharat Heavy Electricals Limited", code: "GOV-BHEL", shortName: "BHEL" },
  { name: "Oil and Natural Gas Corporation", code: "GOV-ONGC", shortName: "ONGC" },
  { name: "Steel Authority of India Limited", code: "GOV-SAIL", shortName: "SAIL" },
  { name: "Gas Authority of India Limited", code: "GOV-GAIL", shortName: "GAIL" },
];

/**
 * Seeds 10 Government Departments.
 */
export async function seedGovernmentDepartments(
  prisma: PrismaClient,
  companyId: string
): Promise<GovernmentDepartment[]> {
  console.log("🌱 Seeding 10 Government Departments...");

  return Promise.all(
    GOV_DEPTS.map(async (deptData) => {
      let dept = await prisma.governmentDepartment.findFirst({
        where: { name: deptData.name, companyId },
      });

      if (!dept) {
        dept = await prisma.governmentDepartment.create({
          data: {
            companyId,
            name: deptData.name,
            code: deptData.code,
            shortName: deptData.shortName,
            isActive: true,
          },
        });
      }
      return dept;
    })
  );
}
