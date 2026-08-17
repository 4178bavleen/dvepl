import { FastifyInstance } from "fastify";

import create from "./create";
import read from "./read";
import update from "./update";
import del from "./delete";

export default async function (
  fastify: FastifyInstance,
) {
  fastify.register(create);
  fastify.register(read);
  fastify.register(update);
  fastify.register(del);
}
