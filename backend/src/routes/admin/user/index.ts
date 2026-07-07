import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createUserRoute from "./create";
import readUsersRoute from "./read";
import readUserbyId from "./readbyId";
import updateUserRoute from "./update";
import deleteUserRoute from "./delete";

async function adminUserRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createUserRoute, { prefix: "/create" });
  fastify.register(readUsersRoute, { prefix: "/" });
  fastify.register(readUserbyId, { prefix: "/" });
  fastify.register(updateUserRoute, { prefix: "/" });
  fastify.register(deleteUserRoute, { prefix: "/" });
}

export default adminUserRouteGroup;