import { FastifyInstance } from "fastify";

import readUserAccessRoute from "./readUserAccess";
import updateUserAccessRoute from "./updateUserAccess";

export default async function accessRoutes(
    fastify: FastifyInstance
) {
    fastify.register(readUserAccessRoute);

    fastify.register(updateUserAccessRoute);
} 