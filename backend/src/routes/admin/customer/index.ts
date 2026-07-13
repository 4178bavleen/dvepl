import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createCustomerRoute from "./create";
import readCustomerRoutes from "./read";
import updateCustomerRoute from "./update";
import deleteCustomerRoute from "./delete";

async function adminCustomerRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createCustomerRoute, { prefix: "/create" });
  fastify.register(readCustomerRoutes, { prefix: "/read" });
  fastify.register(updateCustomerRoute, { prefix: "/update" });
  fastify.register(deleteCustomerRoute, { prefix: "/delete" });
}

export default adminCustomerRouteGroup;
