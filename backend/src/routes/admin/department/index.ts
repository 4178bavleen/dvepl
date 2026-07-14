import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createDepartmentRoutes from "./create";
import readDepartmentRoutes from "./read";


async function adminDeptRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(createDepartmentRoutes, { prefix: "/create" });
  fastify.register(readDepartmentRoutes, { prefix: "/" });
 
}

export default adminDeptRouteGroup;
