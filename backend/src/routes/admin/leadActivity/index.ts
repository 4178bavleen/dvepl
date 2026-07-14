import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createLeadActivityRoute from "./create";
import readLeadActivityRoutes from "./read";
import deleteLeadActivityRoute from "./delete";

async function adminLeadActivityRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createLeadActivityRoute, { prefix: "/create" });
  fastify.register(readLeadActivityRoutes, { prefix: "/read" });
  fastify.register(deleteLeadActivityRoute, { prefix: "/delete" });
}

export default adminLeadActivityRouteGroup;
