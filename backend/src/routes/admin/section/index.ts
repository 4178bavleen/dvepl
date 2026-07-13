import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createSectionRoute from "./create";
import readSectionRoutes from "./read";
import updateSectionRoute from "./update";
import deleteSectionRoute from "./delete";

async function adminSectionRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createSectionRoute, { prefix: "/create" });
  fastify.register(readSectionRoutes, { prefix: "/read" });
  fastify.register(updateSectionRoute, { prefix: "/update" });
  fastify.register(deleteSectionRoute, { prefix: "/delete" });
}

export default adminSectionRouteGroup;
