import adminAuthRouteGroup from "./auth/index";
import adminBranchRouteGroup from "./branch/index";
import adminCompanyRouteGroup from "./company/index";
import adminUserRouteGroup from "./user/index";
import adminRoleRouteGroup from "./role";
import adminPermissionRouteGroup from "./permission/index";
import accessRoutes from "./access";

import { FastifyInstance, FastifyPluginOptions } from "fastify";

async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Public routes
    fastify.register(adminAuthRouteGroup, { prefix: "/auth" });

    fastify.register(async function rolesGroup(instance, opts) {


        //runs automatically before every req
        instance.addHook("preHandler", async (req, reply) => {
            await instance.verifyToken(req, reply);  // 1️⃣ Verify token
            await instance.authorizePermissions(["company.create"])(req, reply);  // 2️⃣ Verify role
        });

        instance.register(adminBranchRouteGroup, { prefix: "/branch" });
        instance.register(adminCompanyRouteGroup, { prefix: "/company" });
        instance.register(adminUserRouteGroup, { prefix: "/user" });
        instance.register(adminRoleRouteGroup, {
            prefix: "/role",
        });
        instance.register(adminPermissionRouteGroup, {
            prefix: "/permission",
        });
        fastify.register(accessRoutes,{
    prefix:"/user/access"
});

    });

}


export default adminRoutes;


