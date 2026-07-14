import { PrismaClient, Shift, Holiday, Employee } from "@prisma/client";
import { seedShift } from "./shift.seed";
import { seedHoliday } from "./holiday.seed";
import { seedEmployee } from "./employee.seed";
import { seedEmployeeContact } from "./employeeContact.seed";
import { seedEmployeeEmergencyContact } from "./employeeEmergencyContact.seed";
import { seedEmployeeEducation } from "./employeeEducation.seed";
import { seedEmployeeExperience } from "./employeeExperience.seed";
import { seedEmployeeDocument } from "./employeeDocument.seed";
import { seedEmployeeShift } from "./employeeShift.seed";
import { seedAttendance } from "./attendance.seed";
import { seedLeave } from "./leave.seed";
import { seedSalary } from "./salary.seed";

interface SeedHrmsParams {
  companyId: string;
}

/**
 * Coordinates and seeds the entire HRMS Module, including 10 employees and their sub-relations in bulk.
 * 
 * @param prisma The Prisma Client instance
 * @param params Context parameters containing companyId
 * @returns Object holding all seeded HRMS entities
 */
export async function seedHrms(
  prisma: PrismaClient,
  { companyId }: SeedHrmsParams
) {
  console.log("🌱 Seeding HRMS Module...");

  // 1. Seed global HRMS master data
  const shifts = await seedShift(prisma);
  const holidays = await seedHoliday(prisma);

  // 2. Seed 10 employee base records
  const employees = await seedEmployee(prisma, companyId);

  // 3. Seed employee-related structural and historical data in bulk
  const contacts = await seedEmployeeContact(prisma, employees);
  const emergencyContacts = await seedEmployeeEmergencyContact(prisma, employees);
  const education = await seedEmployeeEducation(prisma, employees);
  const experience = await seedEmployeeExperience(prisma, employees);
  const documents = await seedEmployeeDocument(prisma, employees);
  const shiftAssignments = await seedEmployeeShift(prisma, employees);
  const attendance = await seedAttendance(prisma, employees);
  const leaves = await seedLeave(prisma, employees);
  const salary = await seedSalary(prisma, employees);

  return {
    shifts,
    holidays,
    employees,
    contacts,
    emergencyContacts,
    education,
    experience,
    documents,
    shiftAssignments,
    attendance,
    leaves,
    salary,
  };
}
