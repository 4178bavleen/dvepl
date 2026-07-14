import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminUserRouteGroup from "./user/index";
import adminRoleRouteGroup from "./role";
import adminPermissionRouteGroup from "./permission/index";
import accessRoutes from "./access";
import permissionGroupRoutes from "./permission-group";


import adminEmployeeRouteGroup from './employee'
import adminEmployeeContactRouteGroup from './employeeContact'
import adminEmployeeEmergencyContactRouteGroup from './employee-emergency-contact'
import adminEmployeeEducationRouteGroup from './employee-education'
import adminEmployeeExperienceRouteGroup from './employeeExperience'
import adminEmployeeDocumentRouteGroup from './employeeDocument'
import adminShiftRouteGroup from './employeeShift'
import adminEmployeeShiftRouteGroup from './employeeShift'
import adminHolidayRouteGroup from './employeeHoliday'
import adminAttendanceRouteGroup from './employeeAttendance'
import adminLeaveRouteGroup from './employeeLeave'
import adminSalaryRouteGroup from './salary'


import { FastifyInstance, FastifyPluginOptions } from "fastify";

async function adminRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // Public routes
  fastify.register(adminAuthRouteGroup, { prefix: "/auth" });

  fastify.register(async function rolesGroup(instance, opts) {
    //runs automatically before every req
    instance.addHook("preHandler", async (req, reply) => {
      await instance.verifyToken(req, reply); // 1️⃣ Verify token
      await instance.authorizePermissions(["company.create"])(req, reply); // 2️⃣ Verify role
    });

    instance.register(adminBranchRouteGroup, { prefix: "/branch" });
    instance.register(adminCompanyRouteGroup, { prefix: "/company" });
    instance.register(adminUserRouteGroup, { prefix: "/user" });
     instance.register(permissionGroupRoutes, {
      prefix: "/permission-group",
    });
    instance.register(adminRoleRouteGroup, {
      prefix: "/role",
    });
    instance.register(adminPermissionRouteGroup, {
      prefix: "/permission",
    });
    instance.register(adminEmployeeRouteGroup, {
      prefix: "/employee",
    });
    instance.register(adminEmployeeContactRouteGroup, {
      prefix: "/employee-contact",
    });
    instance.register(adminEmployeeEmergencyContactRouteGroup, {
      prefix: "/employee-emergency-contact",
    });
    instance.register(adminEmployeeEducationRouteGroup, {
      prefix: "/employee-education",
    });
    instance.register(adminEmployeeExperienceRouteGroup, {
      prefix: "/employee-experience",
    });
    instance.register(adminEmployeeDocumentRouteGroup, {
      prefix: "/employee-document",
    });
    instance.register(adminShiftRouteGroup, {
      prefix: "/shift",
    });
    instance.register(adminEmployeeShiftRouteGroup, {
      prefix: "/employee-shift",
    });
    instance.register(adminHolidayRouteGroup, {
      prefix: "/holiday",
    });
    instance.register(adminAttendanceRouteGroup, {
      prefix: "/attendance",
    });
    instance.register(adminLeaveRouteGroup, {
      prefix: "/leave",
    });
    instance.register(adminSalaryRouteGroup, {
      prefix: "/salary",
    });
    fastify.register(accessRoutes, {
      prefix: "/user/access",
    });
   
  });
}

export default adminRoutes;
