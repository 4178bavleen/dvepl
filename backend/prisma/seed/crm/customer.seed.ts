import { PrismaClient, Customer } from "@prisma/client";

const CRM_CUSTOMERS = [
  {
    name: "Havells India Ltd",
    gst: "07AAACH1111A1Z1",
    pan: "AAACH1111A",
    billingAddress: "Noida, Uttar Pradesh",
    shippingAddress: "Alwar, Rajasthan",
    paymentTerms: "Net 30",
    firmName: "Havells Group",
    isGovernment: false,
  },
  {
    name: "Indian Railways (Northern Zone)",
    gst: "07AAACR2222R1Z2",
    pan: "AAACR2222R",
    billingAddress: "Baroda House, New Delhi",
    shippingAddress: "New Delhi Railway Station",
    paymentTerms: "Net 60",
    firmName: "Indian Railways",
    isGovernment: true,
  },
  {
    name: "Military Engineer Services (Delhi Command)",
    gst: "07AAACM3333M1Z3",
    pan: "AAACM3333M",
    billingAddress: "Kashmir House, New Delhi",
    shippingAddress: "Delhi Cantonment",
    paymentTerms: "Net 45",
    firmName: "MES",
    isGovernment: true,
  },
  {
    name: "Central Public Works Department",
    gst: "07AAACC4444C1Z4",
    pan: "AAACC4444C",
    billingAddress: "Nirman Bhawan, New Delhi",
    shippingAddress: "Nirman Bhawan, New Delhi",
    paymentTerms: "Net 60",
    firmName: "CPWD",
    isGovernment: true,
  },
  {
    name: "Larsen & Toubro Ltd",
    gst: "27AAAAL5555L1Z5",
    pan: "AAAAL5555L",
    billingAddress: "Mumbai, Maharashtra",
    shippingAddress: "Chennai, Tamil Nadu",
    paymentTerms: "Net 45",
    firmName: "L&T Construction",
    isGovernment: false,
  },
];

/**
 * Seeds CRM customers.
 * 
 * @param prisma The Prisma Client instance
 * @param companyId The ID of the seeded company
 * @returns Array of seeded Customer records
 */
export async function seedCustomer(
  prisma: PrismaClient,
  companyId: string
): Promise<Customer[]> {
  console.log("🌱 Seeding CRM Customers...");

  return Promise.all(
    CRM_CUSTOMERS.map(async (cust) => {
      let customer = await prisma.customer.findFirst({
        where: {
          companyId,
          name: cust.name,
          deletedAt: null,
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            companyId,
            name: cust.name,
            gst: cust.gst,
            pan: cust.pan,
            billingAddress: cust.billingAddress,
            shippingAddress: cust.shippingAddress,
            paymentTerms: cust.paymentTerms,
            firmName: cust.firmName,
            isGovernment: cust.isGovernment,
            isActive: true,
          },
        });
      } else {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: {
            gst: cust.gst,
            pan: cust.pan,
            billingAddress: cust.billingAddress,
            shippingAddress: cust.shippingAddress,
            paymentTerms: cust.paymentTerms,
            firmName: cust.firmName,
            isGovernment: cust.isGovernment,
          },
        });
      }

      return customer;
    })
  );
}
