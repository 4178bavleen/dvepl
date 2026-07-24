import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminUserRouteGroup from "./user/index";
import adminRoleRouteGroup from "./role";
import adminPermissionRouteGroup from "./permission/index";
import adminRolePermissionRouteGroup from "./rolePermission/index";
import adminDesignationRouteGroup from "./designation/index";
import adminCostCenterRouteGroup from "./costCenter/index";
import accessRoutes from "./access";
import permissionGroupRoutes from "./permissionGroup";

import adminEmployeeRouteGroup from "./employee";
import adminEmployeeContactRouteGroup from "./employeeContact";
import adminEmployeeEmergencyContactRouteGroup from "./employeeEmergencyContact";
import adminEmployeeEducationRouteGroup from "./employeeEducation";
import adminEmployeeExperienceRouteGroup from "./employeeExperience";
import adminEmployeeDocumentRouteGroup from "./employeeDocument";
import adminShiftRouteGroup from "./shift";
import adminEmployeeShiftRouteGroup from "./employeeShift";
import adminHolidayRouteGroup from "./employeeHoliday";
import adminAttendanceRouteGroup from "./employeeAttendance";
import adminLeaveRouteGroup from "./employeeLeave";
import adminSalaryRouteGroup from "./salary";
import adminCustomerRouteGroup from "./customer/index";
import adminContactRouteGroup from "./contact/index";
import adminCommunicationRouteGroup from "./communication/index";
import adminTenderRequestRouteGroup from "./tenderRequest/index";
import adminTenderRequestActivityRouteGroup from "./tenderRequestActivity/index";
import adminTenderRouteGroup from "./tender/index";
import adminReferenceCodeRouteGroup from "./referenceCode/index";
import adminReferenceCodeCounterRouteGroup from "./referenceCodeCounter/index";
import adminTenderFileRouteGroup from "./tenderFile/index";
import adminTenderRemarkRouteGroup from "./tenderRemark/index";
import adminTenderActivityRouteGroup from "./tenderActivity/index";
import adminGovernmentDepartmentRouteGroup from "./governmentDepartment/index";
import adminSectionRouteGroup from "./section/index";
import adminDivisionRouteGroup from "./division/index";
import adminSubDivisionRouteGroup from "./subDivision/index";
import adminDeptRouteGroup from "./department/index";
import adminTeamRouteGroup from "./team/index";
import adminTechnicalClarificationRouteGroup from "./technicalClarification/index";

import adminOrderRouteGroup from "./salesOrder/index";
import adminVendorRouteGroup from "./vendor/index"
import adminTaskRouteGroup from "./task/index";
import adminReportsRouteGroup from "./reports/index";
import adminPaymentRouteGroup from "./payment/index";

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
    instance.register(adminDeptRouteGroup, { prefix: "/department" });
    instance.register(adminTeamRouteGroup, { prefix: "/team" });
    instance.register(adminUserRouteGroup, { prefix: "/user" });
    instance.register(permissionGroupRoutes, {
      prefix: "/permission-group",
    });
    instance.register(adminRoleRouteGroup, {
      prefix: "/role",
    });
    instance.register(adminDesignationRouteGroup, {
      prefix: "/designation",
    });
    instance.register(adminCostCenterRouteGroup, {
      prefix: "/cost-center",
    });
    instance.register(adminPermissionRouteGroup, {
      prefix: "/permission",
    });
    instance.register(adminRolePermissionRouteGroup, {
      prefix: "/role-permission",
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
    instance.register(adminCommunicationRouteGroup, {
      prefix: "/communication",
    });
    instance.register(adminTenderRequestRouteGroup, {
      prefix: "/tender-request",
    });
    instance.register(adminTenderRequestActivityRouteGroup, {
      prefix: "/tender-request-activity",
    });
    instance.register(adminTenderRouteGroup, { prefix: "/tender" });
    instance.register(adminReferenceCodeRouteGroup, {
      prefix: "/reference-code",
    });
    instance.register(adminReferenceCodeCounterRouteGroup, {
      prefix: "/reference-code-counter",
    });
    instance.register(adminTenderFileRouteGroup, { prefix: "/tender-file" });
    instance.register(adminTenderRemarkRouteGroup, {
      prefix: "/tender-remark",
    });
    instance.register(adminTenderActivityRouteGroup, {
      prefix: "/tenderActivity",
    });
    instance.register(adminGovernmentDepartmentRouteGroup, {
      prefix: "/government-department",
    });
    instance.register(adminSectionRouteGroup, { prefix: "/section" });
    instance.register(adminDivisionRouteGroup, { prefix: "/division" });
    instance.register(adminSubDivisionRouteGroup, { prefix: "/sub-division" });
    instance.register(adminTechnicalClarificationRouteGroup, {
      prefix: "/technical-clarification",
    });
    fastify.register(accessRoutes, {
      prefix: "/user/access",
    });
    fastify.register(adminOrderRouteGroup, {
      prefix: "/order",
    });
    fastify.register(adminVendorRouteGroup, {
      prefix: "/vendor",
    });
    fastify.register(adminTaskRouteGroup, {
      prefix: "/task",
    });
    fastify.register(adminReportsRouteGroup, {
      prefix: "/reports",
    });
    fastify.register(adminPaymentRouteGroup, {
      prefix: "/payment",
    });
  });
}

export default adminRoutes;