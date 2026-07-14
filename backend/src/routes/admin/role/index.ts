import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createRoleRoute from "./create";
import getAllRolesRoute from "./read";
import readRoleByIdRoute from "./readbyId";
import updateRoleRoute from "./update";

async function adminRoleRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(createRoleRoute, {
    prefix: "/create",
  });

  fastify.register(getAllRolesRoute, {
    prefix: "/",
  });
  fastify.register(readRoleByIdRoute, {
    prefix: "/",
  });
  fastify.register(updateRoleRoute, {
    prefix: "/",
  });
}

export default adminRoleRouteGroup;
