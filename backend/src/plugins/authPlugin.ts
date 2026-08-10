import fp from "fastify-plugin";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { adminLogs as AdminLogger } from "../services/logger/contextLogger";

const swaggerSafePaths = ["/docs", "/swagger"];

type ActionName = "create" | "edit" | "delete" | "export";
type ModuleActions = Record<ActionName, boolean>;

const legacyActionDefaults: ModuleActions = {
  create: true,
  edit: true,
  delete: false,
  export: true,
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);

const isLegacyActionPermissions = (value: unknown): value is Partial<ModuleActions> =>
  isRecord(value) && ["create", "edit", "delete", "export"].some((action) => typeof value[action] === "boolean");

const getModuleActions = (value: unknown, moduleKey: string): ModuleActions => {
  if (!value || isLegacyActionPermissions(value)) {
    const legacy = (value || {}) as Partial<ModuleActions>;
    return {
      create: legacy.create ?? legacyActionDefaults.create,
      edit: legacy.edit ?? legacyActionDefaults.edit,
      delete: legacy.delete ?? legacyActionDefaults.delete,
      export: legacy.export ?? legacyActionDefaults.export,
    };
  }

  const moduleActions = isRecord(value) ? value[moduleKey] : undefined;
  if (!isRecord(moduleActions)) return { create: false, edit: false, delete: false, export: false };

  return {
    create: moduleActions.create === true,
    edit: moduleActions.edit === true,
    delete: moduleActions.delete === true,
    export: moduleActions.export === true,
  };
};

const getModuleForRequest = (url: string): string | null => {
  const routeModules: Array<[string, string]> = [
    ["/company/", "companies"], ["/branch/", "branches"], ["/department/", "departments"],
    ["/team/", "teams"], ["/designation/", "designations"], ["/cost-center/", "cost_centers"],
    ["/employee/", "employees"], ["/attendance/", "attendance"], ["/leave/", "leaves"],
    ["/holiday/", "holidays"], ["/shift/", "shift_management"], ["/salary/", "payroll"],
    ["/employee-document/", "documents"], ["/task/", "tasks"], ["/customer/", "customers"],
    ["/contact/", "contacts"], ["/communication/", "communication"], ["/sales-order/", "orders"],
    ["/order/", "orders"], ["/vendor/", "vendors"], ["/inventory/", "inventory"],
    ["/tender-request/", "tender_requests"], ["/tender/", "tenders"],
    ["/technical-clarification/", "technical_clarifications"], ["/government-department/", "government_departments"],
    ["/section/", "sections"], ["/division/", "divisions"], ["/sub-division/", "sub_divisions"],
    ["/reference-code/", "reference_codes"], ["/user/", "users"], ["/role/", "roles"],
    ["/settings/", "settings"],
  ];
  return routeModules.find(([path]) => url.includes(path))?.[1] ?? null;
};

// API routes that do not have a module-specific URL still declare a legacy
// permission code.  Use its resource name only to locate the corresponding
// page-access setting; the permission code itself is never authorized.
const getModuleForPermission = (permissions: string[]): string | null => {
  const prefixToModule: Record<string, string> = {
    company: "companies",
    branch: "branches",
    employee: "employees",
    customer: "customers",
    tenderRequest: "tender_requests",
    tender: "tenders",
    user: "users",
    role: "roles",
  };

  for (const permission of permissions) {
    const prefix = permission.split(".")[0];
    if (prefixToModule[prefix]) return prefixToModule[prefix];
  }
  return null;
};

const getRequiredAction = (url: string, permissions: string[]): ActionName | null => {
  if (url.includes("/create") || url.includes("/bulk")) return "create";
  if (url.includes("/update") || url.includes("/edit")) return "edit";
  if (url.includes("/delete") || url.includes("/remove")) return "delete";
  if (permissions.some((permission) => permission.includes(".create"))) return "create";
  if (permissions.some((permission) => permission.includes(".update") || permission.includes(".edit"))) return "edit";
  if (permissions.some((permission) => permission.includes(".delete") || permission.includes(".remove"))) return "delete";
  return null;
};

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
                role: true,
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

        const up = dbUser.accessProfile;

        const tokenUser = {
          id: decoded.userId,
          companyId: activeCompanyId,
          roles: dbUser.userRoles.map((ur) => ur.role.name) || [],
          uiAccessProfile: up
            ? {
                pageAccess: up.pageAccess as string[],
                actionPermissions: up.actionPermissions,
              }
            : null,
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

        const uiAccessProfile = (request.admin as any)?.uiAccessProfile;
        const moduleKey = getModuleForRequest(request.url) ?? getModuleForPermission(allowedPermissions);

        // Page/action access profiles are the single source of authorization.
        // Role permissions and per-user database overrides are deliberately not
        // consulted here.
        if (!uiAccessProfile || !moduleKey) {
          AdminLogger.warn("Unauthorized Permission", {
            endpoint: request.url,
            method: request.method,
            userId: request.admin?.id,
          });

          return reply.status(403).send({
            success: false,
            message: "Access denied: page access profile is missing.",
          });
        }

        const pageAccess = Array.isArray(uiAccessProfile.pageAccess)
          ? uiAccessProfile.pageAccess
          : [];
        const requiredAction = getRequiredAction(request.url, allowedPermissions);
        const hasPageAccess = pageAccess.includes(moduleKey);
        const hasActionAccess = !requiredAction || getModuleActions(
          uiAccessProfile.actionPermissions,
          moduleKey,
        )[requiredAction];

        if (!hasPageAccess || !hasActionAccess) {
          return reply.status(403).send({
            success: false,
            message: "Access denied: insufficient page permissions.",
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
