import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeExperienceRoute from "./create";
import readEmployeeExperienceRoutes from "./read";
import updateEmployeeExperienceRoutes from "./update";
import deleteEmployeeExperienceRoute from "./delete";

async function adminEmployeeExperienceRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeExperienceRoute, { prefix: "/create" });
  fastify.register(readEmployeeExperienceRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeExperienceRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeExperienceRoute, { prefix: "/delete" });
}

export default adminEmployeeExperienceRouteGroup;
