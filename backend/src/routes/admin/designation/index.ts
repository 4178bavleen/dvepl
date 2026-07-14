import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createDesignationRoutes from "./create";
import readDesignationRoutes from "./read";
import getDesignationByIdRoutes from "./readById";
import updateDesignationRoutes from "./update";
import deleteDesignationRoutes from "./delete";

async function adminDesignationRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createDesignationRoutes, { prefix: "/create" });
  fastify.register(readDesignationRoutes, { prefix: "/read" });
  fastify.register(getDesignationByIdRoutes, { prefix: "/read" });
  fastify.register(updateDesignationRoutes, { prefix: "/update" });
  fastify.register(deleteDesignationRoutes, { prefix: "/delete" });
}

export default adminDesignationRouteGroup;
