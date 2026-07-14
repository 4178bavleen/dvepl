import { FastifyInstance, FastifyPluginOptions } from "fastify";

import adminCreateTeamRoute from "./create";
// import adminReadTeamRoute from "./read";
// import adminUpdateTeamRoute from "./update";
// import adminDeleteTeamRoute from "./delete";

async function adminEmployeeRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(adminCreateTeamRoute, { prefix: "/create" });
//   fastify.register(readEmployeeRoutes, { prefix: "/read" });
//   fastify.register(updateEmployeeRoutes, { prefix: "/update" });
//   fastify.register(deleteEmployeeRoute, { prefix: "/delete" });
}

export default adminEmployeeRouteGroup;
