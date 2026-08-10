import { FastifyInstance, FastifyPluginOptions } from "fastify";

import adminCreateTeamRoute from "./create";
import readTeamRoutes from "./read";
import getTeamByIdRoutes from "./readByID";
import updateTeamRoutes from "./update";
import deleteTeamRoutes from "./delete";
import teamMemberRoutes from "./members";

async function adminTeamRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(adminCreateTeamRoute, { prefix: "/create" });
  fastify.register(readTeamRoutes, { prefix: "/read" });
  fastify.register(getTeamByIdRoutes, { prefix: "/read" });
  fastify.register(updateTeamRoutes, { prefix: "/update" });
  fastify.register(deleteTeamRoutes, { prefix: "/delete" });
  fastify.register(teamMemberRoutes, { prefix: "/members" });
}

export default adminTeamRouteGroup;
