import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createContactRoute from "./create";
import readContactRoutes from "./read";
import updateContactRoute from "./update";
import deleteContactRoute from "./delete";

async function adminContactRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createContactRoute, { prefix: "/create" });
  fastify.register(readContactRoutes, { prefix: "/read" });
  fastify.register(updateContactRoute, { prefix: "/update" });
  fastify.register(deleteContactRoute, { prefix: "/delete" });
}

export default adminContactRouteGroup;
