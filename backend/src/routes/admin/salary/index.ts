import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createSalaryRoute from "./create";
import readSalaryRoutes from "./read";
import updateSalaryRoutes from "./update";
import deleteSalaryRoute from "./delete";

async function adminSalaryRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createSalaryRoute, { prefix: "/create" });
  fastify.register(readSalaryRoutes, { prefix: "/read" });
  fastify.register(updateSalaryRoutes, { prefix: "/update" });
  fastify.register(deleteSalaryRoute, { prefix: "/delete" });
}

export default adminSalaryRouteGroup;
