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
  fastify.register(readEmployeeEmergencyContactRoutes, { prefix: "/read" });
  fastify.register(updateEmployeeEmergencyContactRoutes, { prefix: "/update" });
  fastify.register(deleteEmployeeEmergencyContactRoute, { prefix: "/delete" });
}

export default adminEmployeeEmergencyContactRouteGroup;
