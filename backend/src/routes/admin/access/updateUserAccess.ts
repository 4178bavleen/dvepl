import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";

interface Body {
    permissionIds: string[];
}

async function updateUserAccessRoute(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.put(
        "/:id",
        {
            preHandler: [
                fastify.verifyToken,
                fastify.authorizePermissions(["user.update"]),
            ],
        },
        async (
            request: FastifyRequest,
            reply: FastifyReply
        ) => {
            try {
                const companyId = request.admin?.companyId;

                if (!companyId) {
                    return reply.status(401).send({
                        success: false,
                        message: "Company missing.",
                    });
                }

                const { id } = request.params as { id: string };
                const { permissionIds } = request.body as Body;

                const user = await fastify.prisma.user.findFirst({
                    where: {
                        id,
                        companyId,
                        deletedAt: null,
                    },
                });

                if (!user) {
                    return reply.status(404).send({
                        success: false,
                        message: "User not found.",
                    });
                }
                console.log("permissionIds:", permissionIds);

          await fastify.prisma.$transaction(async (tx) => {
            // 1. Fetch user roles to find which permissions are granted by roles
            const userRoles = await tx.userRole.findMany({
              where: { userId: id },
              include: {
                role: {
                  include: {
                    rolePermissions: true,
                  },
                },
              },
            });

            const rolePermissionIds = new Set(
              userRoles.flatMap((ur) =>
                ur.role.rolePermissions.map((rp) => rp.permissionId)
              )
            );

            // 2. Fetch all permissions to validate inputs
            const allPermissions = await tx.permission.findMany({
              select: { id: true },
            });
            const validPermissionIds = new Set(allPermissions.map((p) => p.id));

            const desiredIds = new Set(permissionIds || []);

            // 3. Clear existing custom overrides
            await tx.userPermission.deleteMany({
              where: {
                userId: id,
              },
            });

            // 4. Calculate delta overrides (ALLOW / DENY)
            const overridesToCreate: {
              userId: string;
              permissionId: string;
              allowed: boolean;
            }[] = [];

            // We look at the union of desired permission IDs and role permission IDs
            const unionOfPermissions = new Set([...desiredIds, ...rolePermissionIds]);

            for (const permissionId of unionOfPermissions) {
              // Ignore any permission ID that does not exist in the database
              if (!validPermissionIds.has(permissionId)) {
                continue;
              }

              const isDesired = desiredIds.has(permissionId);
              const hasRole = rolePermissionIds.has(permissionId);

              if (isDesired && !hasRole) {
                // Not in role, but desired -> ALLOW override
                overridesToCreate.push({
                  userId: id,
                  permissionId,
                  allowed: true,
                });
              } else if (!isDesired && hasRole) {
                // In role, but not desired -> DENY override
                overridesToCreate.push({
                  userId: id,
                  permissionId,
                  allowed: false,
                });
              }
            }

            if (overridesToCreate.length > 0) {
              await tx.userPermission.createMany({
                data: overridesToCreate,
                skipDuplicates: true,
              });
            }
          });

                return reply.send({
                    success: true,
                    message: "Permissions updated successfully.",
                });
            } catch (error: any) {
                return reply.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        }
    );
}

export default updateUserAccessRoute;