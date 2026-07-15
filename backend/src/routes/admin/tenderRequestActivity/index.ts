import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderRequestActivityRoute from "./create";
import readTenderRequestActivityRoutes from "./read";
import deleteTenderRequestActivityRoute from "./delete";

async function adminTenderRequestActivityRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderRequestActivityRoute, { prefix: "/create" });
  fastify.register(readTenderRequestActivityRoutes, { prefix: "/read" });
  fastify.register(deleteTenderRequestActivityRoute, { prefix: "/delete" });
}

export default adminTenderRequestActivityRouteGroup;
