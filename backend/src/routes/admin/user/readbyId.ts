import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

async function readUserByIdRoute(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.get(
        "/:id",
        {
            schema: {
                tags: ["User"],
                summary: "Read User By Id",
                description: "Returns user details.",
            },
            preHandler: [
                fastify.verifyToken,
                fastify.authorizePermissions(["user.view"]),
            ],
        },
        async (request: FastifyRequest, reply: FastifyReply) => {
            try {

                const companyId = (request.user as any)?.companyId;

                if (!companyId) {
                    return reply.status(401).send({
                        success: false,
                        message: "Company information missing from token.",
                    });
                }

                const { id } = request.params as { id: string };

                const user = await fastify.prisma.user.findFirst({
                    where: {
                        id,
                        companyId,
                        deletedAt: null,
                    },
                    include: {
                        userRoles: {
                            include: {
                                role: true,
                            },
                        },
                    },
                });

                if (!user) {
                    return reply.status(404).send({
                        success: false,
                        message: "User not found.",
                    });
                }

                  return reply.send({
                    success: true,
                    data: {
                        user: {
                            id: user.id,
                            name: user.name,
                            email: user.email,
                            phone: user.phone,
                            isActive: user.isActive,
                        },

                        roles: user.userRoles.map((userRole) => ({
                            id: userRole.role.id,
                            name: userRole.role.name,
                        })),

                        permissions: [
                            "user.create",
                            "user.view",
                            "lead.assign",
                        ],
                    },
                });

            } catch (error: any) {

                adminLogs.error("Read User By Id Failed", {
                    error,
                });

           

            }
        }
    );
}

export default readUserByIdRoute;