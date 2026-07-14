import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createSubDivisionRoute from "./create";
import readSubDivisionRoutes from "./read";
import updateSubDivisionRoute from "./update";
import deleteSubDivisionRoute from "./delete";

async function adminSubDivisionRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createSubDivisionRoute, { prefix: "/create" });
  fastify.register(readSubDivisionRoutes, { prefix: "/read" });
  fastify.register(updateSubDivisionRoute, { prefix: "/update" });
  fastify.register(deleteSubDivisionRoute, { prefix: "/delete" });
}

export default adminSubDivisionRouteGroup;
