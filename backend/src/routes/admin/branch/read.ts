import { FastifyInstance, FastifyPluginOptions } from "fastify";

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
        description: "Retrieve information about a specific branch based on provided criteria.",

        
      },
    },
    async (request: any, reply: any) => {
      try {
        


        const data = {
            "branchName": "Main Branch",
            "branchLocation": "123 Main St, Cityville",
            "branchManager": "John Doe",
            "contactNumber": "+1 (555) 123-4567",
        }
        

        reply.send({
          success: true,
          message: "Branch information retrieved successfully",
          data,
        });
      } catch (error: string | any) {
        fastify.adminLogger.error(`Failed to retrieve branch information ${error}`);
        return reply.status(500).send({
          success: false,
          message: "Server error during branch information retrieval. Please try again later.",
          details:
            process.env.NODE_ENV === "development" ? error.message : error.message,
        });
      }
    },
  );
}

export default adminBranchReadRoutes;
