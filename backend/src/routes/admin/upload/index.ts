import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createUploadRoute from "./create";

async function adminUploadRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createUploadRoute, { prefix: "/" });
}

export default adminUploadRouteGroup;
