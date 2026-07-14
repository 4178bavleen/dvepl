import { PrismaClient, Customer, ContactPerson, CommunicationHistory } from "@prisma/client";
import { seedCustomer } from "./customer.seed";
import { seedContactPerson } from "./contactPerson.seed";
import { seedCommunicationHistory } from "./communicationHistory.seed";

interface SeedCrmParams {
  companyId: string;
}

/**
 * Coordinates and seeds the entire CRM Module (Customers, Contact Persons, Communication History).
 * 
 * @param prisma The Prisma Client instance
 * @param params Context parameters containing companyId
 * @returns Object holding all seeded CRM entities
 */
export async function seedCrm(
  prisma: PrismaClient,
  { companyId }: SeedCrmParams
): Promise<{
  customers: Customer[];
  contacts: ContactPerson[];
  communicationLogs: CommunicationHistory[];
}> {
  console.log("🌱 Seeding CRM Module...");

  const customers = await seedCustomer(prisma, companyId);
  const contacts = await seedContactPerson(prisma, customers);
  const communicationLogs = await seedCommunicationHistory(prisma, customers);

  return {
    customers,
    contacts,
    communicationLogs,
  };
}
