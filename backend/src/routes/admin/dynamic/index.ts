import { FastifyInstance } from "fastify";

import createModuleRoute from "./module/create";
import listModuleRoute from "./module/list";
import createFieldRoute from "./field/create";
import getSchemaRoute from "./schema/get";
import createRecordRoute from "./record/create";
import listRecordRoute from "./record/list";
import updateRecordRoute from "./record/update";
import deleteRecordRoute from "./record/delete";
import updateFieldRoute from "./field/update";
import deleteFieldRoute from "./field/delete";
import listFieldRoute from "./field/list";
import updateModuleRoute from "./module/update";
import deleteModuleRoute from "./module/delete";
import getRecordRoute from "./record/get";

export default async function dynamicRoutes(
  fastify: FastifyInstance
) {
  fastify.register(createModuleRoute);

  fastify.register(listModuleRoute);
  fastify.register(createFieldRoute);
  fastify.register(getSchemaRoute);
  fastify.register(createRecordRoute);
  fastify.register(listRecordRoute);
  fastify.register(updateRecordRoute);
  fastify.register(deleteRecordRoute);
  fastify.register(updateFieldRoute);
  fastify.register(deleteFieldRoute);
  fastify.register(listFieldRoute);
  fastify.register(updateModuleRoute);
  fastify.register(deleteModuleRoute);
  fastify.register(getRecordRoute);
}