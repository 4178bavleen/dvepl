import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createRoute from "./create";
import adminBranchReadRoutes from './read'
import readBranchByIdRoutes from './readByID'

async function adminBranchRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(createRoute, { prefix: "/create" });
    fastify.register(adminBranchReadRoutes, { prefix: "/" });
    fastify.register(readBranchByIdRoutes, { prefix: "/:id" });
}

export default adminBranchRouteGroup;
