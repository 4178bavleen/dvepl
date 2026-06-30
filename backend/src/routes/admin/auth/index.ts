import { FastifyInstance, FastifyPluginOptions } from "fastify";
import loginRoute from "./login";

async function adminAuthRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(loginRoute, { prefix: "/login" });
}

export default adminAuthRouteGroup;
