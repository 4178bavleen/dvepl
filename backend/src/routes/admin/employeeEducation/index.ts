import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeEducationRoute from "./create";
import readEmployeeEducationRoutes from "./read";
import updateEmployeeEducationRoutes from "./update";
import deleteEmployeeEducationRoute from "./delete";

async function adminEmployeeEducationRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeEducationRoute, { prefix: "/create" });
  fastify.register(readEmployeeEducationRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeEducationRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeEducationRoute, { prefix: "/delete" });
}

export default adminEmployeeEducationRouteGroup;
