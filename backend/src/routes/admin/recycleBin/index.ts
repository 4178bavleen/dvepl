import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import { adminLogs } from "../../../services/logger/contextLogger";

interface Query {
  module?: string;
}

interface ItemParams {
  module: string;
  id: string;
}

export async function recycleBinRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  // 1. Get all soft-deleted records across modules
  fastify.get(
    "/list",
    {
      schema: {
        tags: ["Recycle Bin"],
        summary: "Get soft-deleted items",
        description: "List all soft-deleted records across system modules",
      },
    },
    async (request: FastifyRequest<{ Querystring: Query }>, reply: FastifyReply) => {
      try {
        const { module } = request.query;

        const deletedOrders = (!module || module === "order")
          ? await fastify.prisma.salesOrder.findMany({
              where: { NOT: { deletedAt: null } },
              select: { id: true, dveplCode: true, partyName: true, deletedAt: true, updatedAt: true },
            })
          : [];

        const deletedTasks = (!module || module === "task")
          ? await fastify.prisma.task.findMany({
              where: { NOT: { deletedAt: null } },
              select: { id: true, title: true, deletedAt: true, updatedAt: true },
            })
          : [];

        const deletedVendors = (!module || module === "vendor")
          ? await fastify.prisma.vendor.findMany({
              where: { NOT: { deletedAt: null } },
              select: { id: true, name: true, deletedAt: true, updatedAt: true },
            })
          : [];

        const deletedUsers = (!module || module === "user")
          ? await fastify.prisma.user.findMany({
              where: { NOT: { deletedAt: null } },
              select: { id: true, name: true, email: true, deletedAt: true, updatedAt: true },
            })
          : [];

        const deletedCustomFields = (!module || module === "customfield")
          ? await fastify.prisma.customField.findMany({
              where: { NOT: { deletedAt: null } },
              select: { id: true, name: true, module: true, deletedAt: true, updatedAt: true },
            })
          : [];

        const formatted = [
          ...deletedOrders.map((o) => ({
            id: o.id,
            module: "order",
            name: `${o.dveplCode || "Sales Order"} - ${o.partyName || "Client"}`,
            deletedBy: "Admin",
            deletedAt: o.deletedAt,
          })),
          ...deletedTasks.map((t) => ({
            id: t.id,
            module: "task",
            name: t.title || "Task Record",
            deletedBy: "Admin",
            deletedAt: t.deletedAt,
          })),
          ...deletedVendors.map((v) => ({
            id: v.id,
            module: "vendor",
            name: v.name || "Vendor Profile",
            deletedBy: "Admin",
            deletedAt: v.deletedAt,
          })),
          ...deletedUsers.map((u) => ({
            id: u.id,
            module: "user",
            name: `${u.name} (${u.email})`,
            deletedBy: "System Admin",
            deletedAt: u.deletedAt,
          })),
          ...deletedCustomFields.map((cf) => ({
            id: cf.id,
            module: "customfield",
            name: `Custom Field (${cf.module}): ${cf.name}`,
            deletedBy: "Admin",
            deletedAt: cf.deletedAt,
          })),
        ];

        return reply.status(200).send({
          success: true,
          data: formatted,
        });
      } catch (error) {
        adminLogs.error("Failed to fetch recycle bin items", { error });
        return reply.status(500).send({
          success: false,
          message: "Internal server error fetching recycle bin items.",
        });
      }
    }
  );

  // 2. Restore a soft-deleted record (set deletedAt = null)
  fastify.post(
    "/restore/:module/:id",
    {
      schema: {
        tags: ["Recycle Bin"],
        summary: "Restore soft-deleted item",
        description: "Restores a soft-deleted item by setting deletedAt back to null",
      },
    },
    async (request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) => {
      try {
        const { module, id } = request.params;

        if (module === "order") {
          await fastify.prisma.salesOrder.update({ where: { id }, data: { deletedAt: null } });
        } else if (module === "task") {
          await fastify.prisma.task.update({ where: { id }, data: { deletedAt: null } });
        } else if (module === "vendor") {
          await fastify.prisma.vendor.update({ where: { id }, data: { deletedAt: null } });
        } else if (module === "user") {
          await fastify.prisma.user.update({ where: { id }, data: { deletedAt: null } });
        } else if (module === "customfield") {
          await fastify.prisma.customField.update({ where: { id }, data: { deletedAt: null } });
        } else {
          return reply.status(400).send({ success: false, message: "Invalid module specified." });
        }

        return reply.status(200).send({
          success: true,
          message: `${module} record restored successfully.`,
        });
      } catch (error) {
        adminLogs.error("Failed to restore recycle bin item", { error });
        return reply.status(500).send({
          success: false,
          message: "Failed to restore record.",
        });
      }
    }
  );

  // 3. Permanent delete a record from database
  fastify.delete(
    "/permanent-delete/:module/:id",
    {
      schema: {
        tags: ["Recycle Bin"],
        summary: "Permanently delete item",
        description: "Deletes a record permanently from the database",
      },
    },
    async (request: FastifyRequest<{ Params: ItemParams }>, reply: FastifyReply) => {
      try {
        const { module, id } = request.params;

        if (module === "order") {
          await fastify.prisma.salesOrderItem.deleteMany({ where: { salesOrderId: id } });
          await fastify.prisma.salesOrder.delete({ where: { id } });
        } else if (module === "task") {
          await fastify.prisma.task.delete({ where: { id } });
        } else if (module === "vendor") {
          await fastify.prisma.vendor.delete({ where: { id } });
        } else if (module === "user") {
          await fastify.prisma.user.delete({ where: { id } });
        } else if (module === "customfield") {
          await fastify.prisma.customFieldOption.deleteMany({ where: { customFieldId: id } });
          await fastify.prisma.customFieldValue.deleteMany({ where: { customFieldId: id } });
          await fastify.prisma.customField.delete({ where: { id } });
        } else {
          return reply.status(400).send({ success: false, message: "Invalid module specified." });
        }

        return reply.status(200).send({
          success: true,
          message: `${module} record permanently deleted.`,
        });
      } catch (error) {
        adminLogs.error("Failed to permanently delete item", { error });
        return reply.status(500).send({
          success: false,
          message: "Failed to permanently delete record.",
        });
      }
    }
  );

  // 4. Empty entire Recycle Bin
  fastify.delete(
    "/empty",
    {
      schema: {
        tags: ["Recycle Bin"],
        summary: "Empty entire recycle bin",
        description: "Permanently deletes all soft-deleted records",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const deletedOrderIds = (
          await fastify.prisma.salesOrder.findMany({
            where: { NOT: { deletedAt: null } },
            select: { id: true },
          })
        ).map((o) => o.id);

        if (deletedOrderIds.length > 0) {
          await fastify.prisma.salesOrderItem.deleteMany({
            where: { salesOrderId: { in: deletedOrderIds } },
          });
          await fastify.prisma.salesOrder.deleteMany({
            where: { id: { in: deletedOrderIds } },
          });
        }

        await fastify.prisma.task.deleteMany({ where: { NOT: { deletedAt: null } } });
        await fastify.prisma.vendor.deleteMany({ where: { NOT: { deletedAt: null } } });
        await fastify.prisma.user.deleteMany({ where: { NOT: { deletedAt: null } } });

        return reply.status(200).send({
          success: true,
          message: "Recycle bin emptied successfully.",
        });
      } catch (error) {
        adminLogs.error("Failed to empty recycle bin", { error });
        return reply.status(500).send({
          success: false,
          message: "Failed to empty recycle bin.",
        });
      }
    }
  );
}

export default recycleBinRoutes;
