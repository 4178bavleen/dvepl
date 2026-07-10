import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeEmergencyContactRoute from "./create";
import readEmployeeEmergencyContactRoutes from "./read";
import updateEmployeeEmergencyContactRoutes from "./update";
import deleteEmployeeEmergencyContactRoute from "./delete";

async function adminEmployeeEmergencyContactRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeEmergencyContactRoute, { prefix: "/create" });
  fastify.register(readEmployeeEmergencyContactRoutes, { prefix: "/" });
  fastify.register(updateEmployeeEmergencyContactRoutes, { prefix: "/" });
  fastify.register(deleteEmployeeEmergencyContactRoute, { prefix: "/" });
}

export default adminEmployeeEmergencyContactRouteGroup;
