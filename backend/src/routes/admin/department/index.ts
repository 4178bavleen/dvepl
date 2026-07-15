import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createDepartmentRoutes from "./create";
import readDepartmentRoutes from "./read";
import updateDepartmentRoutes from "./update";
import getDepartmentByIdRoutes from "./readById";
import deleteDepartmentRoutes from "./delete";
async function adminDeptRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(createDepartmentRoutes, { prefix: "/create" });
  fastify.register(readDepartmentRoutes, { prefix: "/" });
  fastify.register(getDepartmentByIdRoutes, { prefix: "/read" });
  fastify.register(updateDepartmentRoutes, { prefix: "/update" });
  fastify.register(deleteDepartmentRoutes, { prefix: "/" });
}

export default adminDeptRouteGroup;
