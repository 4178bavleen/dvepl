import { FastifyInstance } from "fastify";

import readRoute from "./read";

export default async function quoteTenderOrderRoutes(
  fastify: FastifyInstance,
) {
  fastify.register(readRoute, {
    prefix: "/read",
  });
}