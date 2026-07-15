import { FastifyInstance, FastifyPluginOptions } from "fastify";

import readReferenceCodeRoutes from "./read";
import regenerateReferenceCodeRoute from "./regenerate";

async function adminReferenceCodeRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(readReferenceCodeRoutes, { prefix: "/read" });
  fastify.register(regenerateReferenceCodeRoute, { prefix: "/regenerate" });
}

export default adminReferenceCodeRouteGroup;
