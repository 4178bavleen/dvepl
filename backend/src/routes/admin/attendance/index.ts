import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createAttendanceRoute from "./create";
import readAttendanceRoutes from "./read";
import updateAttendanceRoutes from "./update";
import deleteAttendanceRoute from "./delete";

async function adminAttendanceRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createAttendanceRoute, { prefix: "/create" });
  fastify.register(readAttendanceRoutes, { prefix: "/" });
  fastify.register(updateAttendanceRoutes, { prefix: "/" });
  fastify.register(deleteAttendanceRoute, { prefix: "/" });
}

export default adminAttendanceRouteGroup;
