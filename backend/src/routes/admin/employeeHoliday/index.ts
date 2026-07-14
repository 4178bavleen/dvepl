import { FastifyInstance, FastifyPluginOptions } from "fastify";

import createHolidayRoute from "./create";
import readHolidayRoutes from "./read";
import updateHolidayRoutes from "./update";
import deleteHolidayRoute from "./delete";

async function adminHolidayRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createHolidayRoute, { prefix: "/create" });
  fastify.register(readHolidayRoutes, { prefix: "/read" });
  fastify.register(updateHolidayRoutes, { prefix: "/update" });
  fastify.register(deleteHolidayRoute, { prefix: "/delete" });
}

export default adminHolidayRouteGroup;
