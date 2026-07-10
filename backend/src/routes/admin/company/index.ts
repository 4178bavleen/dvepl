import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminCompanycreateRoutes from "./create";
import adminCompanyReadRoutes from "./read";
import adminCompanyUpdateRoutes from "./update";
import adminCompanyDeleteRoutes from "./delete";
import readCompanyByIdRoute from "./readByID";

async function adminCompanyRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminCompanycreateRoutes, { prefix: "/create" });
    fastify.register(adminCompanyReadRoutes, { prefix: "/read" });
    fastify.register(readCompanyByIdRoute, { prefix: "/read" });
     fastify.register(adminCompanyDeleteRoutes, { prefix: "/delete" });
    fastify.register(adminCompanyUpdateRoutes, { prefix: "/update" });
}

export default adminCompanyRouteGroup;
