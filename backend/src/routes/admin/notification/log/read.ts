import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { notificationLogQuerySchema } from "../../../../schemas/admin/notification/notification.schema";

async function notificationLogRead(
  fastify: FastifyInstance,
) {
  fastify.get(
    "/",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const validationResult = notificationLogQuerySchema.safeParse(request.query);

      if (!validationResult.success) {
        return reply.status(400).send({
          success: false,
          message: "Invalid query parameters.",
          error: validationResult.error.issues,
        });
      }

      const { page, limit, search, channel, status } = validationResult.data;

      const where: any = {};

      // Scope non-admin users to their own notifications. Admins see all.
      const requesterEmail = (request as any).admin?.email;
      const roles: string[] = (request as any).admin?.roles ?? [];
      const isAdmin = roles.some((r: string) => r === "Admin");
      if (!isAdmin && requesterEmail) {
        where.recipient = requesterEmail;
      }

      if (channel) {
        where.channel = channel;
      }

      if (status) {
        where.status = status;
      }

      if (search) {
        where.OR = [
          { recipient: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
          { message: { contains: search, mode: "insensitive" } },
          { eventCode: { contains: search, mode: "insensitive" } },
        ];
      }

      const offset = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        fastify.prisma.notificationLog.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        fastify.prisma.notificationLog.count({ where }),
      ]);

      return reply.send({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    }
  );
}

export default notificationLogRead;
