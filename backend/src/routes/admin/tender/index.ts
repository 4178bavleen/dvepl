import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderRoute from "./create";
import readTenderRoutes from "./read";
import updateTenderRoute from "./update";
import deleteTenderRoute from "./delete";

async function adminTenderRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderRoute, { prefix: "/create" });
  fastify.register(readTenderRoutes, { prefix: "/read" });
  fastify.register(updateTenderRoute, { prefix: "/update" });
  fastify.register(deleteTenderRoute, { prefix: "/delete" });
}

export default adminTenderRouteGroup;
