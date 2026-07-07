import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminLoginRoutes from "./login";

async function adminAuthRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(adminLoginRoutes, { prefix: "/login" });
}

export default adminAuthRouteGroup;
