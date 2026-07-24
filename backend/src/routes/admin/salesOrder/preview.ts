import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import * as XLSX from "xlsx";
import { adminLogs } from "../../../services/logger/contextLogger";

async function adminSalesOrderPreviewRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.post(
    "/",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Preview Bulk Upload Sales Orders",
        description: "Validates and parses bulk upload spreadsheet file, returning validation status.",
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
          "concerned person": "drawingConcernedPerson",
          "concerned persons": "drawingConcernedPerson",
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
          "item remarks": "itemRemarks",
          "order taken by": "orderTakenBy",
          "assigned to": "assignedTo"
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
              drawingConcernedPerson: row.drawingConcernedPerson ? String(row.drawingConcernedPerson).trim() : null,
              drawingApprovedDate: row.drawingApprovedDate ? String(row.drawingApprovedDate) : null,
              drawingStatus: String(row.drawingStatus || "PENDING").toUpperCase(),
              drawingRemarks: row.drawingRemarks ? String(row.drawingRemarks) : null,
              inspectionField: row.inspectionField ? String(row.inspectionField) : null,
              remarks: row.remarks ? String(row.remarks) : null,
              sendNotification: row.sendNotification === "true" || row.sendNotification === 1 || row.sendNotification === "1",
              orderTakenBy: row.orderTakenBy ? String(row.orderTakenBy).trim() : null,
              assignedTo: row.assignedTo ? String(row.assignedTo).trim() : null,
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
        const previewResults = [] as Array<{
          dveplCode: string;
          partyName: string;
          isValid: boolean;
          errors: string[];
          calculatedTotals: {
            subtotal: number;
            gstTotal: number;
            grandTotal: number;
          };
        }>;

        for (const order of orders) {
          const errors: string[] = [];

          const duplicate = await fastify.prisma.salesOrder.findUnique({
            where: { dveplCode: order.dveplCode },
          });

          if (duplicate) {
            errors.push(`DVEPL Code '${order.dveplCode}' already exists in the database.`);
          }

          const company = await fastify.prisma.company.findFirst({
            where: {
              name: {
                equals: order.companyName,
                mode: "insensitive"
              },
              deletedAt: null
            }
          });

          if (!company) {
            errors.push(`Company with name '${order.companyName}' was not found or deleted.`);
          }

          let subtotal = 0;
          let gstTotal = 0;
          for (const item of order.items) {
            const itemAmount = Number(item.quantity) * Number(item.rate);
            const itemGST = itemAmount * (Number(item.gstPercentage) / 100);
            subtotal += itemAmount;
            gstTotal += itemGST;
          }
          const grandTotal = subtotal + gstTotal;

          previewResults.push({
            dveplCode: order.dveplCode,
            partyName: order.partyName,
            isValid: errors.length === 0,
            errors,
            calculatedTotals: {
              subtotal,
              gstTotal,
              grandTotal,
            },
          });
        }

        return reply.status(200).send({
          success: true,
          message: "Preview processing complete.",
          data: {
            totalRows: previewResults.length,
            validRows: previewResults.filter((r) => r.isValid).length,
            invalidRows: previewResults.filter((r) => !r.isValid).length,
            rows: previewResults,
          },
        });
      } catch (error: any) {
        adminLogs.error("Bulk upload preview route failed", { error });
        return reply.status(500).send({
          success: false,
          message: "Server error during preview processing.",
        });
      }
    }
  );
}

export default adminSalesOrderPreviewRoutes;
