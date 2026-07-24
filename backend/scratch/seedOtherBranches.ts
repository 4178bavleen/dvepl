import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found to associate branches with.");
    return;
  }

  const companyId = company.id;
  console.log(`Using Company ID: ${companyId}`);

  const branches = [
    { name: "Mumbai HQ", code: "MUM" },
    { name: "Pune Plant", code: "PUN" },
    { name: "Delhi Office", code: "DEL" }
  ];

  for (const b of branches) {
    const branch = await prisma.branch.upsert({
      where: {
        companyId_code: {
          companyId,
          code: b.code
        }
      },
      update: {
        name: b.name,
        isActive: true
      },
      create: {
        companyId,
        name: b.name,
        code: b.code,
        isActive: true
      }
    });
    console.log(`Upserted Branch: ${branch.name} (${branch.id})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
