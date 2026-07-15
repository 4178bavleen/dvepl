import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

async function readUserAccessRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/:id",
    {
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["user.view"]),
      ],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => {
      try {
        const companyId = request.admin?.companyId;

        if (!companyId) {
          return reply.status(401).send({
            success: false,
            message: "Company information missing.",
          });
        }

        const { id } = request.params as { id: string };

        const user = await fastify.prisma.user.findFirst({
          where: {
            id,
            companyId,
            deletedAt: null,
          },

          include: {
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: {
                          include: {
                            group: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },

            userPermissions: {
              include: {
                permission: {
                  include: {
                    group: true,
                  },
                },
              },
            },
          },
        });

        if (!user) {
          return reply.status(404).send({
            success: false,
            message: "User not found.",
          });
        }

        //-------------------------------------------------------
        // Group Permissions & Apply Overrides
        //-------------------------------------------------------

        const allPermissions = await fastify.prisma.permission.findMany({
          include: {
            group: true,
          },
          orderBy: {
            code: "asc",
          },
        });

        // Set up lookup structures for role permissions and overrides
        const rolePermissionIds = new Set<string>();
        for (const userRole of user.userRoles) {
          for (const rp of userRole.role.rolePermissions) {
            rolePermissionIds.add(rp.permissionId);
          }
        }

        const overrideAllowedMap = new Map<string, boolean>();
        for (const up of user.userPermissions) {
          overrideAllowedMap.set(up.permissionId, up.allowed);
        }

        const permissionGroupsMap = new Map<
          string,
          {
            groupId: string;
            groupName: string;
            permissions: any[];
          }
        >();

        for (const permission of allPermissions) {
          const groupId = permission.group?.id ?? "ungrouped";
          const groupName = permission.group?.name ?? "Other";

          if (!permissionGroupsMap.has(groupId)) {
            permissionGroupsMap.set(groupId, {
              groupId,
              groupName,
              permissions: [],
            });
          }

          const group = permissionGroupsMap.get(groupId)!;

          const isAssignedByRole = rolePermissionIds.has(permission.id);
          const override = overrideAllowedMap.get(permission.id);

          // If override is defined, it dictates the status. Otherwise, fall back to role default.
          const enabled = override !== undefined ? override : isAssignedByRole;

          // Determine source label for UI
          let source = "none";
          if (override !== undefined) {
            source = "override";
          } else if (isAssignedByRole) {
            source = "role";
          }

          group.permissions.push({
            id: permission.id,
            code: permission.code,
            description: permission.description,
            enabled,
            editable: true,
            source,
          });
        }

        // ======================================================
        // Sort Groups and Permissions
        // ======================================================
        const permissionGroups = Array.from(permissionGroupsMap.values())
          .map((group) => ({
            ...group,
            permissions: group.permissions.sort((a, b) =>
              a.code.localeCompare(b.code),
            ),
          }))
          .sort((a, b) => {
            if (a.groupId === "ungrouped") return 1;
            if (b.groupId === "ungrouped") return -1;
            return a.groupName.localeCompare(b.groupName);
          });

        // ======================================================
        // Response
        // ======================================================

        return reply.send({
          success: true,
          data: {
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              phone: user.phone,
              isActive: user.isActive,

              roles: user.userRoles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.name,
              })),
            },

            permissionGroups,
          },
        });
      } catch (error: any) {
        return reply.status(500).send({
          success: false,
          message: error.message,
        });
      }
    },
  );
}

export default readUserAccessRoute;
