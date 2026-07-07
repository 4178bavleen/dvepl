
export async function seedDepartment(prisma:any,branchId: string) {
  const departments = [
    { name: "Sales", code: "SALES" },
    { name: "Human Resources", code: "HR" },
    { name: "Accounts", code: "ACC" },
    { name: "Production", code: "PROD" },
  ];

  return Promise.all(
    departments.map((department) =>
      prisma.department.upsert({
        where: {
          branchId_code: {
            branchId,
            code: department.code,
          },
        },
        update: {
          name: department.name,
        },
        create: {
          branchId,
          name: department.name,
          code: department.code,
        },
      })
    )
  );
}