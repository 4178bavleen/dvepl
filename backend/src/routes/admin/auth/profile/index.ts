import { FastifyInstance, FastifyPluginOptions } from "fastify";

import readProfileRoute from "./read";
import updateProfileRoute from "./update";

async function profileRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.register(readProfileRoute);
  fastify.register(updateProfileRoute);
}

export default profileRoutes;