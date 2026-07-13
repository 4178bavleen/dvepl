import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createTenderFileRoute from "./create";
import deleteTenderFileRoute from "./delete";

async function adminTenderFileRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createTenderFileRoute, { prefix: "/create" });
  fastify.register(deleteTenderFileRoute, { prefix: "/delete" });
}

export default adminTenderFileRouteGroup;
