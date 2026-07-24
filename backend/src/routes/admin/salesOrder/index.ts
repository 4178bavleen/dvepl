import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminSalesOrderCreateRoutes from "./create";
import adminSalesOrderReadRoutes from "./read";
import adminCompanyUpdateRoutes from "./update";
import adminSalesOrderDeleteRoutes from "./delete";
import adminSalesOrderReadByIdRoutes from "./readByID";
import adminSalesOrderBulkUploadRoutes from "./bulkUpload";
import adminSalesOrderDownloadTemplateRoutes from "./downloadTemplate";
import adminSalesOrderPreviewRoutes from "./preview";

async function adminOrderRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminSalesOrderCreateRoutes, { prefix: "/create" });
    fastify.register(adminSalesOrderReadRoutes, { prefix: "/read" });
    fastify.register(adminSalesOrderReadByIdRoutes, { prefix: "/read" });
    fastify.register(adminSalesOrderDeleteRoutes, { prefix: "/delete" });
    fastify.register(adminCompanyUpdateRoutes, { prefix: "/update" });
    fastify.register(adminSalesOrderBulkUploadRoutes, { prefix: "/bulk-upload" });
    fastify.register(adminSalesOrderDownloadTemplateRoutes, { prefix: "/download-template" });
    fastify.register(adminSalesOrderPreviewRoutes, { prefix: "/preview" });
}

export default adminOrderRouteGroup;
