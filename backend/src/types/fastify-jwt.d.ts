import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            userId: string;
            companyId: string;
            roles: string[];
            permissions: string[];
            tokenVersion?: number;
        };
        user: {
            id: string;
            companyId: string;
            roles: string[];
            permissions: string[];
        };
    }
}
