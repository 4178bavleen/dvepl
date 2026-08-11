
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { syncDynamicInventory } from "../../../../services/inventory/syncDynamicInventory";

interface ImportColumn {
  label: string;
  fieldName: string;
  type: "TEXT" | "NUMBER" | "DATE";
}

interface Body {
  columns: ImportColumn[];
  rows: Record<string, any>[];
}

interface Params {
  moduleKey: string;
}

export default async function importRecordRoute(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  fastify.post(
    "/record/import/:moduleKey",
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
      reply: FastifyReply,
    ) => {
      const { moduleKey } = request.params;
      const { columns, rows } = request.body;

      // 1. Find module
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

      try {
        // 2. Get existing fields
        const existingFields = await fastify.prisma.dynamicField.findMany({
          where: {
            moduleId: module.id,
          },
          orderBy: {
            orderNo: "asc",
          },
        });

        const existingFieldNames = new Set(
          existingFields.map((field) => field.fieldName),
        );

        const createdFields: any[] = [];
        const existingMatchedFields: string[] = [];
        const createdRecords: any[] = [];

        // 3. Check every Excel column
        for (const column of columns) {
          if (existingFieldNames.has(column.fieldName)) {
            existingMatchedFields.push(column.fieldName);
            continue;
          }

          // Get latest field count
          const fieldCount = await fastify.prisma.dynamicField.count({
            where: {
              moduleId: module.id,
            },
          });

          const nextOrder = fieldCount + 1;

          // Create new DynamicField
          const field = await fastify.prisma.dynamicField.create({
            data: {
              moduleId: module.id,
              fieldName: column.fieldName,
              label: column.label,
              type: column.type,
              required: false,
              visible: true,
              searchable: false,
              filterable: false,
              table: true,
              orderNo: nextOrder,
            },
          });

          createdFields.push(field);

          // Prevent duplicate field creation
          // within the same import request.
          existingFieldNames.add(column.fieldName);
        }

        // 4. Create records
        for (const row of rows) {
          const record = await fastify.prisma.dynamicRecord.create({
            data: {
              moduleId: module.id,
              values: row,
            },
          });

          // 5. Sync inventory-specific data
          if (moduleKey === "inventory") {
            await syncDynamicInventory({
              prisma: fastify.prisma,
              recordId: record.id,
              moduleId: module.id,
              values: row,
              companyId: (request.user as any).companyId,
              userId: (request.user as any).id,
            });
          }

          // 6. Get the final updated record
          const updatedRecord =
            await fastify.prisma.dynamicRecord.findUnique({
              where: {
                id: record.id,
              },
            });

          if (updatedRecord) {
            createdRecords.push(updatedRecord);
          }
        }

        // 7. Return response
        return reply.send({
          success: true,
          data: {
            moduleId: module.id,
            moduleKey: module.moduleKey,
            createdFields,
            existingMatchedFields,
            rowCount: rows.length,
            createdRecords,
          },
        });
      } catch (error: any) {
        console.error("========== DYNAMIC IMPORT FAILED ==========");
        console.error(error);
        console.error("Message:", error?.message);
        console.error("Code:", error?.code);
        console.error("Meta:", error?.meta);
        console.error("Stack:", error?.stack);
        console.error("============================================");

        return reply.code(500).send({
          success: false,
          message: error?.message || "Import failed.",
          code: error?.code || null,
        });
      }
    },
  );
}

