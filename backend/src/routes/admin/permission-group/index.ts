import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createPermissionGroupRoutes from "./create";
import readPermissionGroupRoutes from "./read";
import getPermissionGroupByIdRoutes from "./readById";
// import updatePermissionGroupRoutes from "./update";
// import deletePermissionGroupRoutes from "./delete";

export default async function permissionGroupRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
    fastify.register(createPermissionGroupRoutes, { prefix: "/create" });
    fastify.register(readPermissionGroupRoutes,{ prefix:"/"});
 
  await getPermissionGroupByIdRoutes(fastify, {});
  //   await updatePermissionGroupRoutes(fastify, {});
  //   await deletePermissionGroupRoutes(fastify, {});
}



