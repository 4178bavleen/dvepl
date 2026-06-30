

import { PrismaClient } from "@prisma/client";

// 1. Extend the globalThis object so TypeScript recognizes our prisma variable
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 2. Instantiate PrismaClient if it doesn't already exist on the global object
export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// 3. In development, save the instance to the global object to prevent
//    re-instantiation during hot reloads.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}