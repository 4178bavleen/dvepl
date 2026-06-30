import readRoutes from "./read";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

async function adminReportRouteGroup(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Public routes
    fastify.register(readRoutes, { prefix: "/read" });
}


export default adminReportRouteGroup;