import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createRoute from "./create";

async function adminBranchRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(createRoute, { prefix: "/create" });
}

export default adminBranchRouteGroup;
