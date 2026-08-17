import { FastifyInstance } from "fastify";

import notificationConfigurationRoutes from "./configuration";
import notificationEventRoutes from "./event";
import notificationRecipientRoutes from "./recipient";
import notificationTemplateRoutes from "./template";
import notificationLogRoutes from "./log";
import notificationTestRoutes from "../../../services/notification/test";

export default async function notificationRoutes(
  fastify: FastifyInstance
) {
  fastify.register(notificationConfigurationRoutes, {
    prefix: "/configuration",
  });

  fastify.register(notificationEventRoutes, {
    prefix: "/event",
  });

  fastify.register(notificationTemplateRoutes, {
    prefix: "/templates",
  });

  fastify.register(notificationRecipientRoutes, {
    prefix: "/recipients",
  });

  fastify.register(notificationLogRoutes, {
    prefix: "/logs",
  });

  fastify.register(notificationTestRoutes, {
    prefix: "/test",
  });
}