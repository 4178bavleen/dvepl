import { FastifyInstance, FastifyPluginOptions } from "fastify";
import createCostCenterRoutes from "./create";
import readCostCenterRoutes from "./read";
import getCostCenterByIdRoutes from "./readById";
import updateCostCenterRoutes from "./update";
import deleteCostCenterRoutes from "./delete";

async function adminCostCenterRouteGroup(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.register(createCostCenterRoutes, { prefix: "/create" });
  fastify.register(readCostCenterRoutes, { prefix: "/read" });
  fastify.register(getCostCenterByIdRoutes, { prefix: "/read" });
  fastify.register(updateCostCenterRoutes, { prefix: "/update" });
  fastify.register(deleteCostCenterRoutes, { prefix: "/delete" });
}

export default adminCostCenterRouteGroup;
