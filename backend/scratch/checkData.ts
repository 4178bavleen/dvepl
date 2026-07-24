import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const ordersCount = await prisma.salesOrder.count();
  const vendorsCount = await prisma.vendor.count();
  console.log("DATA_SUMMARY:", { ordersCount, vendorsCount });

  if (ordersCount > 0) {
    const orders = await prisma.salesOrder.findMany({
      take: 5,
      select: { id: true, dveplCode: true, partyName: true, deletedAt: true }
    });
    console.log("SAMPLE_ORDERS:", orders);
  }

  if (vendorsCount > 0) {
    const vendors = await prisma.vendor.findMany({
      take: 5,
      select: { id: true, name: true, deletedAt: true }
    });
    console.log("SAMPLE_VENDORS:", vendors);
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
