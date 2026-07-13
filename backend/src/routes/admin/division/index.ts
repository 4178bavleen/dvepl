import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createDivisionRoute from "./create";
import readDivisionRoutes from "./read";
import updateDivisionRoute from "./update";
import deleteDivisionRoute from "./delete";

async function adminDivisionRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createDivisionRoute, { prefix: "/create" });
  fastify.register(readDivisionRoutes, { prefix: "/read" });
  fastify.register(updateDivisionRoute, { prefix: "/update" });
  fastify.register(deleteDivisionRoute, { prefix: "/delete" });
}

export default adminDivisionRouteGroup;
