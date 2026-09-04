import { FastifyInstance, FastifyPluginOptions } from "fastify";

import readShiftRoutes from "./read";

async function adminShiftRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(readShiftRoutes, { prefix: "/read" });
}

export default adminShiftRouteGroup;
