import { FastifyInstance, FastifyPluginOptions } from "fastify";

import readCustomerRoutes from "./read";
import updateCustomerRoute from "./update";
import syncCustomerRoute from "./sync";
import deleteCustomerRoute from "./delete";

async function adminCustomerRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(readCustomerRoutes, { prefix: "/read" });
  fastify.register(updateCustomerRoute, { prefix: "/update" });
  fastify.register(syncCustomerRoute, { prefix: "/sync" });
  fastify.register(deleteCustomerRoute, { prefix: "/delete" });
}

export default adminCustomerRouteGroup;