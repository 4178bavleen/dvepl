import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderRequestRoute from "./create";
import readTenderRequestRoutes from "./read";
import updateTenderRequestRoute from "./update";
import deleteTenderRequestRoute from "./delete";

async function adminTenderRequestRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderRequestRoute, { prefix: "/create" });
  fastify.register(readTenderRequestRoutes, { prefix: "/read" });
  fastify.register(updateTenderRequestRoute, { prefix: "/update" });
  fastify.register(deleteTenderRequestRoute, { prefix: "/delete" });
}

export default adminTenderRequestRouteGroup;
