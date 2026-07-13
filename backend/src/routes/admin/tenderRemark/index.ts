import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderRemarkRoute from "./create";
import readTenderRemarkRoutes from "./read";

async function adminTenderRemarkRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderRemarkRoute, { prefix: "/create" });
  fastify.register(readTenderRemarkRoutes, { prefix: "/read" });
}

export default adminTenderRemarkRouteGroup;
