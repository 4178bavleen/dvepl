import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminBranchReadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Branch"],
        summary: "Read Branch Information",
        description:
          "Retrieve information about a specific branch based on provided criteria.",
      },
    },
    async (request: any, reply: any) => {
      try {
        const branches = await fastify.prisma.branch.findMany({
          where: {
            deletedAt: null,
          },
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        return reply.send({
          success: true,
          message: "Branches fetched successfully.",
          data: branches,
        });
      } catch (error: string | any) {
        adminLogs.error(`Failed to retrieve branch information ${error}`);
        return reply.status(500).send({
          success: false,
          message:
            "Server error during branch information retrieval. Please try again later.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : error.message,
        });
      }
    },
  );
}

export default adminBranchReadRoutes;
