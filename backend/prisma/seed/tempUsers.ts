import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../../src/utils/hashPassword";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Temporary Users & Employees Seeding...");

  // Get or default to default company
  let company = await prisma.company.findFirst({
    where: { id: "07ABCDE1234F1Z5" },
  });

  if (!company) {
    company = await prisma.company.findFirst();
  }

  if (!company) {
    console.error("❌ No company found in the database. Please run the main seed first.");
    process.exit(1);
  }

  const companyId = company.id;
  console.log(`Using Company ID: ${companyId}`);

  // Fetch or setup default fields for employee
  const branch = await prisma.branch.findFirst({
    where: { companyId, code: "HO" },
  });
  const department = await prisma.department.findFirst({
    where: { branchId: branch?.id },
  });
  const team = await prisma.team.findFirst({
    where: { departmentId: department?.id },
  });
  const designation = await prisma.designation.findFirst();

  const tempPasswordHash = await hashPassword("Temp@123");

  // Fetch the Admin role to assign to temp users
  const adminRole = await prisma.role.findFirst({
    where: { companyId, name: "Admin" },
  });

  const TEMP_USERS = [
    {
      email: "john.doe@dvepl.com",
      name: "John Doe",
      firstName: "John",
      lastName: "Doe",
      employeeCode: "TEMP001",
    },
    {
      email: "jane.smith@dvepl.com",
      name: "Jane Smith",
      firstName: "Jane",
      lastName: "Smith",
      employeeCode: "TEMP002",
    },
    {
      email: "robert.johnson@dvepl.com",
      name: "Robert Johnson",
      firstName: "Robert",
      lastName: "Johnson",
      employeeCode: "TEMP003",
    },
  ];

  for (const item of TEMP_USERS) {
    // 1. Create/Upsert User
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: item.name,
        isActive: true,
      },
      create: {
        companyId,
        name: item.name,
        email: item.email,
        passwordHash: tempPasswordHash,
        isEmailVerified: true,
        isActive: true,
      },
    });

    // 1b. Assign Admin role to the user so they have permissions
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

    // 2. Create/Upsert Employee
    const employee = await prisma.employee.upsert({
      where: { employeeCode: item.employeeCode },
      update: {
        userId: user.id,
        firstName: item.firstName,
        lastName: item.lastName,
        branchId: branch?.id || null,
        departmentId: department?.id || null,
        teamId: team?.id || null,
        designationId: designation?.id || null,
        status: "ACTIVE",
      },
      create: {
        companyId,
        employeeCode: item.employeeCode,
        userId: user.id,
        firstName: item.firstName,
        lastName: item.lastName,
        branchId: branch?.id || null,
        departmentId: department?.id || null,
        teamId: team?.id || null,
        designationId: designation?.id || null,
        status: "ACTIVE",
      },
    });

    console.log(`✅ Seeded User: ${user.email} -> Employee Code: ${employee.employeeCode}`);
  }

  console.log("🎉 Temporary Users & Employees Seeding Completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
