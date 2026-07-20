import { PrismaClient, Employee } from "@prisma/client";

const EMPLOYEE_DEFS = [
  {
    employeeCode: "EMP001",
    firstName: "Admin",
    lastName: "HR",
    gender: "MALE",
    deptCode: "HR",
    teamName: "HR Operations",
    desigTitle: "Manager",
    isLinkUser: true,
  },
  {
    employeeCode: "EMP002",
    firstName: "Rajesh",
    lastName: "Kumar",
    gender: "MALE",
    deptCode: "PROD",
    teamName: "Manufacturing Assembly",
    desigTitle: "Team Lead",
  },
  {
    employeeCode: "EMP003",
    firstName: "Priya",
    lastName: "Sharma",
    gender: "FEMALE",
    deptCode: "SALES",
    teamName: "Domestic Sales",
    desigTitle: "Senior Executive",
  },
  {
    employeeCode: "EMP004",
    firstName: "Amit",
    lastName: "Patel",
    gender: "MALE",
    deptCode: "ACC",
    teamName: "Accounts Payable",
    desigTitle: "Executive",
  },
  {
    employeeCode: "EMP005",
    firstName: "Sneha",
    lastName: "Reddy",
    gender: "FEMALE",
    deptCode: "HR",
    teamName: "Talent Acquisition",
    desigTitle: "Senior Executive",
  },
  {
    employeeCode: "EMP006",
    firstName: "Vikram",
    lastName: "Singh",
    gender: "MALE",
    deptCode: "PROD",
    teamName: "Quality Control",
    desigTitle: "Executive",
  },
  {
    employeeCode: "EMP007",
    firstName: "Anjali",
    lastName: "Gupta",
    gender: "FEMALE",
    deptCode: "SALES",
    teamName: "International Sales",
    desigTitle: "Executive",
  },
  {
    employeeCode: "EMP008",
    firstName: "Sandeep",
    lastName: "Verma",
    gender: "MALE",
    deptCode: "ACC",
    teamName: "Accounts Receivable",
    desigTitle: "Team Lead",
  },
  {
    employeeCode: "EMP009",
    firstName: "Kavitha",
    lastName: "Nair",
    gender: "FEMALE",
    deptCode: "PROD",
    teamName: "Manufacturing Assembly",
    desigTitle: "Trainee",
  },
  {
    employeeCode: "EMP010",
    firstName: "Manish",
    lastName: "Malhotra",
    gender: "MALE",
    deptCode: "SALES",
    teamName: "Domestic Sales",
    desigTitle: "Trainee",
  },
];

/**
 * Seeds a list of default employees linked to organization structures.
 * 
 * @param prisma The Prisma Client instance
 * @param companyId The ID of the seeded company
 * @returns Array of seeded Employee records
 */
export async function seedEmployee(
  prisma: PrismaClient,
  companyId: string
): Promise<Employee[]> {
  console.log("🌱 Seeding 10 Employees...");

  // 1. Fetch organization entities to establish relation keys
  const branch = await prisma.branch.findFirst({
    where: { companyId, code: "HO" },
  });

  const departments = await prisma.department.findMany({
    where: { branchId: branch?.id },
  });

  const teams = await prisma.team.findMany({
    where: { departmentId: { in: departments.map((d) => d.id) } },
  });

  const designations = await prisma.designation.findMany();

  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@vibrantick.com" },
  });

  const deptMap = new Map(departments.map((d) => [d.code, d.id]));
  const teamMap = new Map(teams.map((t) => [t.name, t.id]));
  const desigMap = new Map(designations.map((d) => [d.title, d.id]));

  // 2. Map and Upsert each employee
  return Promise.all(
    EMPLOYEE_DEFS.map((def) => {
      const departmentId = deptMap.get(def.deptCode) || null;
      const teamId = teamMap.get(def.teamName) || null;
      const designationId = desigMap.get(def.desigTitle) || null;
      const userId = def.isLinkUser ? adminUser?.id : null;

      // Make up some dates of birth and joining
      const dobOffset = (parseInt(def.employeeCode.replace("EMP", "")) % 5) * 2;
      const dateOfBirth = new Date(1985 + dobOffset, 4, 15);
      const dateOfJoining = new Date(2022 + (dobOffset % 3), 0, 1);

      return prisma.employee.upsert({
        where: {
          employeeCode: def.employeeCode,
        },
        update: {
          userId,
          branchId: branch?.id || null,
          departmentId,
          teamId,
          designationId,
          firstName: def.firstName,
          lastName: def.lastName,
          gender: def.gender,
          dateOfBirth,
          dateOfJoining,
          status: "ACTIVE",
        },
        create: {
          companyId,
          employeeCode: def.employeeCode,
          userId,
          branchId: branch?.id || null,
          departmentId,
          teamId,
          designationId,
          firstName: def.firstName,
          lastName: def.lastName,
          gender: def.gender,
          dateOfBirth,
          dateOfJoining,
          status: "ACTIVE",
        },
      });
    })
  );
}
