import { PrismaClient, Shift } from "@prisma/client";

const DEFAULT_SHIFTS = [
  { name: "Day Shift", startTime: "09:00", endTime: "18:00" },
  { name: "Night Shift", startTime: "21:00", endTime: "06:00" },
];

/**
 * Seeds standard workspace shifts.
 * 
 * @param prisma The Prisma Client instance
 * @returns Array of seeded shifts
 */
export async function seedShift(prisma: PrismaClient): Promise<Shift[]> {
  console.log("🌱 Seeding Shifts...");

  return Promise.all(
    DEFAULT_SHIFTS.map((shift) =>
      prisma.shift.upsert({
        where: {
          name: shift.name,
        },
        update: {
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
        create: {
          name: shift.name,
          startTime: shift.startTime,
          endTime: shift.endTime,
        },
      })
    )
  );
}
