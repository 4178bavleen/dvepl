import { FastifyInstance, FastifyPluginOptions } from "fastify";

import getPermissionRoute from "./getAll";
import assignPermissionRoute from "./assignPermission";
import revokePermissionRoute from "./revokePermission";
import updateRolePermissionsRoute from "./update";
import getPermissionsByRoleRoute from "./getByRole";

async function adminPermissionRouteGroup(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.register(getPermissionRoute, {
        prefix: "/read",
    });
    fastify.register(getPermissionsByRoleRoute, {
        prefix: "/read",
    });
    fastify.register(assignPermissionRoute, {
        prefix: "/update",
    });
    fastify.register(revokePermissionRoute, {
        prefix: "/update",
    });
    fastify.register(updateRolePermissionsRoute, {
        prefix: "/update",
    });
}

export default adminPermissionRouteGroup;