import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dataDirectory = path.resolve(__dirname, "../data");

function readJson(fileName: string): any {
  const filePath = path.join(dataDirectory, fileName);
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf-8")) : null;
}

async function main() {
  const settings = readJson("settings.json");
  if (settings) {
    const companies = await prisma.company.findMany({ select: { id: true } });
    await Promise.all(companies.map((company) => prisma.companySettings.upsert({
      where: { companyId: company.id },
      create: { companyId: company.id, data: settings },
      update: { data: settings },
    })));
  }

  const accessProfiles = readJson("user_permissions.json") || {};
  for (const [userId, value] of Object.entries(accessProfiles)) {
    const access = value as Record<string, any>;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) continue;

    await prisma.userAccessProfile.upsert({
      where: { userId },
      create: {
        userId,
        designation: access.designation || "Team Member",
        pageAccess: access.pageAccess || [],
        fieldPermissions: access.fieldPermissions || {},
        actionPermissions: access.actionPermissions || { create: true, edit: true, delete: false, export: true },
      },
      update: {
        designation: access.designation || "Team Member",
        pageAccess: access.pageAccess || [],
        fieldPermissions: access.fieldPermissions || {},
        actionPermissions: access.actionPermissions || { create: true, edit: true, delete: false, export: true },
      },
    });
  }
}

main()
  .then(() => console.log("Legacy settings and user access data imported."))
  .finally(() => prisma.$disconnect());
