import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminPaymentCreateRoutes from "./create";
import adminPaymentReadRoutes from "./read";
import adminPaymentUpdateRoutes from "./update";
import adminPaymentDeleteRoutes from "./delete";

async function adminPaymentRouteGroup(fastify: FastifyInstance, options: FastifyPluginOptions) {
  fastify.register(adminPaymentCreateRoutes, { prefix: "/create" });
  fastify.register(adminPaymentReadRoutes, { prefix: "/read" });
  fastify.register(adminPaymentUpdateRoutes, { prefix: "/update" });
  fastify.register(adminPaymentDeleteRoutes, { prefix: "/delete" });
}

export default adminPaymentRouteGroup;
