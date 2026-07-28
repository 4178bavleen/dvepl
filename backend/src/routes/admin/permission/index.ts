import { FastifyInstance, FastifyPluginOptions } from "fastify";

import getPermissionRoute from "./getAll";
import getUserPermissionsRoute from "./getById"

async function adminPermissionRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(getPermissionRoute, {
        prefix: "/read",
    });
    fastify.register(getUserPermissionsRoute, {
        prefix: "/",
    });
}

export default adminPermissionRouteGroup;