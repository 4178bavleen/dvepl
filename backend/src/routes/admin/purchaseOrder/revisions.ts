import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { adminLogs } from "../../../services/logger/contextLogger";
import { syncSalesOrderWorkflowFromPo } from "../../../utils/workflowSync";

async function adminPurchaseOrderRevisionsRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions,
) {
  // GET: List all revisions
  fastify.get(
    "/list",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Get all Purchase Order Revisions",
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const companyId = request.user.companyId;

        // Fetch all revisions where vendor belongs to the company
        const revisions = await fastify.prisma.purchaseOrderRevision.findMany({
          where: {
            vendor: {
              companyId,
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // Map database records back to the frontend PORevision shape
        const mapped = revisions.map((rev) => ({
          id: rev.id,
          vendorId: rev.vendorId,
          poNumber: rev.poNumber,
          poDate: rev.poDate,
          poStatus: rev.poStatus,
          paymentTerms: rev.paymentTerms || "",
          materialStatus: rev.materialStatus || "",
          advance: Number(rev.advance),
          remarks: rev.remarks || "",
          cgstPercent: Number(rev.cgstPercent),
          sgstPercent: Number(rev.sgstPercent),
          igstPercent: Number(rev.igstPercent),
          subtotal: Number(rev.subtotal),
          cgstAmount: Number(rev.cgstAmount),
          sgstAmount: Number(rev.sgstAmount),
          igstAmount: Number(rev.igstAmount),
          grandTotal: Number(rev.grandTotal),
          termsAndConditions: rev.termsAndConditions || "",
          lineItems: rev.lineItems,
          companyDetails: rev.companyDetails,
          createdAt: rev.createdAt.toISOString(),
          createdBy: rev.createdBy,
          revisionNo: rev.revisionNo,
          customColumns: rev.customColumns || [],
          referenceCode: rev.referenceCode || "",
        }));

        // Fetch all purchase orders for the company to synthesize missing R0 revisions
        const purchaseOrders = await fastify.prisma.purchaseOrder.findMany({
          where: {
            companyId,
            deletedAt: null,
          },
          include: {
            items: {
              include: {
                material: true,
              },
            },
            company: true,
            createdBy: true,
            vendor: true,
          },
        });

        const synthesizedRevisions: any[] = [];
        for (const po of purchaseOrders) {
          // Check if there is already a revision for this poNumber
          const hasRevision = mapped.some((r) => r.poNumber === po.poNo);
          if (!hasRevision) {
            // Map PO status to friendly name
            let poStatus = "Pending";
            if (po.status === "APPROVED") {
              poStatus = "Ready";
            } else if (po.status === "SENT") {
              poStatus = "Placed";
            } else if (po.status === "COMPLETED") {
              poStatus = "Ordered";
            } else if (po.status === "CANCELLED") {
              poStatus = "Cancelled";
            }

            synthesizedRevisions.push({
              id: `synthesized-${po.id}`,
              vendorId: po.vendorId,
              poNumber: po.poNo,
              poDate: po.orderDate.toISOString().split("T")[0],
              poStatus,
              paymentTerms: po.paymentTerms || "",
              materialStatus: "Pending",
              advance: 0,
              remarks: po.remarks || "",
              cgstPercent: 0,
              sgstPercent: 0,
              igstPercent: 0,
              subtotal: Number(po.subtotal),
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: Number(po.tax),
              grandTotal: Number(po.total),
              termsAndConditions: po.shippingTerms || "",
              lineItems: po.items.map((item) => ({
                id: item.id,
                materialId: item.materialId,
                inventoryId: item.materialId,
                description: item.material?.name || item.remarks || "",
                qty: Number(item.quantity),
                unit: "Nos",
                hsnCode: "",
                catNo: "",
                rate: Number(item.unitPrice),
                discountPercent: 0,
                net: Number(item.totalPrice),
                total: Number(item.totalPrice),
              })),
              companyDetails: {
                name: po.company.name || "",
                address: po.company.address || "",
                phone: po.company.phone || "",
                email: po.company.email || "",
                gstin: po.company.gst || "",
                iso: "",
              },
              createdAt: po.createdAt.toISOString(),
              createdBy: po.createdBy?.name || "System",
              revisionNo: 0,
              customColumns: [],
              referenceCode: po.referenceCode || "",
            });
          }
        }

        const allRevisions = [...mapped, ...synthesizedRevisions];

        return reply.send({
          success: true,
          data: allRevisions,
        });
      } catch (error: any) {
        console.error(error);
        return reply.status(500).send({
          success: false,
          message: "Failed to load PO revisions",
          error: error.message,
        });
      }
    },
  );

  // POST: Create a revision
  fastify.post(
    "/create",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Create Purchase Order Revision",
      },
    },
    async (
      request: FastifyRequest<{
        Body: {
          id?: string;
          vendorId: string;
          poNumber: string;
          poDate: string;
          poStatus: string;
          paymentTerms?: string;
          materialStatus?: string;
          advance?: number;
          remarks?: string;
          cgstPercent?: number;
          sgstPercent?: number;
          igstPercent?: number;
          subtotal?: number;
          cgstAmount?: number;
          sgstAmount?: number;
          igstAmount?: number;
          grandTotal?: number;
          termsAndConditions?: string;
          lineItems: any;
          companyDetails: any;
          createdBy: string;
          revisionNo: number;
          customColumns?: string[];
          referenceCode?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const body = request.body;

        // Try to locate a purchase order that matches the PO number
        const po = await fastify.prisma.purchaseOrder.findFirst({
          where: {
            poNo: body.poNumber,
            deletedAt: null,
          },
        });

        // Insert into database
        const created = await fastify.prisma.purchaseOrderRevision.create({
          data: {
            ...(body.id ? { id: body.id } : {}),
            purchaseOrderId: po?.id || null,
            vendorId: body.vendorId,
            poNumber: body.poNumber,
            poDate: body.poDate,
            poStatus: body.poStatus,
            paymentTerms: body.paymentTerms,
            materialStatus: body.materialStatus,
            advance: body.advance ?? 0,
            remarks: body.remarks,
            cgstPercent: body.cgstPercent ?? 0,
            sgstPercent: body.sgstPercent ?? 0,
            igstPercent: body.igstPercent ?? 0,
            subtotal: body.subtotal ?? 0,
            cgstAmount: body.cgstAmount ?? 0,
            sgstAmount: body.sgstAmount ?? 0,
            igstAmount: body.igstAmount ?? 0,
            grandTotal: body.grandTotal ?? 0,
            termsAndConditions: body.termsAndConditions,
            lineItems: body.lineItems,
            companyDetails: body.companyDetails,
            createdBy: body.createdBy,
            revisionNo: body.revisionNo,
            customColumns: body.customColumns,
            referenceCode: body.referenceCode,
          },
        });

        // Sync parent PurchaseOrder status
        if (po) {
          let mappedStatus: any = "DRAFT";
          const statusVal = body.poStatus || "";
          if (statusVal === "Placed" || statusVal === "Ordered" || statusVal === "SENT") {
            mappedStatus = "SENT";
          } else if (statusVal === "Ready" || statusVal === "APPROVED") {
            mappedStatus = "APPROVED";
          } else if (statusVal === "Partially Received" || statusVal === "PARTIAL_RECEIVED") {
            mappedStatus = "PARTIAL_RECEIVED";
          } else if (statusVal === "Received" || statusVal === "COMPLETED") {
            mappedStatus = "COMPLETED";
          } else if (statusVal === "Cancelled" || statusVal === "CANCELLED") {
            mappedStatus = "CANCELLED";
          }

          await fastify.prisma.purchaseOrder.update({
            where: { id: po.id },
            data: {
              status: mappedStatus,
            },
          });
        }

        // Sync with SalesOrder workflow stage if referenceCode is present
        await syncSalesOrderWorkflowFromPo(
          fastify.prisma,
          body.referenceCode,
          body.poStatus,
          request.user.id
        );

        adminLogs.info("PO Revision created", {
          revisionId: created.id,
          poNumber: created.poNumber,
        });

        return reply.send({
          success: true,
          data: {
            ...created,
            advance: Number(created.advance),
            cgstPercent: Number(created.cgstPercent),
            sgstPercent: Number(created.sgstPercent),
            igstPercent: Number(created.igstPercent),
            subtotal: Number(created.subtotal),
            cgstAmount: Number(created.cgstAmount),
            sgstAmount: Number(created.sgstAmount),
            igstAmount: Number(created.igstAmount),
            grandTotal: Number(created.grandTotal),
          },
        });
      } catch (error: any) {
        console.error(error);
        return reply.status(500).send({
          success: false,
          message: "Failed to create PO revision",
          error: error.message,
        });
      }
    },
  );

  // DELETE: Delete a revision
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["Purchase Order"],
        summary: "Delete Purchase Order Revision",
      },
    },
    async (
      request: FastifyRequest<{
        Params: {
          id: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const { id } = request.params;

        await fastify.prisma.purchaseOrderRevision.delete({
          where: {
            id,
          },
        });

        adminLogs.info("PO Revision deleted", {
          revisionId: id,
        });

        return reply.send({
          success: true,
          message: "Revision deleted successfully.",
        });
      } catch (error: any) {
        console.error(error);
        return reply.status(500).send({
          success: false,
          message: "Failed to delete PO revision",
          error: error.message,
        });
      }
    },
  );
}

export default adminPurchaseOrderRevisionsRoutes;
