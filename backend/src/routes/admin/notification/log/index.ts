import { FastifyInstance } from "fastify";

import read from "./read";

export default async function (
  fastify: FastifyInstance,
) {
  fastify.register(read);
}
