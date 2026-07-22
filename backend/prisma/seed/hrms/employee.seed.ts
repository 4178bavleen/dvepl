import { PrismaClient, Employee } from "@prisma/client";
import { hashPassword } from "../../../src/utils/hashPassword";

const EMPLOYEE_DEFS = [
  {
    employeeCode: "EMP001",
    firstName: "Admin",
    lastName: "HR",
    gender: "MALE",
    deptCode: "HR",
    teamName: "HR Operations",
    desigTitle: "Manager",
    email: "admin.hr@dvepl.com",
  },
  {
    employeeCode: "EMP002",
    firstName: "Rajesh",
    lastName: "Kumar",
    gender: "MALE",
    deptCode: "PROD",
    teamName: "Manufacturing Assembly",
    desigTitle: "Team Lead",
    email: "rajesh.kumar@dvepl.com",
  },
  {
    employeeCode: "EMP003",
    firstName: "Priya",
    lastName: "Sharma",
    gender: "FEMALE",
    deptCode: "SALES",
    teamName: "Domestic Sales",
    desigTitle: "Senior Executive",
    email: "priya.sharma@dvepl.com",
  },
  {
    employeeCode: "EMP004",
    firstName: "Amit",
    lastName: "Patel",
    gender: "MALE",
    deptCode: "ACC",
    teamName: "Accounts Payable",
    desigTitle: "Executive",
    email: "amit.patel@dvepl.com",
  },
  {
    employeeCode: "EMP005",
    firstName: "Sneha",
    lastName: "Reddy",
    gender: "FEMALE",
    deptCode: "HR",
    teamName: "Talent Acquisition",
    desigTitle: "Senior Executive",
    email: "sneha.reddy@dvepl.com",
  },
  {
    employeeCode: "EMP006",
    firstName: "Vikram",
    lastName: "Singh",
    gender: "MALE",
    deptCode: "PROD",
    teamName: "Quality Control",
    desigTitle: "Executive",
    email: "vikram.singh@dvepl.com",
  },
  {
    employeeCode: "EMP007",
    firstName: "Anjali",
    lastName: "Gupta",
    gender: "FEMALE",
    deptCode: "SALES",
    teamName: "International Sales",
    desigTitle: "Executive",
    email: "anjali.gupta@dvepl.com",
  },
  {
    employeeCode: "EMP008",
    firstName: "Sandeep",
    lastName: "Verma",
    gender: "MALE",
    deptCode: "ACC",
    teamName: "Accounts Receivable",
    desigTitle: "Team Lead",
    email: "sandeep.verma@dvepl.com",
  },
  {
    employeeCode: "EMP009",
    firstName: "Kavitha",
    lastName: "Nair",
    gender: "FEMALE",
    deptCode: "PROD",
    teamName: "Manufacturing Assembly",
    desigTitle: "Trainee",
    email: "kavitha.nair@dvepl.com",
  },
  {
    employeeCode: "EMP010",
    firstName: "Manish",
    lastName: "Malhotra",
    gender: "MALE",
    deptCode: "SALES",
    teamName: "Domestic Sales",
    desigTitle: "Trainee",
    email: "manish.malhotra@dvepl.com",
  },
];

/**
 * Seeds a list of default employees.
 * For each employee, a User account is created (if not exists) and linked via userId.
 * This ensures the "Order Taken By" dropdown is populated with valid User IDs.
 *
 * Default password for all employee users: Employee@123
 *
 * @param prisma The Prisma Client instance
 * @param companyId The ID of the seeded company
 * @returns Array of seeded Employee records
 */
export async function seedEmployee(
  prisma: PrismaClient,
  companyId: string
): Promise<Employee[]> {
  console.log("🌱 Seeding 10 Employees with linked User accounts...");

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

  // Fetch the Admin role to assign to employee users
  const adminRole = await prisma.role.findFirst({
    where: { companyId, name: "Admin" },
  });

  const deptMap = new Map(departments.map((d) => [d.code, d.id]));
  const teamMap = new Map(teams.map((t) => [t.name, t.id]));
  const desigMap = new Map(designations.map((d) => [d.title, d.id]));

  const defaultPasswordHash = await hashPassword("Employee@123");

  // 2. For each employee definition, upsert a User and then upsert the Employee
  const results: Employee[] = [];

  for (const def of EMPLOYEE_DEFS) {
    const departmentId = deptMap.get(def.deptCode) || null;
    const teamId = teamMap.get(def.teamName) || null;
    const designationId = desigMap.get(def.desigTitle) || null;

    const dobOffset = (parseInt(def.employeeCode.replace("EMP", "")) % 5) * 2;
    const dateOfBirth = new Date(1985 + dobOffset, 4, 15);
    const dateOfJoining = new Date(2022 + (dobOffset % 3), 0, 1);

    // 2a. Upsert the User record for this employee
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {
        name: `${def.firstName} ${def.lastName}`,
        isActive: true,
      },
      create: {
        companyId,
        name: `${def.firstName} ${def.lastName}`,
        email: def.email,
        passwordHash: defaultPasswordHash,
        isEmailVerified: true,
        isActive: true,
      },
    });

    // 2b. Assign Admin role to the employee user (so they can be selected in dropdowns)
    if (adminRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: adminRole.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          roleId: adminRole.id,
        },
      });
    }

    // 2c. Upsert the Employee and link to the User via userId
    const employee = await prisma.employee.upsert({
      where: { employeeCode: def.employeeCode },
      update: {
        userId: user.id,
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
        userId: user.id,
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

    results.push(employee);
    console.log(`  ✅ Employee ${def.employeeCode} → User: ${user.email} (${user.id})`);
  }

  return results;
}
