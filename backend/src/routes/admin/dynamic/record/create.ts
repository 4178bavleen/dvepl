import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { Prisma } from "@prisma/client";

interface Params {
  moduleKey: string;
}

interface Body {
  values: Record<string, any>;
}

export default async function createRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/record/:moduleKey",
    {
      schema: {
        tags: ["Dynamic Engine"],
      },
    },
    async (
      request: FastifyRequest<{
        Params: Params;
        Body: Body;
      }>,
      reply: FastifyReply
    ) => {
      const { moduleKey } = request.params;
      const { values } = request.body;

      const module = await fastify.prisma.dynamicModule.findUnique({
        where: {
          moduleKey,
        },
      });

      if (!module) {
        return reply.code(404).send({
          success: false,
          message: "Module not found",
        });
      }

      const record = await fastify.prisma.dynamicRecord.create({
        data: {
          moduleId: module.id,
          values,
        },
      });

      if (moduleKey === "inventory") {
        try {
          const fields = await fastify.prisma.dynamicField.findMany({
            where: { moduleId: module.id },
          });

          const nameField = fields.find(
            (f) =>
              f.label.toLowerCase().includes("name") ||
              f.label.toLowerCase().includes("desc")
          );
          const nameVal = nameField ? values[nameField.fieldName] : null;
          const name = String(nameVal || Object.values(values)[0] || "Unnamed Item");

          const codeField = fields.find((f) => f.label.toLowerCase().includes("code"));
          const codeVal = codeField ? String(values[codeField.fieldName] || "").trim() : "";
          const materialCode = codeVal || `MAT-${record.id.substring(0, 8)}`;

          const unitField = fields.find((f) => f.label.toLowerCase().includes("unit"));
          const unit = unitField ? String(values[unitField.fieldName] || "Nos") : "Nos";

          const qtyField = fields.find(
            (f) =>
              f.label.toLowerCase().includes("qty") ||
              f.label.toLowerCase().includes("quantity")
          );
          const quantity = qtyField ? (Number(values[qtyField.fieldName]) || 0) : 0;

          const priceField = fields.find(
            (f) =>
              f.label.toLowerCase().includes("price") ||
              f.label.toLowerCase().includes("rate")
          );
          const unitPrice = priceField ? (Number(values[priceField.fieldName]) || 0) : 0;

          const catField = fields.find(
            (f) =>
              f.label.toLowerCase().includes("category") ||
              f.label.toLowerCase().includes("group")
          );
          const category = catField ? String(values[catField.fieldName] || "General") : "General";

          const companyId = (request.user as any).companyId;
          const userId = (request.user as any).id;

          // Upsert static Material
          await fastify.prisma.material.upsert({
            where: { id: record.id },
            create: {
              id: record.id,
              companyId,
              name,
              materialCode,
              unit,
              gst: new Prisma.Decimal(18),
              category,
              createdById: userId,
            },
            update: {
              name,
              materialCode,
              unit,
              category,
            },
          });

          // Upsert static Inventory
          await fastify.prisma.inventory.upsert({
            where: { id: record.id },
            create: {
              id: record.id,
              companyId,
              materialId: record.id,
              quantity: new Prisma.Decimal(quantity),
              unitPrice: new Prisma.Decimal(unitPrice),
            },
            update: {
              quantity: new Prisma.Decimal(quantity),
              unitPrice: new Prisma.Decimal(unitPrice),
            },
          });
        } catch (syncErr) {
          console.error("Failed to sync dynamic record to static tables:", syncErr);
        }
      }

      return reply.send({
        success: true,
        data: record,
      });
    }
  );
}