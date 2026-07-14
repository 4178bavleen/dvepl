import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createCommunicationRoute from "./create";
import readCommunicationRoutes from "./read";
import deleteCommunicationRoute from "./delete";

async function adminCommunicationRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createCommunicationRoute, { prefix: "/create" });
  fastify.register(readCommunicationRoutes, { prefix: "/read" });
  fastify.register(deleteCommunicationRoute, { prefix: "/delete" });
}

export default adminCommunicationRouteGroup;
