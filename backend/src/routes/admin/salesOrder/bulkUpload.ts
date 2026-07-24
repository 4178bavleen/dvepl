import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import * as XLSX from "xlsx";
import { Prisma } from "@prisma/client";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminSalesOrderBulkUploadRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Bulk Upload Sales Orders via Excel/CSV",
        description: "Process bulk upload of sales orders using a multipart spreadsheet file.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["company.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const fileData = await request.file();
        if (!fileData) {
          return reply.status(400).send({
            success: false,
            message: "No file uploaded. Please upload a valid Excel file.",
          });
        }

        const filename = fileData.filename.toLowerCase();
        const isExcel = filename.endsWith(".xlsx") || filename.endsWith(".xls");
        if (!isExcel) {
          return reply.status(400).send({
            success: false,
            message: "Invalid file format. Only Excel files (.xlsx, .xls) are allowed.",
          });
        }

        const buffer = await fileData.toBuffer();
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet);

        if (rows.length === 0) {
          return reply.status(400).send({
            success: false,
            message: "Spreadsheet is empty or missing data rows.",
          });
        }

        const headerMap: Record<string, string> = {
          "company name": "companyName",
          "dvepl code": "dveplCode",
          "status": "status",
          "party name": "partyName",
          "ca no": "caNo",
          "contact details": "contactDetails",
          "order confirm date": "orderConfirmDate",
          "delivery month target": "deliveryMonthTarget",
          "po date": "poDate",
          "drawing concerned person": "drawingConcernedPerson",
          "drawing approved date": "drawingApprovedDate",
          "drawing status": "drawingStatus",
          "drawing remarks": "drawingRemarks",
          "inspection field": "inspectionField",
          "remarks": "remarks",
          "item code": "itemCode",
          "item description": "itemDescription",
          "item unit": "itemUnit",
          "item quantity": "itemQuantity",
          "item rate": "itemRate",
          "item gst percentage": "itemGstPercentage",
          "item remarks": "itemRemarks"
        };

        const ordersMap = new Map<string, any>();
        for (const rawRow of rows) {
          // Normalize keys to lowercase/spaces, then map to internal camelCase properties
          const row: any = {};
          for (const key of Object.keys(rawRow)) {
            const cleanKey = key.trim().toLowerCase();
            const mappedKey = headerMap[cleanKey] || key;
            row[mappedKey] = rawRow[key];
          }

          const dveplCode = String(row.dveplCode || "").trim();
          if (!dveplCode) continue;

          if (!ordersMap.has(dveplCode)) {
            ordersMap.set(dveplCode, {
              companyName: String(row.companyName || "").trim(),
              dveplCode,
              status: String(row.status || "PENDING").toUpperCase(),
              partyName: String(row.partyName || "").trim(),
              caNo: row.caNo ? String(row.caNo) : null,
              contactDetails: row.contactDetails ? String(row.contactDetails) : null,
              orderConfirmDate: row.orderConfirmDate ? String(row.orderConfirmDate) : null,
              deliveryMonthTarget: row.deliveryMonthTarget ? String(row.deliveryMonthTarget) : null,
              poDate: row.poDate ? String(row.poDate) : null,
              drawingConcernedPerson: row.drawingConcernedPerson ? String(row.drawingConcernedPerson) : null,
              drawingApprovedDate: row.drawingApprovedDate ? String(row.drawingApprovedDate) : null,
              drawingStatus: String(row.drawingStatus || "PENDING").toUpperCase(),
              drawingRemarks: row.drawingRemarks ? String(row.drawingRemarks) : null,
              inspectionField: row.inspectionField ? String(row.inspectionField) : null,
              remarks: row.remarks ? String(row.remarks) : null,
              sendNotification: row.sendNotification === "true" || row.sendNotification === 1 || row.sendNotification === "1",
              items: [],
            });
          }

          const order = ordersMap.get(dveplCode);
          const itemCode = String(row.itemCode || "").trim();
          if (itemCode) {
            order.items.push({
              itemCode,
              description: String(row.itemDescription || "No description").trim(),
              unit: String(row.itemUnit || "Nos").trim(),
              quantity: Number(row.itemQuantity) || 0,
              rate: Number(row.itemRate) || 0,
              gstPercentage: Number(row.itemGstPercentage) || 0,
              remarks: row.itemRemarks ? String(row.itemRemarks) : null,
            });
          }
        }

        const orders = Array.from(ordersMap.values());
        const results = {
          successCount: 0,
          failureCount: 0,
          errors: [] as Array<{ dveplCode: string; error: string }>,
          createdOrders: [] as string[],
        };

        const createdById = (request.admin as any)?.id;

        if (!createdById) {
          return reply.status(401).send({
            success: false,
            message: "Creator user ID missing from authenticated request context.",
          });
        }

        for (const orderData of orders) {
          try {
            await fastify.prisma.$transaction(async (tx) => {
              const existingOrder = await tx.salesOrder.findUnique({
                where: { dveplCode: orderData.dveplCode },
              });

              if (existingOrder) {
                throw new Error(`DVEPL Code '${orderData.dveplCode}' already exists.`);
              }

              const company = await tx.company.findFirst({
                where: {
                  name: {
                    equals: orderData.companyName,
                    mode: "insensitive"
                  },
                  deletedAt: null
                }
              });

              if (!company) {
                throw new Error(`Company with name '${orderData.companyName}' was not found.`);
              }

              const companyId = company.id;

              let subtotal = 0;
              let gstTotal = 0;

              for (const item of orderData.items) {
                const itemAmount = Number(item.quantity) * Number(item.rate);
                const itemGST = itemAmount * (Number(item.gstPercentage) / 100);
                subtotal += itemAmount;
                gstTotal += itemGST;
              }

              const grandTotal = subtotal + gstTotal;

              let mappedDrawingStatus = "PENDING";
              if (orderData.drawingStatus) {
                const ds = orderData.drawingStatus.toUpperCase();
                if (ds === "IN PROCESS" || ds === "IN PROGRESS" || ds === "IN_PROGRESS") {
                  mappedDrawingStatus = "IN_PROGRESS";
                } else if (ds === "APPROVED") {
                  mappedDrawingStatus = "APPROVED";
                } else if (ds === "REJECTED") {
                  mappedDrawingStatus = "REJECTED";
                }
              }

              const salesOrder = await tx.salesOrder.create({
                data: {
                  companyId,
                  dveplCode: orderData.dveplCode,
                  status: orderData.status as any,
                  partyName: orderData.partyName,
                  caNo: orderData.caNo ?? null,
                  contactDetails: orderData.contactDetails ?? null,
                  orderConfirmDate: orderData.orderConfirmDate ? new Date(orderData.orderConfirmDate) : null,
                  deliveryMonthTarget: orderData.deliveryMonthTarget ?? null,
                  poDate: orderData.poDate ? new Date(orderData.poDate) : null,
                  drawingConcernedPerson: orderData.drawingConcernedPerson ?? null,
                  drawingApprovedDate: orderData.drawingApprovedDate ? new Date(orderData.drawingApprovedDate) : null,
                  drawingStatus: mappedDrawingStatus as any,
                  drawingRemarks: orderData.drawingRemarks ?? null,
                  inspectionField: orderData.inspectionField ?? null,
                  sendNotification: orderData.sendNotification,
                  remarks: orderData.remarks ?? null,
                  createdById,
                  subtotal: new Prisma.Decimal(subtotal),
                  gstTotal: new Prisma.Decimal(gstTotal),
                  grandTotal: new Prisma.Decimal(grandTotal),
                },
              });

              if (orderData.items.length > 0) {
                await tx.salesOrderItem.createMany({
                  data: orderData.items.map((item: any, idx: number) => {
                    const itemAmount = Number(item.quantity) * Number(item.rate);
                    return {
                      salesOrderId: salesOrder.id,
                      itemCode: item.itemCode || `ITEM-${idx + 1}`,
                      description: item.description || "No description",
                      unit: item.unit || "Nos",
                      quantity: new Prisma.Decimal(item.quantity),
                      unitPrice: new Prisma.Decimal(item.rate),
                      gstPercentage: new Prisma.Decimal(item.gstPercentage),
                      totalPrice: new Prisma.Decimal(itemAmount),
                      remarks: item.remarks ?? null,
                    };
                  }),
                });
              }

              results.createdOrders.push(salesOrder.dveplCode);
              results.successCount++;
            });
          } catch (err: any) {
            results.failureCount++;
            results.errors.push({
              dveplCode: orderData.dveplCode,
              error: err.message || "Unknown error processing record.",
            });
          }
        }

        adminLogs.info("Bulk Sales Order upload processed", {
          successCount: results.successCount,
          failureCount: results.failureCount,
        });

        return reply.status(results.failureCount > 0 ? 207 : 200).send({
          success: true,
          message: `Bulk upload completed. Success: ${results.successCount}, Failures: ${results.failureCount}`,
          data: results,
        });
      } catch (error: any) {
        adminLogs.error("Bulk upload route failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error during bulk upload processing.",
        });
      }
    }
  );
}

export default adminSalesOrderBulkUploadRoutes;
