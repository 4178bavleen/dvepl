import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";


// Change this path according to your project
import { adminLogs } from "../../../services/logger/contextLogger";
import { createCompanySchema } from "../../../schemas/admin/company/company.schema";


async function adminCompanycreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Company"],
        summary: "Create Company",
        description: "Create a new company",

      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // Validate Request
        const validationResult = createCompanySchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid company data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,
            message: "Invalid company data.",
            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const {
          name,
          gst,
          pan,
          email,
          phone,
          address,
        } = validationResult.data;

        // ===========================
        // Check duplicate GST
        // ===========================

        if (gst) {
          const existingGST = await fastify.prisma.company.findUnique({
            where: {
              gst,
            },
          });

          if (existingGST) {
            return reply.status(409).send({
              success: false,
              message: "GST already exists.",
            });
          }
        }

        // ===========================
        // Check duplicate PAN
        // ===========================

        if (pan) {
          const existingPAN = await fastify.prisma.company.findUnique({
            where: {
              pan,
            },
          });

          if (existingPAN) {
            return reply.status(409).send({
              success: false,
              message: "PAN already exists.",
            });
          }
        }

        // ===========================
        // Create Company
        // ===========================

        const company = await fastify.prisma.company.create({
          data: {
            name,
            gst: gst || null,
            pan: pan || null,
            email: email || null,
            phone: phone || null,
            address: address || null,
          },
        });

        adminLogs.info("Company created successfully", {
          companyId: company.id,
          companyName: company.name,
        });

        return reply.status(201).send({
          success: true,
          message: "Company created successfully.",
          data: company,
        });
      } catch (error: any) {
        adminLogs.error("Company creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,
          message: "Server error while creating company.",
          details:
            process.env.NODE_ENV === "development"
              ? error.message
              : undefined,
        });
      }
    }
  );
}

export default adminCompanycreateRoutes;