import { FastifyInstance } from "fastify";

import createRoute from "./create";
import readRoute from "./read";
import updateRoute from "./update";
import deleteRoute from "./delete";

export default async function purchaseOrderRoutes(
  fastify: FastifyInstance,
) {
  fastify.register(createRoute, { prefix: "/create" });
  fastify.register(readRoute, { prefix: "/read" });
  fastify.register(updateRoute, { prefix: "/update" });
  fastify.register(deleteRoute, { prefix: "/delete" });
}