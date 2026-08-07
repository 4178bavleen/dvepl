import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { adminLogs as AdminLogger } from "../services/logger/contextLogger";

const swaggerSafePaths = ["/docs", "/swagger"];

async function authPlugin(fastify: FastifyInstance) {
  // ==========================
  // Verify JWT
  // ==========================
  fastify.decorate(
    "verifyToken",
    async function verifyToken(request: FastifyRequest, reply: FastifyReply) {
      try {
        // Skip Swagger routes
        if (swaggerSafePaths.some((p) => request.url.startsWith(p))) {
          return;
        }

        const authHeader = request.headers.authorization;

        if (!authHeader?.startsWith("Bearer ")) {
          return reply.status(401).send({
            success: false,
            message: "Invalid Token Format",
          });
        }

        const decoded: any = await request.jwtVerify();

        const dbUser = await fastify.prisma.user.findFirst({
          where: {
            id: decoded.userId,
            isActive: true,
            deletedAt: null,
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
            userPermissions: {
              include: {
                permission: true,
              },
            },
            accessProfile: true,
          },
        });

        if (!dbUser) {
          return reply.status(401).send({
            success: false,
            message: "User account is inactive or has been deleted.",
          });
        }
        const activeCompanyId = (request.query as any)?.companyId || decoded.companyId;
        if (request.query && (request.query as any).companyId) {
          delete (request.query as any).companyId;
        }

        // Compute dynamic permissions from roles & custom overrides in database
        const rolePermissionsSet = new Set<string>();
        for (const userRole of dbUser.userRoles) {
          for (const rp of userRole.role.rolePermissions) {
            rolePermissionsSet.add(rp.permission.code);
          }
        }

        if (dbUser.userPermissions) {
          for (const up of dbUser.userPermissions) {
            if (up.allowed) {
              rolePermissionsSet.add(up.permission.code);
            } else {
              rolePermissionsSet.delete(up.permission.code);
            }
          }
        }
        const dbPermissions = Array.from(rolePermissionsSet);

        // Compute custom permissions from UserAccessProfile
        let customPermissions: string[] = [];
        let forceNoCreate = false;
        let forceNoEdit = false;
        let forceNoDelete = false;

        const up = dbUser.accessProfile;
        if (up) {
          const actionPermissions = (up.actionPermissions || { create: true, edit: true, delete: false, export: true }) as {
            create?: boolean;
            edit?: boolean;
            delete?: boolean;
            export?: boolean;
          };
          if (actionPermissions.create === false) forceNoCreate = true;
          if (actionPermissions.edit === false) forceNoEdit = true;
          if (actionPermissions.delete === false) forceNoDelete = true;

          if (up.pageAccess) {
            const pageAccess = up.pageAccess as string[];
            
            // Map module keys to backend permission prefixes
            const moduleToPrefixMap: Record<string, string[]> = {
              dashboard: ["dashboard"],
              companies: ["company"],
              branches: ["branch"],
              departments: ["employee"],
              teams: ["employee"],
              designations: ["employee"],
              cost_centers: ["employee"],
              employees: ["employee"],
              attendance: ["employee"],
              leaves: ["employee"],
              holidays: ["employee"],
              shift_management: ["employee"],
              payroll: ["employee"],
              documents: ["employee"],
              tasks: ["employee"],
              customers: ["customer"],
              contacts: ["customer"],
              communication: ["customer"],
              orders: ["company", "tender"],
              delivery: ["company", "tender"],
              vendors: ["company", "tender"],
              inventory: ["company", "tender"],
              finance: ["company", "tender"],
              tender_requests: ["tenderRequest"],
              tenders: ["tender"],
              technical_clarifications: ["tender"],
              government_departments: ["tender"],
              sections: ["tender"],
              divisions: ["tender"],
              sub_divisions: ["tender"],
              reference_codes: ["tender"],
              users: ["user"],
              roles: ["role"],
              approval_requests: ["role"],
              reports: ["company", "tender", "employee"],
              audit_logs: ["role"],
              custom_fields: ["company"],
              export_orders: ["tender"]
            };

            const computedPermissions = new Set<string>();
            for (const page of pageAccess) {
              const prefixes = moduleToPrefixMap[page] || [];
              for (const prefix of prefixes) {
                // View permission
                computedPermissions.add(`${prefix}.view`);
                
                // Action permissions
                if (actionPermissions.create) {
                  computedPermissions.add(`${prefix}.create`);
                }
                if (actionPermissions.edit) {
                  computedPermissions.add(`${prefix}.update`);
                }
                if (actionPermissions.delete) {
                  computedPermissions.add(`${prefix}.delete`);
                }
              }
            }
            customPermissions = Array.from(computedPermissions);
          }
        }

        let mergedPermissions = Array.from(new Set([
          ...dbPermissions,
          ...customPermissions
        ]));

        if (forceNoCreate) {
          mergedPermissions = mergedPermissions.filter(
            (p) => !p.endsWith(".create") && !p.includes(".create.")
          );
        }
        if (forceNoEdit) {
          mergedPermissions = mergedPermissions.filter(
            (p) =>
              !p.endsWith(".update") &&
              !p.endsWith(".edit") &&
              !p.includes(".update.") &&
              !p.includes(".edit.")
          );
        }
        if (forceNoDelete) {
          mergedPermissions = mergedPermissions.filter(
            (p) =>
              !p.endsWith(".delete") &&
              !p.endsWith(".remove") &&
              !p.includes(".delete.") &&
              !p.includes(".remove.")
          );
        }

        const tokenUser = {
          id: decoded.userId,
          companyId: activeCompanyId,
          roles: dbUser.userRoles.map((ur) => ur.role.name) || [],
          permissions: mergedPermissions,
        };
        (request as any).user = tokenUser;
        (request as any).admin = tokenUser;
      } catch (error: any) {
        AdminLogger.error(`JWT Verification Failed: ${error}`);

        return reply.status(401).send({
          success: false,
          message: "Invalid or expired token",
        });
      }
    }
  );

  // ==========================
  // Role Authorization
  // ==========================
 fastify.decorate(
  "authorizePermissions",
  function authorizePermissions(allowedPermissions: string[]) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // Skip Swagger routes
        if (swaggerSafePaths.some((p) => request.url.startsWith(p))) {
          return;
        }

        const userPermissions = (request.admin as any)?.permissions || [];

        const hasPermission = userPermissions.some((permission: string) =>
          allowedPermissions.includes(permission)
        );

        if (!hasPermission) {
          AdminLogger.warn("Unauthorized Permission", {
            endpoint: request.url,
            method: request.method,
            userId: request.admin?.id,
            permissions: userPermissions,
          });

          return reply.status(403).send({
            success: false,
            message: "Access denied: Insufficient permissions.",
          });
        }
      } catch (error: any) {
        AdminLogger.error(`Permission Authorization Failed: ${error}`);

        return reply.status(500).send({
          success: false,
          message: "Server error during authorization.",
        });
      }
    };
  }
);
}

export default fp(authPlugin, {
  name: "auth-plugin",
});
