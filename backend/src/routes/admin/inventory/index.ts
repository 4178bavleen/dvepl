import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminInventoryCreateRoutes from "./create";
import adminInventoryReadRoutes from "./read";
import adminInventoryUpdateRoutes from "./update";
import adminInventoryDeleteRoutes from "./delete";
import adminInventoryStockInRoutes from "./stockIn"
// import adminVendorReadByIdRoutes from "./readByID";

async function adminInventoryRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminInventoryCreateRoutes, { prefix: "/create" });
    fastify.register(adminInventoryReadRoutes, { prefix: "/read" });
    // fastify.register(adminVendorReadByIdRoutes, { prefix: "/read" });
    fastify.register(adminInventoryDeleteRoutes, { prefix: "/delete" });
    fastify.register(adminInventoryUpdateRoutes, { prefix: "/update" });
     fastify.register(adminInventoryStockInRoutes, { prefix: "/stock-movement/create" });
}

export default adminInventoryRouteGroup;
