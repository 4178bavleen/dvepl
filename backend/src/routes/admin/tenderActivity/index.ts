import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderActivityRoute from "./create";
import readTenderActivityRoutes from "./read";
import deleteTenderActivityRoute from "./delete";

async function adminTenderActivityRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderActivityRoute, { prefix: "/create" });
  fastify.register(readTenderActivityRoutes, { prefix: "/read" });
  fastify.register(deleteTenderActivityRoute, { prefix: "/delete" });
}

export default adminTenderActivityRouteGroup;
