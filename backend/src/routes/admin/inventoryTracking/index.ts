import { FastifyInstance } from "fastify";

import receive from "./receive";
import read from "./read";

export default async function (
  fastify: FastifyInstance,
) {
  fastify.register(read, {
    prefix: "/read",
  });

  fastify.register(receive, {
    prefix: "/receive",
  });
}