import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const branches = await prisma.branch.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      companyId: true,
    }
  });
  console.log("DATABASE_BRANCHES:", JSON.stringify(branches, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
