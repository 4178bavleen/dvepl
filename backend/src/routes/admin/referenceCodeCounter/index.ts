import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createCounterRoute from "./create";
import readCounterRoutes from "./read";
import updateCounterRoute from "./update";
import deleteCounterRoute from "./delete";

async function adminReferenceCodeCounterRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createCounterRoute, { prefix: "/create" });
  fastify.register(readCounterRoutes, { prefix: "/read" });
  fastify.register(updateCounterRoute, { prefix: "/update" });
  fastify.register(deleteCounterRoute, { prefix: "/delete" });
}

export default adminReferenceCodeCounterRouteGroup;
