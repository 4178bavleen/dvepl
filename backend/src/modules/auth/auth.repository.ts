import { prisma } from "../../lib/prisma";

export class AuthRepository {
   async findUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: {
      email,
    },

    include: {
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });
}
async createRefreshToken(data: {
    userId: string;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
}) {
    return prisma.refreshToken.create({
        data,
    });
}
async revokeRefreshToken(token: string) {
    return prisma.refreshToken.update({
        where: {
            token,
        },

        data: {
            revoked: true,
        },
    });
}
async findRefreshToken(token: string) {
    return prisma.refreshToken.findUnique({
        where: {
            token,
        },

        include: {
            user: true,
        },
    });
}


}