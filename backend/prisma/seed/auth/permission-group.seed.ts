import prisma from "../../client";
import { PERMISSION_GROUPS } from "./constants";

export async function seedPermissionGroups() {
  console.log(" Seeding Permission Groups...");

  const groups = Object.values(PERMISSION_GROUPS);

  const createdGroups = await Promise.all(
    groups.map((name) =>
      prisma.permissionGroup.upsert({
        where: {
          name,
        },
        update: {},
        create: {
          name,
        },
      })
    )
  );

  return createdGroups;
}