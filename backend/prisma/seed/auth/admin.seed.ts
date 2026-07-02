import bcrypt from "bcrypt";

export async function seedAdmin(prisma: any, companyId: string) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);

    return prisma.user.upsert({
        where: {
            email: "admin@vibrantick.com",
        },
        update: {
            isActive: true,
            isEmailVerified: true
        },
        create: {
            companyId,
            email: "admin@vibrantick.com",
            passwordHash,
            isEmailVerified: true,
        },
    });
}