import { FastifyInstance } from "fastify";

import readUserAccessRoute from "./readUserAccess";
import updateUserAccessRoute from "./updateUserAccess";
import resetUserAccessRoute from "./resetUserAccess";

export default async function accessRoutes(
    fastify: FastifyInstance
) {
    fastify.register(readUserAccessRoute, { prefix: "/read" });
    fastify.register(updateUserAccessRoute, { prefix: "/update" });
    fastify.register(resetUserAccessRoute, { prefix: "/delete" });
} 