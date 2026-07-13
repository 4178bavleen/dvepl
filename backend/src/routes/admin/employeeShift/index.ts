import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeShiftRoute from "./create";
import readEmployeeShiftRoutes from "./read";
import updateEmployeeShiftRoutes from "./update";
import deleteEmployeeShiftRoute from "./delete";

async function adminEmployeeShiftRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeShiftRoute, { prefix: "/create" });
  fastify.register(readEmployeeShiftRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeShiftRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeShiftRoute, { prefix: "/delete" });
}

export default adminEmployeeShiftRouteGroup;
