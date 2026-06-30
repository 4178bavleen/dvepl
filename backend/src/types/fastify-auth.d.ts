import "fastify";

declare module "fastify" {
    interface FastifyInstance {
        verifyToken: (
            request: FastifyRequest,
            reply: FastifyReply
        ) => Promise<void>;

        authorizeRoles: (roles: string[]) =>
            (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }

    interface FastifyRequest {
        user?: {
            id: number;
            roleType: string | null;
        };
    }
}
