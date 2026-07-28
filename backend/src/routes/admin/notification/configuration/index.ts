import { FastifyInstance } from "fastify";

import get from "./read";
import update from "./update";

export default async function (
  fastify: FastifyInstance,
) {
  fastify.register(get);

  fastify.register(update);
}