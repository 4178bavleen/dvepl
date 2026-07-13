import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createLeadRoute from "./create";
import readLeadRoutes from "./read";
import updateLeadRoute from "./update";
import deleteLeadRoute from "./delete";

async function adminLeadRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createLeadRoute, { prefix: "/create" });
  fastify.register(readLeadRoutes, { prefix: "/read" });
  fastify.register(updateLeadRoute, { prefix: "/update" });
  fastify.register(deleteLeadRoute, { prefix: "/delete" });
}

export default adminLeadRouteGroup;
