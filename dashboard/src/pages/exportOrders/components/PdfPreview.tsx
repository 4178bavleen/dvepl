import { FileText } from "lucide-react";
import type { PdfOpts } from "../ExportOrdersPage";
import type { ExportOrder } from "@/types/exportOrders";

interface Props {
  selectedOrders: ExportOrder[];
  pdfOptions: PdfOpts;
}

export default function PdfPreview({ selectedOrders, pdfOptions }: Props) {
  return (
    <div className="rounded-lg border bg-background h-full">
      <div className="border-b px-5 py-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <FileText size={18} />
          PDF Preview
        </h2>
      </div>

      <div className="p-5">
        <div className="aspect-[210/297] rounded-md border bg-white shadow-sm p-6 overflow-hidden">
          {pdfOptions.companyHeader && (
            <div className="border-b pb-4 mb-4">
              <h1 className="text-xl font-bold">DV Electromatic Pvt. Ltd.</h1>
              <p className="text-xs text-gray-500">Export Report Preview</p>
            </div>
          )}

          {selectedOrders.length === 0 ? (
            <div className="mt-8 border rounded p-4">
              <p className="font-medium">Orders Preview</p>
              <p className="text-sm text-muted-foreground">
                Selected orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2 mt-2">
              {/* Mini table header */}
              <div className="grid grid-cols-3 text-xs font-semibold text-gray-500 border-b pb-1">
                <span>SO No</span>
                <span>Customer</span>
                <span>Amount</span>
              </div>
              {selectedOrders.slice(0, 8).map((o) => (
                <div key={o.id} className="grid grid-cols-3 text-xs py-0.5 border-b border-gray-100">
                  <span className="font-medium truncate">{o.dveplCode}</span>
                  <span className="truncate text-gray-600">{o.partyName}</span>
                  <span>₹{Number(o.grandTotal ?? 0).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {selectedOrders.length > 8 && (
                <p className="text-xs text-muted-foreground pt-1">
                  +{selectedOrders.length - 8} more orders…
                </p>
              )}
            </div>
          )}

          {pdfOptions.companyFooter && (
            <div className="absolute bottom-4 left-4 right-4 border-t pt-2">
              <p className="text-[9px] text-gray-400">
                DV Electromatic Pvt. Ltd. | Confidential
                {pdfOptions.pageNumbers && "  ·  Page 1"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
