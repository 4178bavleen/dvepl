import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminVendorCreateRoutes from "./create";
import adminVendorReadRoutes from "./read";
import adminVendorUpdateRoutes from "./update";
import adminVendorDeleteRoutes from "./delete";
import adminVendorReadByIdRoutes from "./readByID";

async function adminVendorRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminVendorCreateRoutes, { prefix: "/create" });
    fastify.register(adminVendorReadRoutes, { prefix: "/read" });
    fastify.register(adminVendorReadByIdRoutes, { prefix: "/read" });
    fastify.register(adminVendorDeleteRoutes, { prefix: "/delete" });
    fastify.register(adminVendorUpdateRoutes, { prefix: "/update" });
}

export default adminVendorRouteGroup;
