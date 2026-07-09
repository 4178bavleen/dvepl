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
                        id: user.id,
                        email: user.email,
                        phone: user.phone,
                        isActive: user.isActive,
                        isEmailVerified: user.isEmailVerified,
                        isPhoneVerified: user.isPhoneVerified,
                        roleIds: user.userRoles.map((r) => r.role.id),
                        roles: user.userRoles.map((r) => ({
                            id: r.role.id,
                            name: r.role.name,
                        })),
                    },
                });

            } catch (error: any) {

                adminLogs.error("Read User By Id Failed", {
                    error,
                });

                return reply.status(500).send({
                    success: false,
                    message: "Server error.",
                    details:
                        process.env.NODE_ENV === "development"
                            ? error.message
                            : undefined,
                });

            }
        }
    );
}

export default readUserByIdRoute;