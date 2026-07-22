import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";

import { vendorSchema } from "../../../schemas/admin/vendor/vendor.schema";

async function adminVendorCreateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Vendor"],
        summary: "Create Vendor",
        description: "Create a new vendor",
      },
    },

    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // ==========================
        // Validate Request
        // ==========================

        const validationResult = vendorSchema.safeParse(request.body);

        if (!validationResult.success) {
          adminLogs.error("Invalid vendor data", {
            error: validationResult.error,
          });

          return reply.status(400).send({
            success: false,

            message: "Invalid vendor data.",

            error:
              process.env.NODE_ENV === "development"
                ? validationResult.error.issues
                : "Validation failed",
          });
        }

        const {
          companyId,

          name,

          category,

          contactPerson,

          phone,

          email,

          gstNumber,

          address,

          notes,
        } = validationResult.data;

        // ==========================
        // Duplicate GST Check
        // ==========================

        if (gstNumber) {
          const existingGST = await fastify.prisma.vendor.findFirst({
            where: {
              gstNumber,
              deletedAt: null,
            },
          });

          if (existingGST) {
            return reply.status(409).send({
              success: false,

              message: "GST Number already exists.",
            });
          }
        }

        // ==========================
        // Create Vendor
        // ==========================

        const vendor = await fastify.prisma.$transaction(async (tx) => {
          const createdVendor = await tx.vendor.create({
            data: {
              companyId,

              name,

              category: category ?? null,

              contactPerson: contactPerson ?? null,

              phone: phone ?? null,

              email: email ?? null,

              gstNumber: gstNumber ?? null,

              address: address ?? null,

              notes: notes ?? null,

              createdById: request.user.id,
            },
          });

          // ==========================
          // Create Revision
          // ==========================

          await tx.vendorRevision.create({
            data: {
              vendorId: createdVendor.id,

              action: "CREATE",

              newData: createdVendor,

              createdById: request.user.id,
            },
          });

          return createdVendor;
        });

        adminLogs.info("Vendor created successfully", {
          vendorId: vendor.id,
          vendorName: vendor.name,
        });

        return reply.status(201).send({
          success: true,

          message: "Vendor created successfully.",

          data: vendor,
        });
      } catch (error: any) {
        console.error(error);

        adminLogs.error("Vendor creation failed", {
          error,
        });

        return reply.status(500).send({
          success: false,

          message: "Server error while creating vendor.",

          error: error.message,

          stack: error.stack,
        });
      }
    },
  );
}

export default adminVendorCreateRoutes;
