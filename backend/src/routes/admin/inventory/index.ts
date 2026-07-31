import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminInventoryCreateRoutes from "./create";
import adminInventoryReadRoutes from "./read";
import adminInventoryUpdateRoutes from "./update";
import adminInventoryDeleteRoutes from "./delete";
import adminInventoryStockInRoutes from "./stockIn";
import adminInventoryStockOutRoutes from "./stockOut";
import adminInventoryTrackingRoutes from "./tracking";
import adminInventoryVendorTrackingRoutes from "./vendorTracking/read";
// import adminVendorReadByIdRoutes from "./readByID";
import adminInventoryTransactionReadRoutes from "./transactionRead";

async function adminInventoryRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(adminInventoryCreateRoutes, { prefix: "/create" });
  fastify.register(adminInventoryReadRoutes, { prefix: "/read" });
  // fastify.register(adminVendorReadByIdRoutes, { prefix: "/read" });
  fastify.register(adminInventoryDeleteRoutes, { prefix: "/delete" });
  fastify.register(adminInventoryUpdateRoutes, { prefix: "/update" });
  fastify.register(adminInventoryStockInRoutes, { prefix: "/stock-in" });
  fastify.register(adminInventoryStockOutRoutes, { prefix: "/stock-out" });
  fastify.register(adminInventoryTrackingRoutes, {
    prefix: "/tracking",
  });
  fastify.register(adminInventoryVendorTrackingRoutes, {
    prefix: "/vendor-tracking",
  });
    fastify.register(adminInventoryCreateRoutes, { prefix: "/create" });
    fastify.register(adminInventoryReadRoutes, { prefix: "/read" });
    fastify.register(adminInventoryDeleteRoutes, { prefix: "/delete" });
    fastify.register(adminInventoryUpdateRoutes, { prefix: "/update" });
    fastify.register(adminInventoryStockInRoutes, { prefix: "/stock-in" });
    fastify.register(adminInventoryStockOutRoutes, { prefix: "/stock-out" });
    fastify.register(adminInventoryTransactionReadRoutes, { prefix: "/stock-movement" });
}

export default adminInventoryRouteGroup;
