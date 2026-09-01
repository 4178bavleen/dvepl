import React, { useRef } from "react";
import { X, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccountCostingData } from "../types";

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: AccountCostingData;
  calculatedValues: {
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
  };
}

export const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  data,
  calculatedValues,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-card text-card-foreground rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/20">
              <Printer className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">
                Delivery Note & Costing Summary
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Print ready delivery voucher for Order {data.orderCode}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <Printer className="size-3.5" />
              Print Note
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Container */}
        <div className="p-6 md:p-8 overflow-y-auto bg-muted/30 scrollbar-thin">
          <div 
            ref={printRef}
            id="printable-delivery-note"
            className="bg-card text-card-foreground p-8 rounded-2xl shadow-xs border border-border text-foreground max-w-3xl mx-auto print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:text-black"
          >
            {/* Top Company Header */}
            <div className="flex justify-between items-start border-b-2 border-primary pb-5 mb-6">
              <div>
                <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
                  <span className="text-primary font-black text-2xl tracking-wider">DVEPL</span>
                  <span className="text-xs sm:text-sm font-semibold text-muted-foreground border-l border-border pl-2">
                    Deep Valves & Engineering Pvt. Ltd.
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Industrial Valves, Control Panels & Engineering Solutions
                </p>
                <p className="text-[11px] text-muted-foreground/80">
                  Email: accounts@dvepl.com | Web: www.dvepl.com
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-lg uppercase tracking-wider mb-1 border border-primary/20">
                  Delivery Note
                </span>
                <p className="text-sm font-mono font-bold text-primary">
                  {data.orderCode}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                  Date: {data.customerDetails.dateOfOrder || new Date().toISOString().split("T")[0]}
                </p>
              </div>
            </div>

            {/* Order & Customer Metadata Grid */}
            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-xl border border-border mb-6 text-xs">
              <div>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Customer / Consignee Details
                </h4>
                <p className="font-bold text-sm text-foreground">
                  {data.customerDetails.companyName || "gk enterprises"}
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong className="text-foreground">Contact:</strong> {data.customerDetails.contactPerson || "—"}
                </p>
                <p className="text-muted-foreground">
                  <strong className="text-foreground">GST No:</strong> {data.customerDetails.gstNumber || "—"}
                </p>
                <p className="text-muted-foreground mt-1">
                  <strong className="text-foreground">Address:</strong> {data.customerDetails.billingAddress || "—"}
                </p>
              </div>

              <div>
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Order & Project References
                </h4>
                <div className="space-y-1 text-muted-foreground">
                  <div className="flex justify-between border-b border-border/60 pb-1">
                    <span>DVEPL Ref Code:</span>
                    <span className="font-mono font-bold text-foreground">{data.customerDetails.dveplRefCode || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1">
                    <span>Project Ref:</span>
                    <span className="font-mono font-bold text-foreground">{data.customerDetails.projectRef || "—"}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1">
                    <span>Date of Commitment:</span>
                    <span className="font-medium text-foreground">{data.customerDetails.dateOfCommitment || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                Details As per Project
              </h4>
              <table className="w-full text-left text-xs border border-border rounded-xl overflow-hidden">
                <thead className="bg-muted/40 text-muted-foreground font-bold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center border-r border-border">#</th>
                    <th className="py-2.5 px-4 border-r border-border">Panel Name / Description</th>
                    <th className="py-2.5 px-3 w-20 text-center border-r border-border">Qty</th>
                    <th className="py-2.5 px-3 w-28 text-right border-r border-border">Price (₹)</th>
                    <th className="py-2.5 px-4 w-32 text-right">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-muted-foreground">
                        No items added
                      </td>
                    </tr>
                  ) : (
                    data.items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-muted/20">
                        <td className="py-2.5 px-3 text-center border-r border-border text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4 border-r border-border font-medium text-foreground">
                          {item.panelName || "S.No or Name of Panel"}
                        </td>
                        <td className="py-2.5 px-3 text-center border-r border-border">
                          {item.qty}
                        </td>
                        <td className="py-2.5 px-3 text-right border-r border-border font-mono">
                          {Number(item.price).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-foreground">
                          {Number(item.total).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Calculations and Notes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start mb-8">
              {/* Notes */}
              <div className="border border-border rounded-xl p-3 text-xs bg-muted/20">
                <h5 className="font-bold text-foreground mb-1">
                  Special Notes / Instructions:
                </h5>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {data.specialNote || "No special instructions recorded for this order."}
                </p>
                {data.customerDetails.specialNotes && data.customerDetails.specialNotes !== "—" && (
                  <p className="text-muted-foreground mt-2 text-[11px] border-t border-border pt-1.5">
                    <strong className="text-foreground">Customer Master Note:</strong> {data.customerDetails.specialNotes}
                  </p>
                )}
              </div>

              {/* Totals Box */}
              <div className="border border-border rounded-xl overflow-hidden text-xs">
                <div className="flex justify-between py-2 px-3 border-b border-border bg-muted/20">
                  <span className="text-muted-foreground">Value (Subtotal):</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{calculatedValues.subtotal.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 border-b border-border">
                  <span className="text-muted-foreground">Tax ({data.taxPercent}%):</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{calculatedValues.taxAmount.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-2 px-3 border-b border-border bg-muted/20">
                  <span className="text-muted-foreground">Less Advance:</span>
                  <span className="font-mono font-bold text-foreground">
                    - ₹{Number(data.lessAdvance || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between py-2.5 px-3 bg-primary/10 text-primary font-extrabold text-sm">
                  <span>Total Amount:</span>
                  <span className="font-mono">
                    ₹{calculatedValues.totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t border-border text-xs">
              <div className="text-center pt-8 border-t border-dashed border-border">
                <p className="font-bold text-foreground">Receiver's Signature & Stamp</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Date & Time</p>
              </div>
              <div className="text-center pt-8 border-t border-dashed border-border">
                <p className="font-bold text-foreground">For D.V & Engineering Pvt. Ltd.</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Authorized Signatory</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/40 shrink-0">
          <p className="text-xs text-muted-foreground">
            Click "Print Note" or press Ctrl+P to print or save as PDF
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs rounded-xl"
          >
            Close Preview
          </Button>
        </div>
      </div>
    </div>
  );
};
