import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyReply,
    FastifyRequest,
} from "fastify";

interface Body {
    permissionIds: string[];
}

async function updateUserAccessRoute(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.put(
        "/:id",
        {
            preHandler: [
                fastify.verifyToken,
                fastify.authorizePermissions(["user.update"]),
            ],
        },
        async (
            request: FastifyRequest<{
                Params: { id: string };
                Body: Body;
            }>,
            reply: FastifyReply
        ) => {
            try {
                const companyId = request.user?.companyId;

                if (!companyId) {
                    return reply.status(401).send({
                        success: false,
                        message: "Company missing.",
                    });
                }

                const { id } = request.params;
                const { permissionIds } = request.body;

                const user = await fastify.prisma.user.findFirst({
                    where: {
                        id,
                        companyId,
                        deletedAt: null,
                    },
                });

                if (!user) {
                    return reply.status(404).send({
                        success: false,
                        message: "User not found.",
                    });
                }
                console.log("permissionIds:", permissionIds);

          await fastify.prisma.$transaction(async (tx) => {

    console.log("Deleting old permissions...");

    await tx.userPermission.deleteMany({
        where: {
            userId: id,
        },
    });

    console.log("Creating:", permissionIds);

    if (permissionIds && permissionIds.length > 0) {

        await tx.userPermission.createMany({
            data: permissionIds.map(permissionId => ({
                userId: id,
                permissionId,
            })),
            skipDuplicates: true,
        });

    }

    const saved = await tx.userPermission.findMany({
        where: {
            userId: id,
        },
    });

    console.log("Saved Permissions:", saved);

});

                return reply.send({
                    success: true,
                    message: "Permissions updated successfully.",
                });
            } catch (error: any) {
                return reply.status(500).send({
                    success: false,
                    message: error.message,
                });
            }
        }
    );
}

export default updateUserAccessRoute;