import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createGovernmentDepartmentRoute from "./create";
import readGovernmentDepartmentRoutes from "./read";
import updateGovernmentDepartmentRoute from "./update";
import deleteGovernmentDepartmentRoute from "./delete";

async function adminGovernmentDepartmentRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createGovernmentDepartmentRoute, { prefix: "/create" });
  fastify.register(readGovernmentDepartmentRoutes, { prefix: "/read" });
  fastify.register(updateGovernmentDepartmentRoute, { prefix: "/update" });
  fastify.register(deleteGovernmentDepartmentRoute, { prefix: "/delete" });
}

export default adminGovernmentDepartmentRouteGroup;
