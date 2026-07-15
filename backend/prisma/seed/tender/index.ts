import { PrismaClient } from "@prisma/client";
import { seedTenderModule } from "./tender.seed";

interface SeedTenderParams {
  companyId: string;
}

/**
 * Coordinates and seeds the entire Tender Management module.
 *
 * @param prisma The Prisma Client instance
 * @param params Context parameters containing companyId
 */
export async function seedTender(
  prisma: PrismaClient,
  { companyId }: SeedTenderParams
): Promise<void> {
  await seedTenderModule(prisma, companyId);
}
