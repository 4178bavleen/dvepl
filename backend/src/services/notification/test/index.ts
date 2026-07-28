import { FastifyInstance } from "fastify";

import adminNotificationTestEmailRoutes from "./email";

export default async function (
  fastify: FastifyInstance
) {
  fastify.register(adminNotificationTestEmailRoutes);
}