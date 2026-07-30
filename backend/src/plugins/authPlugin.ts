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

        console.log("Decoded JWT:", decoded);
        const activeCompanyId = (request.query as any)?.companyId || decoded.companyId;
        if (request.query && (request.query as any).companyId) {
          delete (request.query as any).companyId;
        }

        // Load custom permissions from JSON and merge them dynamically
        const fs = require("fs");
        const path = require("path");
        const permissionsFilePath = path.join(__dirname, "../../data/user_permissions.json");
        let customPermissions: string[] = [];
        if (fs.existsSync(permissionsFilePath)) {
          try {
            const permissionsData = JSON.parse(fs.readFileSync(permissionsFilePath, "utf-8"));
            const up = permissionsData[decoded.userId];
            if (up && up.pageAccess) {
              const pageAccess: string[] = up.pageAccess;
              const actionPermissions = up.actionPermissions || { create: false, edit: false, delete: false, export: false };
              
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
                permissions: ["role"],
                permission_groups: ["role"],
                approval_requests: ["role"],
                reports: ["company", "tender", "employee"],
                audit_logs: ["role"],
                custom_fields: ["company"]
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
          } catch (e) {
            console.error("Error reading custom permissions in authPlugin:", e);
          }
        }

        const mergedPermissions = Array.from(new Set([
          ...(decoded.permissions || []),
          ...customPermissions
        ]));

        const tokenUser = {
          id: decoded.userId,
          companyId: activeCompanyId,
          roles: decoded.roles || [],
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