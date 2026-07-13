import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeContactRoute from "./create";
import readEmployeeContactRoutes from "./read";
import updateEmployeeContactRoutes from "./update";
import deleteEmployeeContactRoute from "./delete";

async function adminEmployeeContactRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeContactRoute, { prefix: "/create" });
  fastify.register(readEmployeeContactRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeContactRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeContactRoute, { prefix: "/delete" });
}

export default adminEmployeeContactRouteGroup;
