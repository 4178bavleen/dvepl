import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";



async function adminReportReadRouteGroup(fastify: FastifyInstance, options: FastifyPluginOptions) {

    fastify.get("/", {
        schema: {
            tags: ["Report"],
            description: "Get all Report stats",
        },
    }, async (request: any, reply: any) => {
        try {
            reply.send({
                success: true,
                message: "Report data fetched",
            });

        } catch (error: string | any) {
            adminLogs.error(`Report Api failed ${error}`);
            return reply.status(500).send({
                success: false,
                message: "Server error during login. Please try again later.",
                details:
                    process.env.NODE_ENV === "development" ? error.message : undefined,
            });
        }
    });


}


export default adminReportReadRouteGroup;