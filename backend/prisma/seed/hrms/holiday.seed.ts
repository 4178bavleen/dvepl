import { PrismaClient, Holiday } from "@prisma/client";

const DEFAULT_HOLIDAYS = [
  { name: "New Year's Day", date: new Date("2026-01-01"), type: "NATIONAL" },
  { name: "Republic Day", date: new Date("2026-01-26"), type: "NATIONAL" },
  { name: "Independence Day", date: new Date("2026-08-15"), type: "NATIONAL" },
  { name: "Gandhi Jayanti", date: new Date("2026-10-02"), type: "NATIONAL" },
  { name: "Christmas Day", date: new Date("2026-12-25"), type: "NATIONAL" },
];

/**
 * Seeds standard national holidays.
 * 
 * @param prisma The Prisma Client instance
 * @returns Array of seeded holidays
 */
export async function seedHoliday(prisma: PrismaClient): Promise<Holiday[]> {
  console.log("🌱 Seeding Holidays...");

  return Promise.all(
    DEFAULT_HOLIDAYS.map((holiday) =>
      prisma.holiday.upsert({
        where: {
          name: holiday.name,
        },
        update: {
          date: holiday.date,
          type: holiday.type,
        },
        create: {
          name: holiday.name,
          date: holiday.date,
          type: holiday.type,
        },
      })
    )
  );
}
