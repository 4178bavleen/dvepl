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
  fastify.register(readEmployeeContactRoutes, { prefix: "/" });
  fastify.register(updateEmployeeContactRoutes, { prefix: "/" });
  fastify.register(deleteEmployeeContactRoute, { prefix: "/" });
}

export default adminEmployeeContactRouteGroup;
