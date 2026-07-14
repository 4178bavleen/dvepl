import { PrismaClient, ContactPerson, Customer } from "@prisma/client";

/**
 * Seeds ContactPerson records for the provided Customers.
 * 
 * @param prisma The Prisma Client instance
 * @param customers List of seeded Customers
 * @returns Array of seeded ContactPerson records
 */
export async function seedContactPerson(
  prisma: PrismaClient,
  customers: Customer[]
): Promise<ContactPerson[]> {
  console.log("🌱 Seeding Contact Persons...");

  const customerIds = customers.map((c) => c.id);

  // Clear existing contact persons for these customers for idempotency
  await prisma.contactPerson.deleteMany({
    where: {
      customerId: {
        in: customerIds,
      },
    },
  });

  const contactsData: any[] = [];

  for (const customer of customers) {
    if (customer.isGovernment) {
      contactsData.push(
        {
          customerId: customer.id,
          name: "Er. K. P. Singh",
          designation: "Executive Engineer",
          phone: "9811111111",
          email: "kp.singh@gov.in",
          isPrimary: true,
        },
        {
          customerId: customer.id,
          name: "Shri R. K. Sharma",
          designation: "Superintending Engineer",
          phone: "9822222222",
          email: "rk.sharma@gov.in",
          isPrimary: false,
        }
      );
    } else {
      contactsData.push(
        {
          customerId: customer.id,
          name: "Mr. Amit Singhal",
          designation: "Procurement Manager",
          phone: "9833333333",
          email: "amit.singhal@corporate.com",
          isPrimary: true,
        },
        {
          customerId: customer.id,
          name: "Ms. Shalini Sen",
          designation: "Technical Director",
          phone: "9844444444",
          email: "shalini.sen@corporate.com",
          isPrimary: false,
        }
      );
    }
  }

  // Create in bulk
  await prisma.contactPerson.createMany({
    data: contactsData,
  });

  return prisma.contactPerson.findMany({
    where: {
      customerId: {
        in: customerIds,
      },
    },
  });
}
