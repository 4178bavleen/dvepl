import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from "fastify";
import * as XLSX from "xlsx-js-style";

async function adminSalesOrderDownloadTemplateRoutes(
  fastify: FastifyInstance,
  options: FastifyPluginOptions
) {
  fastify.get(
    "/",
    {
      schema: {
        tags: ["Sales Order"],
        summary: "Download Bulk Upload Template",
        description: "Returns a styled Excel (.xlsx) template for bulk uploading sales orders.",
      },
      preHandler: [
        fastify.verifyToken,
        fastify.authorizePermissions(["company.create"]),
      ],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      // Dynamically fetch first active company name for sample row mapping
      const activeCompany = await fastify.prisma.company.findFirst({
        where: { deletedAt: null },
        select: { name: true }
      });
      const companyName = activeCompany?.name || "DVEPL";

      // Human-readable headers (using Company Name instead of Company Id)
      const headers = [
        "Company Name",
        "Dvepl Code",
        "Status",
        "Party Name",
        "Ca No",
        "Contact Details",
        "Order Confirm Date",
        "Delivery Month Target",
        "Po Date",
        "Drawing Concerned Person",
        "Drawing Approved Date",
        "Drawing Status",
        "Drawing Remarks",
        "Inspection Field",
        "Remarks",
        "Item Code",
        "Item Description",
        "Item Unit",
        "Item Quantity",
        "Item Rate",
        "Item Gst Percentage",
        "Item Remarks",
        "Order Taken By",
        "Assigned To"
      ];

      // Sample data demonstrating multiple line items under the same DVEPL order code
      const dataRows = [
        [
          companyName,
          "dvepl2026001",
          "PENDING",
          "Reliance Industries",
          "CA-88992",
          "contact@reliance.com",
          "2026-07-24",
          "August 2026",
          "2026-07-23",
          "Drawing Person A",
          "2026-07-24",
          "PENDING",
          "Under review",
          "Third-Party Inspection",
          "Standard delivery requirements",
          "ITEM-101",
          "Stainless Steel Valve 2inch",
          "Nos",
          "15",
          "2450.00",
          "18",
          "Main line valve",
          "Admin",
          "Amit Sharma"
        ],
        [
          companyName,
          "dvepl2026001",
          "PENDING",
          "Reliance Industries",
          "CA-88992",
          "contact@reliance.com",
          "2026-07-24",
          "August 2026",
          "2026-07-23",
          "Drawing Person A",
          "2026-07-24",
          "PENDING",
          "Under review",
          "Third-Party Inspection",
          "Standard delivery requirements",
          "ITEM-102",
          "Flange Connector Gasket",
          "Nos",
          "30",
          "480.00",
          "18",
          "Connector seals",
          "Admin",
          "Amit Sharma"
        ]
      ];

      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1:X3");

      // Style Header Cells (Row 0)
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        if (cell) {
          cell.s = {
            font: {
              name: "Arial",
              sz: 10,
              bold: true,
              color: { rgb: "FFFFFF" }
            },
            fill: {
              fgColor: { rgb: "1F497D" } // Steel Navy Blue background
            },
            alignment: {
              horizontal: "center",
              vertical: "center",
              wrapText: true
            },
            border: {
              top: { style: "medium", color: { rgb: "000000" } },
              bottom: { style: "medium", color: { rgb: "000000" } },
              left: { style: "thin", color: { rgb: "000000" } },
              right: { style: "thin", color: { rgb: "000000" } }
            }
          };
        }
      }

      // Style Data Cells (Rows 1+)
      for (let row = 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          if (cell) {
            cell.s = {
              font: {
                name: "Arial",
                sz: 9
              },
              border: {
                top: { style: "thin", color: { rgb: "D9D9D9" } },
                bottom: { style: "thin", color: { rgb: "D9D9D9" } },
                left: { style: "thin", color: { rgb: "D9D9D9" } },
                right: { style: "thin", color: { rgb: "D9D9D9" } }
              },
              alignment: {
                vertical: "center"
              }
            };
          }
        }
      }

      // Set standard row heights (Header row higher for spacing)
      worksheet["!rows"] = [
        { hpt: 26 }, // Header row height
        { hpt: 20 }, // Data row 1
        { hpt: 20 }  // Data row 2
      ];

      // Auto-fit column widths based on contents
      const maxColLengths = headers.map((h, i) => {
        let maxLen = h.length;
        dataRows.forEach(row => {
          const val = String(row[i] || "");
          if (val.length > maxLen) {
            maxLen = val.length;
          }
        });
        return { wch: maxLen + 3 }; // Padding
      });
      worksheet["!cols"] = maxColLengths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Orders");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      reply
        .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        .header("Content-Disposition", 'attachment; filename="sales_orders_bulk_template.xlsx"')
        .send(buffer);
    }
  );
}

export default adminSalesOrderDownloadTemplateRoutes;
