import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeRoute from "./create";
import readEmployeeRoutes from "./read";
import updateEmployeeRoutes from "./update";
import deleteEmployeeRoute from "./delete";

async function adminEmployeeRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeRoute, { prefix: "/create" });
  fastify.register(readEmployeeRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeRoute, { prefix: "/delete" });
}

export default adminEmployeeRouteGroup;
