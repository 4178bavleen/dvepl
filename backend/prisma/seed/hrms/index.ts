import { seedDesignation } from "./desgination.seed";
import { seedShift } from "./shift.seed";
import { seedHoliday } from "./holiday.seed";

export async function seedHrms(prisma: any) {
  console.log("🌱 Seeding HRMS...");

  const designations = await seedDesignation(prisma);

  return {
    designations,
  };
}