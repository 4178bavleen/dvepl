import "@fastify/jwt";

declare module "@fastify/jwt" {
    interface FastifyJWT {
        payload: {
            id: number;
            roleType: string | null;
            tokenVersion: string;
        };
        user: {
            id: number;
            roleType: string | null;
            tokenVersion: string;
        };
    }
}
