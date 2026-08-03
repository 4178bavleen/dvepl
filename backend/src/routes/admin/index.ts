import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminRoleRouteGroup from "./role";
import adminUserRouteGroup from "./user/index";
import adminDesignationRouteGroup from "./designation/index";
import adminSettingsRouteGroup from "./settings/index";
import adminCostCenterRouteGroup from "./costCenter/index";
import accessRoutes from "./access";

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
import adminInventoryRouteGroup from "./inventory/index";
import inventoryTrackingRoutes from "./inventoryTracking/index"

import adminOrderRouteGroup from "./salesOrder/index";
import adminVendorRouteGroup from "./vendor/index";
import adminTaskRouteGroup from "./task/index";
import adminReportsRouteGroup from "./reports/index";
import adminPaymentRouteGroup from "./payment/index";
import adminVendorProductRouteGroup from "./vendorProduct/index";
import goodsReceiptRoutes from "./goodsRecipt";

// import notificationRoutes from "./notification";

import { FastifyInstance, FastifyPluginOptions } from "fastify";

import adminCustomFieldRouteGroup from "./customField/index";
import recycleBinRoutes from "./recycleBin/index";
import purchaseOrderRoutes from './purchaseOrder'

async function adminRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // Public routes
  fastify.register(adminAuthRouteGroup, { prefix: "/auth" });
  fastify.register(adminCustomFieldRouteGroup, { prefix: "/custom-fields" });
  fastify.register(recycleBinRoutes, { prefix: "/recycle-bin" });

  fastify.register(async function rolesGroup(instance, opts) {
    //runs automatically before every req
    instance.addHook("preHandler", async (req, reply) => {
      await instance.verifyToken(req, reply); // 1️⃣ Verify token

      // Determine required permissions dynamically based on the request URL and method
      const url = req.url;
      let requiredPermissions: string[] = [];

      if (url.includes("/company/")) {
        if (url.includes("/create")) requiredPermissions = ["company.create"];
        else if (url.includes("/update")) requiredPermissions = ["company.update"];
        else if (url.includes("/delete")) requiredPermissions = ["company.delete"];
        else if (url.includes("/read")) requiredPermissions = ["company.view"];
      } else if (url.includes("/branch/")) {
        if (url.includes("/create")) requiredPermissions = ["branch.create"];
        else if (url.includes("/update")) requiredPermissions = ["branch.update"];
        else if (url.includes("/delete")) requiredPermissions = ["branch.delete"];
        else if (url.includes("/read")) requiredPermissions = ["branch.view"];
      } else if (url.includes("/department/") || url.includes("/designation/") || url.includes("/cost-center/") || url.includes("/team/")) {
        if (url.includes("/create")) requiredPermissions = ["employee.create"];
        else if (url.includes("/update")) requiredPermissions = ["employee.update"];
        else if (url.includes("/delete")) requiredPermissions = ["employee.delete"];
        else if (url.includes("/read")) requiredPermissions = ["employee.view"];
      } else if (url.includes("/employee/")) {
        if (url.includes("/create")) requiredPermissions = ["employee.create"];
        else if (url.includes("/update")) requiredPermissions = ["employee.update"];
        else if (url.includes("/delete")) requiredPermissions = ["employee.delete"];
        else if (url.includes("/read")) requiredPermissions = ["employee.view"];
      } else if (url.includes("/settings/")) {
        // Settings are administrative, allow company.update, company.create, or role.update
        requiredPermissions = ["company.update", "company.create", "role.update"];
      } else if (url.includes("/order/")) {
        if (url.includes("/create") || url.includes("/update") || url.includes("/delete") || url.includes("/bulk")) {
          requiredPermissions = ["company.create", "tender.update"];
        } else {
          requiredPermissions = ["company.view", "tender.view"];
        }
      } else if (url.includes("/vendor/")) {
        if (url.includes("/create") || url.includes("/update") || url.includes("/delete")) {
          requiredPermissions = ["company.create", "tender.update"];
        } else {
          requiredPermissions = ["company.view", "tender.view"];
        }
      }

      // If we identified specific required permissions, authorize them
      if (requiredPermissions.length > 0) {
        await instance.authorizePermissions(requiredPermissions)(req, reply);
      }
    });

    instance.register(adminBranchRouteGroup, { prefix: "/branch" });
    instance.register(adminCompanyRouteGroup, { prefix: "/company" });
    instance.register(adminDeptRouteGroup, { prefix: "/department" });
    instance.register(adminTeamRouteGroup, { prefix: "/team" });
    instance.register(adminRoleRouteGroup, {
      prefix: "/role",
    });
    instance.register(adminUserRouteGroup, {
      prefix: "/user",
    });
    instance.register(adminDesignationRouteGroup, {
      prefix: "/designation",
    });
    instance.register(adminCostCenterRouteGroup, {
      prefix: "/cost-center",
    });
    instance.register(adminSettingsRouteGroup, {
      prefix: "/settings",
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
    instance.register(accessRoutes, {
      prefix: "/user/access",
    });
    instance.register(adminOrderRouteGroup, {
      prefix: "/order",
    });
    instance.register(adminVendorRouteGroup, {
      prefix: "/vendor",
    });
    instance.register(adminTaskRouteGroup, {
      prefix: "/task",
    });
    instance.register(adminReportsRouteGroup, {
      prefix: "/reports",
    });
    instance.register(adminPaymentRouteGroup, {
      prefix: "/payment",
    });
    instance.register(adminInventoryRouteGroup, {
      prefix: "/inventory",
    });
    instance.register(adminVendorProductRouteGroup, {
      prefix: "/vendor-product",
    });
    fastify.register(inventoryTrackingRoutes, {
    prefix: "/inventory-tracking",
});
   fastify.register(goodsReceiptRoutes, {
  prefix: "/goods-receipt",
});
  fastify.register(purchaseOrderRoutes, {
  prefix: "/purchase-order",
});
  });
}

export default adminRoutes;
