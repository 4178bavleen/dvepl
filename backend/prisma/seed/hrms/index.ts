import { seedDesignation } from "./desgination.seed";
import { seedShift } from "./shift.seed";
import { seedHoliday } from "./holiday.seed";

export async function seedHRMS() {
  console.log(" Seeding HRMS...");

  const designations = await seedDesignation();

  const shifts = await seedShift();

  const holidays = await seedHoliday();

  return {
    designations,
    shifts,
    holidays,
  };
}