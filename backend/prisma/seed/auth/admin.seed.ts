
import {hashPassword , comparePassword} from "../../../src/utils/hashPassword";

export async function seedAdmin(prisma: any, companyId: string) {
    const passwordHash = await hashPassword("Admin@123");

    const adminUser = await prisma.user.upsert({
        where: {
            email: "admin@dvepl.com",
        },
        update: {
            isActive: true,
            isEmailVerified: true,
        },
        create: {
            companyId,
            name:"Admin",
            email: "admin@dvepl.com",
            passwordHash,
            isEmailVerified: true,
        },
    });

    const adminRole = await prisma.role.findFirst({
        where: {
            name: "Admin",
        },
    });

    if (!adminRole) {
        throw new Error("Admin role not found");
    }

    await prisma.userRole.upsert({
        where: {
            userId_roleId: {
                userId: adminUser.id,
                roleId: adminRole.id,
            },
        },
        update: {},
        create: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    return adminUser;
}