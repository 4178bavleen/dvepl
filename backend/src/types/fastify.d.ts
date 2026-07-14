import "fastify";

declare module "fastify" {
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
interface FastifyInstance {
    verifyToken: (
        request: FastifyRequest,
        reply: FastifyReply
    ) => Promise<void>;

    authorizePermissions: (
        permissions: string[]
    ) => (
        request: FastifyRequest,
        reply: FastifyReply
    ) => Promise<void>;
}
interface FastifySchema {
  tags?: string[];
  summary?: string;
  description?: string;
}
}