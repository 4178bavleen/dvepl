
export async function seedBranch(prisma:any,companyId: string) {
  return prisma.branch.upsert({
    where: {
      companyId_code: {
        companyId,
        code: "HO",
      },
    },
    update: {
      name: "Head Office",
      city: "Delhi",
      state: "Delhi",
      isActive: true,
    },
    create: {
      companyId,
      name: "Head Office",
      code: "HO",
      city: "Delhi",
      state: "Delhi",
      isActive: true,
    },
  });
}
