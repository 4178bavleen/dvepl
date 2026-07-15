import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createRoute from "./create";
import adminBranchReadRoutes from './read'
import readBranchByIdRoutes from './readByID'
import updateBranchRoutes from './update'

async function adminBranchRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(createRoute, { prefix: "/create" });
    fastify.register(adminBranchReadRoutes, { prefix: "/" });
    fastify.register(readBranchByIdRoutes, { prefix: "/:id" });
     fastify.register(updateBranchRoutes, { prefix: "/:id" });
}

export default adminBranchRouteGroup;
