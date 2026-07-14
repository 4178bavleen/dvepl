import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createLeaveRoute from "./create";
import readLeaveRoutes from "./read";
import updateLeaveRoutes from "./update";
import deleteLeaveRoute from "./delete";

async function adminLeaveRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createLeaveRoute, { prefix: "/create" });
  fastify.register(readLeaveRoutes, { prefix: "/read" });
  fastify.register(updateLeaveRoutes, { prefix: "/update" });
  fastify.register(deleteLeaveRoute, { prefix: "/delete" });
}

export default adminLeaveRouteGroup;
