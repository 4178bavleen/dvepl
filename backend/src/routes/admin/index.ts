import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminUserRouteGroup from "./user/index";
import adminRoleRouteGroup from "./role";
import adminPermissionRouteGroup from "./permission/index";
import adminEmployeeRouteGroup from "./employee/index";
import adminEmployeeContactRouteGroup from "./employee-contact/index";
import adminEmployeeEmergencyContactRouteGroup from "./employee-emergency-contact/index";
import adminEmployeeEducationRouteGroup from "./employee-education/index";
import adminEmployeeExperienceRouteGroup from "./employee-experience/index";
import adminEmployeeDocumentRouteGroup from "./employee-document/index";
import adminShiftRouteGroup from "./shift/index";
import adminEmployeeShiftRouteGroup from "./employee-shift/index";
import adminHolidayRouteGroup from "./holiday/index";
import adminAttendanceRouteGroup from "./attendance/index";
import adminLeaveRouteGroup from "./leave/index";
import adminSalaryRouteGroup from "./salary/index";
import accessRoutes from "./access";
import adminCustomerRouteGroup from "./customer/index";
import adminContactRouteGroup from "./contact/index";
import adminCommunicationRouteGroup from "./communication/index";
import adminLeadRouteGroup from "./lead/index";
import adminLeadActivityRouteGroup from "./leadActivity/index";

import { FastifyInstance, FastifyPluginOptions } from "fastify";

async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Public routes
    fastify.register(adminAuthRouteGroup, { prefix: "/auth" });

    fastify.register(async function rolesGroup(instance, opts) {


        //runs automatically before every req
        instance.addHook("preHandler", async (req, reply) => {
            await instance.verifyToken(req, reply);  // 1️⃣ Verify token
            await instance.authorizePermissions(["company.create"])(req, reply);  // 2️⃣ Verify role
        });

        instance.register(adminBranchRouteGroup, { prefix: "/branch" });
        instance.register(adminCompanyRouteGroup, { prefix: "/company" });
        instance.register(adminUserRouteGroup, { prefix: "/user" });
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
        fastify.register(accessRoutes,{
            prefix:"/user/access"
        });

    });

}


export default adminRoutes;


