import { FastifyInstance } from "fastify";

import notificationConfigurationRoutes from "./configuration";
import notificationEventRoutes from "./event";
// import notificationRecipientRoutes from "./recipients";
// import notificationTemplateRoutes from "./templates";
// import notificationLogRoutes from "./logs";
// import notificationTestRoutes from "./test";

export default async function notificationRoutes(
  fastify: FastifyInstance
) {
  fastify.register(notificationConfigurationRoutes, {
    prefix: "/configuration",
  });

  fastify.register(notificationEventRoutes, {
    prefix: "/event",
  });

//   fastify.register(notificationTemplateRoutes, {
//     prefix: "/templates",
//   });

//   fastify.register(notificationRecipientRoutes, {
//     prefix: "/recipients",
//   });

//   fastify.register(notificationLogRoutes, {
//     prefix: "/logs",
//   });

//   fastify.register(notificationTestRoutes, {
//     prefix: "/test",
//   });
}