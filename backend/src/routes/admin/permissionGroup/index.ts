import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createPermissionGroupRoutes from "./create";
import readPermissionGroupRoutes from "./read";
import getPermissionGroupByIdRoutes from "./readById";

export default async function permissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createPermissionGroupRoutes, { prefix: "/create" });
  fastify.register(readPermissionGroupRoutes, { prefix: "/read" });
  fastify.register(getPermissionGroupByIdRoutes, { prefix: "/read" });
}
