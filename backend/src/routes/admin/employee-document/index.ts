import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createEmployeeDocumentRoute from "./create";
import readEmployeeDocumentRoutes from "./read";
import updateEmployeeDocumentRoutes from "./update";
import deleteEmployeeDocumentRoute from "./delete";

async function adminEmployeeDocumentRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createEmployeeDocumentRoute, { prefix: "/create" });
  fastify.register(readEmployeeDocumentRoutes, { prefix: "/" });
  fastify.register(updateEmployeeDocumentRoutes, { prefix: "/" });
  fastify.register(deleteEmployeeDocumentRoute, { prefix: "/" });
}

export default adminEmployeeDocumentRouteGroup;
