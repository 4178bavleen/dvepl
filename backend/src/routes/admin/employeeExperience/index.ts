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
  fastify.register(readEmployeeExperienceRoutes, { prefix: "/" });
  fastify.register(updateEmployeeExperienceRoutes, { prefix: "/" });
  fastify.register(deleteEmployeeExperienceRoute, { prefix: "/" });
}

export default adminEmployeeExperienceRouteGroup;
