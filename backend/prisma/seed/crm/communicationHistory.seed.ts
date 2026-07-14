import { PrismaClient, CommunicationHistory, Customer } from "@prisma/client";

/**
 * Seeds CommunicationHistory records for the provided Customers.
 * 
 * @param prisma The Prisma Client instance
 * @param customers List of seeded Customers
 * @returns Array of seeded CommunicationHistory records
 */
export async function seedCommunicationHistory(
  prisma: PrismaClient,
  customers: Customer[]
): Promise<CommunicationHistory[]> {
  console.log("🌱 Seeding Communication History...");

  const customerIds = customers.map((c) => c.id);

  // Clear existing communication history for these customers for idempotency
  await prisma.communicationHistory.deleteMany({
    where: {
      customerId: {
        in: customerIds,
      },
    },
  });

  // Find the admin user to link
  const adminUser = await prisma.user.findUnique({
    where: { email: "admin@vibrantick.com" },
  });

  const commData = [];

  for (const customer of customers) {
    commData.push(
      {
        customerId: customer.id,
        userId: adminUser?.id || null,
        type: "CALL" as const,
        subject: "Initial Discovery Call",
        content: `Discussed technical panel requirements and timelines with ${customer.name}.`,
      },
      {
        customerId: customer.id,
        userId: adminUser?.id || null,
        type: "EMAIL" as const,
        subject: "RFQ Documents Received",
        content: `Acknowledged receipt of RFQ specification documents from ${customer.name}. Sent details to the engineering team.`,
      },
      {
        customerId: customer.id,
        userId: adminUser?.id || null,
        type: "NOTE" as const,
        subject: "Credit Check Approved",
        content: `Internal finance check completed. Standard payment terms set to ${customer.paymentTerms || "Net 30"}.`,
      }
    );
  }

  // Create in bulk
  await prisma.communicationHistory.createMany({
    data: commData,
  });

  return prisma.communicationHistory.findMany({
    where: {
      customerId: {
        in: customerIds,
      },
    },
  });
}
