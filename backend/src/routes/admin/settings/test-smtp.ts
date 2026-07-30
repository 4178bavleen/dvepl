import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import nodemailer from "nodemailer";
import { adminLogs } from "../../../services/logger/contextLogger";

async function testSmtpRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/test-smtp",
    {
      schema: {
        tags: ["Settings"],
        summary: "Test SMTP Connection",
        description: "Tests connection to the specified SMTP server.",
      },
      preHandler: [
        fastify.verifyToken
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const { host, port, username, password, secure } = request.body as any;

        if (!host || !port) {
          return reply.status(400).send({
            success: false,
            message: "Host and port are required for SMTP test.",
          });
        }

        const transporter = nodemailer.createTransport({
          host,
          port: parseInt(String(port), 10),
          secure: !!secure,
          auth: username && password ? {
            user: username,
            pass: password,
          } : undefined,
          connectionTimeout: 10000,
        });

        await transporter.verify();

        return reply.status(200).send({
          success: true,
          message: "SMTP server connected successfully!",
        });
      } catch (error: any) {
        adminLogs.error("SMTP Test failed", { error });
        return reply.status(500).send({
          success: false,
          message: error.message || "SMTP connection failed. Check host and credentials.",
        });
      }
    }
  );
}

export default testSmtpRoute;
