import { FastifyInstance } from "fastify";
import updateOrderWorkflowStageRoute from "./order/updateStage";
import getOrderWorkflowTrackerRoute from "./order/getTracker";
import listWorkflowOrdersRoute from "./order/list";

export default async function workflowRoutes(
  fastify: FastifyInstance,
) {
  fastify.register(updateOrderWorkflowStageRoute);
   fastify.register(getOrderWorkflowTrackerRoute);
   fastify.register(listWorkflowOrdersRoute);
}