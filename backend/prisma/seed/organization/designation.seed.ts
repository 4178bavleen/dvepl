import { PrismaClient, Designation } from "@prisma/client";

const DEFAULT_DESIGNATIONS = [
  { title: "CEO", level: 1 },
  { title: "Director", level: 2 },
  { title: "Manager", level: 3 },
  { title: "Team Lead", level: 4 },
  { title: "Senior Executive", level: 5 },
  { title: "Executive", level: 6 },
  { title: "Trainee", level: 7 },
];

/**
 * Seeds company designations.
 * 
 * @param prisma The Prisma Client instance
 * @returns Array of all designations
 */
export async function seedDesignation(prisma: PrismaClient): Promise<Designation[]> {
  console.log("🌱 Seeding Designations...");

  return Promise.all(
    DEFAULT_DESIGNATIONS.map((designation) =>
      prisma.designation.upsert({
        where: {
          title: designation.title,
        },
        update: {
          level: designation.level,
        },
        create: {
          title: designation.title,
          level: designation.level,
        },
      })
    )
  );
}
