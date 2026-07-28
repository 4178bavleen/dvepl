import { FastifyInstance } from "fastify";

import read from "./read";
import update from "./update";

export default async function (
  fastify: FastifyInstance,
) {
  fastify.register(read);

  fastify.register(update);
}