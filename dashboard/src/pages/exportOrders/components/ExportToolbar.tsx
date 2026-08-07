import { FileText, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { PdfOpts } from "../ExportOrdersPage";

interface Props {
  selectedOrderIds: string[];
  selectedDrawingIds: string[];
  orders: any[];
  selectedOrders: any[];
  drawings: any[];
  pdfOptions: PdfOpts;
  onReset: () => void;
}

function fmtCurrency(val: any) {
  return `INR ${Number(val ?? 0).toLocaleString("en-IN")}`;
}

export default function ExportToolbar({
  selectedOrderIds,
  selectedDrawingIds,
  selectedOrders,
  drawings,
  pdfOptions,
  onReset,
}: Props) {
  const selectedDrawings = drawings.filter((d) =>
    selectedDrawingIds.includes(d.id)
  );

  const handleGeneratePdf = () => {
    if (selectedOrders.length === 0) {
      toast.error("Select at least one order before generating a PDF.");
      return;
    }

    const doc = new jsPDF({
      orientation: pdfOptions.landscapeMode ? "landscape" : "portrait",
    });

    // ── Header ─────────────────────────────────────────────────────────
    if (pdfOptions.companyHeader) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("DV Electromatic Pvt. Ltd.", 14, 16);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("Export Orders Report", 14, 22);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 14, 28);
    }

    // ── Orders table ───────────────────────────────────────────────────
    const startY = pdfOptions.companyHeader ? 35 : 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Selected Sales Orders", 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [["SO Number", "Customer", "Status", "Amount", "Delivery"]],
      body: selectedOrders.map((o) => [
        o.dveplCode,
        o.partyName,
        o.status,
        fmtCurrency(o.grandTotal),
        o.deliveryMonthTarget ?? "—",
      ]),
      alternateRowStyles: pdfOptions.alternateRows ? { fillColor: [245, 245, 245] } : {},
      styles: { fontSize: 9 },
    });

    // ── Drawings section ───────────────────────────────────────────────
    if (pdfOptions.includeDrawings && selectedDrawings.length > 0) {
      const lastTable = (doc as any).lastAutoTable;
      const drawingY = (lastTable?.finalY ?? startY + 60) + 12;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Attached Drawings", 14, drawingY);

      autoTable(doc, {
        startY: drawingY + 4,
        head: [["Drawing No", "Title", "Type", "Status", "File"]],
        body: selectedDrawings.map((d) => [
          d.drawingNo,
          d.title,
          d.drawingType,
          d.status,
          d.fileName,
        ]),
        alternateRowStyles: pdfOptions.alternateRows ? { fillColor: [245, 245, 245] } : {},
        styles: { fontSize: 9 },
      });
    }

    // ── Footer ─────────────────────────────────────────────────────────
    if (pdfOptions.companyFooter) {
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(
          "DV Electromatic Pvt. Ltd. | Confidential Export Report",
          14,
          doc.internal.pageSize.getHeight() - 10
        );
        if (pdfOptions.pageNumbers) {
          doc.text(
            `Page ${i} of ${pageCount}`,
            doc.internal.pageSize.getWidth() - 30,
            doc.internal.pageSize.getHeight() - 10
          );
        }
      }
    }

    doc.save(
      `export-report-${new Date().toISOString().slice(0, 10)}.pdf`
    );
    toast.success("PDF generated successfully.");
  };

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">Export Orders</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Generate professional PDF reports with drawings.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-lg border px-4 py-2 text-center min-w-[110px]">
            <p className="text-xs text-muted-foreground">Selected Orders</p>
            <p className="text-2xl font-bold">{selectedOrderIds.length}</p>
          </div>

          <div className="rounded-lg border px-4 py-2 text-center min-w-[120px]">
            <p className="text-xs text-muted-foreground">Drawings</p>
            <p className="text-2xl font-bold">{selectedDrawingIds.length}</p>
          </div>

          <Button variant="outline" className="gap-2" onClick={onReset}>
            <RefreshCw className="h-4 w-4" />
            Reset
          </Button>

          <Button className="gap-2" onClick={handleGeneratePdf}>
            <Download className="h-4 w-4" />
            Generate PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}