import adminAuthRouteGroup from "./auth/index";
import adminReportRouteGroup from "./reports/index";
import { FastifyInstance, FastifyPluginOptions } from "fastify";

async function adminRoutes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // Public routes
    fastify.register(adminAuthRouteGroup, { prefix: "/auth" });

    fastify.register(async function rolesGroup(instance, opts) {

        instance.addHook("preHandler", async (req, reply) => {
            await instance.verifyToken(req, reply);  // 1️⃣ Verify token
            await instance.authorizeRoles(["SYSTEM_ADMIN", "INTERNAL_ADMIN"])(req, reply);  // 2️⃣ Verify role
        });

        instance.register(adminReportRouteGroup, { prefix: "/report" });
    });

}


export default adminRoutes;