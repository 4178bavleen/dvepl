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
            id: string;
            companyId: string;
            roles: string[];
            permissions: string[];
        };
        admin?: {
            id: string;
            companyId: string;
            roles: string[];
            permissions: string[];
        };
    }
}
