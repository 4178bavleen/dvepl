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
  fastify.register(readAttendanceRoutes, { prefix: "/read" });
  fastify.register(updateAttendanceRoutes, { prefix: "/update" });
  fastify.register(deleteAttendanceRoute, { prefix: "/delete" });
}

export default adminAttendanceRouteGroup;
