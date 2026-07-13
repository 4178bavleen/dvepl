import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminUserRouteGroup from "./user/index";
import adminRoleRouteGroup from "./role";
import adminPermissionRouteGroup from "./permission/index";
import accessRoutes from "./access";
import permissionGroupRoutes from "./permissionGroup";


import adminEmployeeRouteGroup from './employee'
import adminEmployeeContactRouteGroup from './employeeContact'
import adminEmployeeEmergencyContactRouteGroup from './employeeEmergencyContact'
import adminEmployeeEducationRouteGroup from './employeeEducation'
import adminEmployeeExperienceRouteGroup from './employeeExperience'
import adminEmployeeDocumentRouteGroup from './employeeDocument'
import adminShiftRouteGroup from './shift'
import adminEmployeeShiftRouteGroup from './employeeShift'
import adminHolidayRouteGroup from './holiday'
import adminAttendanceRouteGroup from './attendance'
import adminLeaveRouteGroup from './leave'
import adminSalaryRouteGroup from './salary'
import adminCustomerRouteGroup from "./customer/index"
import adminContactRouteGroup from "./contact/index"
import adminCommunicationRouteGroup from "./communication/index"
import adminLeadRouteGroup from "./lead/index"
import adminLeadActivityRouteGroup from "./leadActivity/index"
import adminTenderRouteGroup from "./tender/index"
import adminTenderFileRouteGroup from "./tenderFile/index"
import adminTenderRemarkRouteGroup from "./tenderRemark/index"
import adminTenderActivityRouteGroup from "./tenderActivity/index"
import adminGovernmentDepartmentRouteGroup from "./governmentDepartment/index"
import adminSectionRouteGroup from "./section/index"
import adminDivisionRouteGroup from "./division/index"
import adminSubDivisionRouteGroup from "./subDivision/index"

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
    instance.register(adminCustomerRouteGroup, { prefix: "/customer" });
    instance.register(adminContactRouteGroup, { prefix: "/contact" });
    instance.register(adminCommunicationRouteGroup, { prefix: "/communication" });
    instance.register(adminLeadRouteGroup, { prefix: "/lead" });
    instance.register(adminLeadActivityRouteGroup, { prefix: "/leadActivity" });
    instance.register(adminTenderRouteGroup, { prefix: "/tender" });
    instance.register(adminTenderFileRouteGroup, { prefix: "/tender-file" });
    instance.register(adminTenderRemarkRouteGroup, { prefix: "/tender-remark" });
    instance.register(adminTenderActivityRouteGroup, { prefix: "/tenderActivity" });
    instance.register(adminGovernmentDepartmentRouteGroup, { prefix: "/government-department" });
    instance.register(adminSectionRouteGroup, { prefix: "/section" });
    instance.register(adminDivisionRouteGroup, { prefix: "/division" });
    instance.register(adminSubDivisionRouteGroup, { prefix: "/sub-division" });
    fastify.register(accessRoutes, {
      prefix: "/user/access",
    });
   
  });
}

export default adminRoutes;
