import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminVendorProductCreateRoutes from "./create";
import adminVendorProductReadRoutes from "./read";
// import adminVendorUpdateRoutes from "./update";
import adminVendorProductDeleteRoutes from "./delete";
// import adminVendorReadByIdRoutes from "./readByID";

async function adminVendorProductRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminVendorProductCreateRoutes, { prefix: "/create" });
    fastify.register(adminVendorProductReadRoutes, { prefix: "/read" });
    fastify.register(adminVendorProductDeleteRoutes, { prefix: "/delete" });

}

export default adminVendorProductRouteGroup;
