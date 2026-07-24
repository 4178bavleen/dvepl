import { FastifyInstance, FastifyPluginOptions } from "fastify";
import adminTaskCreateRoutes from "./create";
import adminTaskReadRoutes from "./read";
import adminTaskReadByIdRoutes from "./readByID";
import adminTaskUpdateRoutes from "./update";
import adminTaskDeleteRoutes from "./delete";
import adminTaskNotificationRoutes from "./notification";

async function adminTaskRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(adminTaskCreateRoutes, { prefix: "/create" });
  fastify.register(adminTaskReadRoutes, { prefix: "/read" });
  fastify.register(adminTaskReadByIdRoutes, { prefix: "/read" });
  fastify.register(adminTaskDeleteRoutes, { prefix: "/delete" });
  fastify.register(adminTaskUpdateRoutes, { prefix: "/update" });
  fastify.register(adminTaskNotificationRoutes, { prefix: "/notification" });
}

export default adminTaskRouteGroup;
