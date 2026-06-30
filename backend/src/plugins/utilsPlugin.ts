import fp from "fastify-plugin";
import { adminLogs as AdminLogger } from "../services/logger/contextLogger";
import { userLogs as UserLogger } from "../services/logger/contextLogger";
import { commonLogs as CommonLogger } from "../services/logger/contextLogger";

async function utilsPlugin(fastify: any) {
  // Logger Helper
  fastify.decorate("adminLogger", AdminLogger);
  fastify.decorate("userLogger", UserLogger);
  fastify.decorate("commonLogger", CommonLogger);
}

export default fp(utilsPlugin, {
  name: "utils-plugin",
});
