import fp from "fastify-plugin";
import { prisma } from "../lib/prisma";

async function dbPlugin(fastify, options) {
  // Make prisma available on fastify instance
  fastify.decorate("prisma", prisma);

  // Close DB connection when server stops
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
}

export default fp(dbPlugin, {
  name: "db-plugin",
});
