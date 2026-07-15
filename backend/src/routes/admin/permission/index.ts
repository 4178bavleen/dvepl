import { FastifyInstance, FastifyPluginOptions } from "fastify";

import getPermissionRoute from "./getAll";

async function adminPermissionRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(getPermissionRoute, {
        prefix: "/read",
    });
}

export default adminPermissionRouteGroup;