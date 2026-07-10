import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createShiftRoute from "./create";
import readShiftRoutes from "./read";
import updateShiftRoutes from "./update";
import deleteShiftRoute from "./delete";

async function adminShiftRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createShiftRoute, { prefix: "/create" });
  fastify.register(readShiftRoutes, { prefix: "/" });
  fastify.register(updateShiftRoutes, { prefix: "/" });
  fastify.register(deleteShiftRoute, { prefix: "/" });
}

export default adminShiftRouteGroup;
