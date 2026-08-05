import React, { useEffect, useMemo, useRef, useState } from "react";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Search,
  RefreshCw,
  PackageCheck,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  FileSpreadsheet,
  Printer,
  Upload,
  FileUp,
  AlertCircle,
  CheckCircle,
  Send,
  MessageCircle,
  Mail,
  GripVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

import { apiClient } from "@/services/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Endpoints
// ---------------------------------------------------------------------------
const VENDOR_TRACKING_LIST_ENDPOINT = "/inventory/vendor-tracking";
const RECEIVE_ENDPOINT = "/inventory-tracking/receive";

interface TrackingRow {
  poItemId: string;
  poId: string;
  poNo: string;
  purchaseOrderItemId?: string;
  materialId?: string;
  unitPrice?: number;
  vendor?: { id?: string; name: string; phone?: string; email?: string };
  material?: { id?: string; name: string; code?: string };
  orderedQty: number;
  receivedQty: number;
  pendingQty: number;
  status: string;
  inventoryId?: string; // needed for receive payload
}

interface ImportPreviewItem {
  row: TrackingRow;
  excelReceived: number;
  remarks: string;
  error?: string;
}

const errMsg = (err: any, fallback: string) =>
  err?.response?.data?.message ?? err?.message ?? fallback;

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

const fmtNum = (n: number) => n.toLocaleString("en-IN");

const statusMeta = (status: string) => {
  const map: Record<string, { cls: string; label: string }> = {
    PENDING: {
      cls: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      label: "Pending",
    },
    PARTIAL: {
      cls: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      label: "Partial",
    },
    COMPLETED: {
      cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
      label: "Completed",
    },
  };
  return map[status] || map.PENDING;
};

function SortableHeaderCell({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  return (
    <th
      ref={setNodeRef}
      style={style}
      className={className}
    >
      <div className="flex items-center gap-1.5">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className="select-none">{children}</span>
      </div>
    </th>
  );
}

const defaultColumns = [
  { id: "poNo", label: "PO No", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black" },
  { id: "vendor", label: "Vendor", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black" },
  { id: "material", label: "Material", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black" },
  { id: "ordered", label: "Ordered", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right print:text-black" },
  { id: "received", label: "Received", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right print:text-black" },
  { id: "pending", label: "Pending", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right print:text-black" },
  { id: "status", label: "Status", className: "p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground print:text-black" },
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export default function VendorTracking() {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );
  const [orderedColumns, setOrderedColumns] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendor-tracking-table-column-order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 7) return parsed;
      } catch (e) {}
    }
    return ["poNo", "vendor", "material", "ordered", "received", "pending", "status"];
  });

  const handleColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedColumns.indexOf(String(active.id));
      const newIndex = orderedColumns.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedColumns, oldIndex, newIndex);
        setOrderedColumns(newOrder);
        localStorage.setItem("vendor-tracking-table-column-order", JSON.stringify(newOrder));
      }
    }
  };

  const [data, setData] = useState<TrackingRow[]>([]);
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  /* Receive modal state */
  const [receiveModalRow, setReceiveModalRow] = useState<TrackingRow | null>(
    null,
  );
  const [receiveQty, setReceiveQty] = useState("");
  const [receiveRemarks, setReceiveRemarks] = useState("");
  const [receiveSubmitting, setReceiveSubmitting] = useState(false);

  /* Import / Bulk update state */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportPreviewItem[]>([]);
  const [importSubmitting, setImportSubmitting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });

  /* Follow-up modal state */
  const [followUpVendorId, setFollowUpVendorId] = useState<string | null>(
    null,
  );
  const [followUpChannel, setFollowUpChannel] = useState<
    "whatsapp" | "email"
  >("whatsapp");
  const [followUpPhone, setFollowUpPhone] = useState("");
  const [followUpEmail, setFollowUpEmail] = useState("");
  const [followUpMessage, setFollowUpMessage] = useState("");
  const [followUpSending, setFollowUpSending] = useState(false);
  const [followUpMode, setFollowUpMode] = useState<"SINGLE" | "ALL">("ALL");
  const [selectedPurchaseOrder, setSelectedPurchaseOrder] = useState("");

  const tableRef = useRef<HTMLTableElement>(null);

  /* -------------------------- Fetch ------------------------------- */

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(VENDOR_TRACKING_LIST_ENDPOINT);
      const raw = res.data?.data ?? res.data ?? [];
      setData(Array.isArray(raw) ? raw : []);
    } catch (err: any) {
      console.error(err);
      toast.error(errMsg(err, "Failed to load vendor tracking data"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, []);

  /* -------------------------- Derived ----------------------------- */

  const vendorOptions = useMemo(() => {
    const map = new Map<string, string>();
    data.forEach((item) => {
      if (item.vendor?.id && item.vendor?.name) {
        map.set(item.vendor.id, item.vendor.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [data]);

  const kpis = useMemo(() => {
    const totalPOs = new Set(data.map((d) => d.poId)).size;
    const pending = data.filter((d) => d.status === "PENDING").length;
    const partial = data.filter((d) => d.status === "PARTIAL").length;
    const completed = data.filter((d) => d.status === "COMPLETED").length;
    const totalPendingQty = data.reduce((sum, d) => sum + d.pendingQty, 0);
    return { totalPOs, pending, partial, completed, totalPendingQty };
  }, [data]);

  const filteredData = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((item) => {
      if (vendorFilter && item.vendor?.id !== vendorFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (q) {
        const value = `${item.vendor?.name ?? ""} ${item.material?.name ?? ""} ${
          item.material?.code ?? ""
        } ${item.poNo ?? ""}`.toLowerCase();
        if (!value.includes(q)) return false;
      }
      return true;
    });
  }, [data, search, vendorFilter, statusFilter]);

  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, row) => ({
        ordered: acc.ordered + row.orderedQty,
        received: acc.received + row.receivedQty,
        pending: acc.pending + row.pendingQty,
      }),
      { ordered: 0, received: 0, pending: 0 },
    );
  }, [filteredData]);

  // Vendor-wise pending summary — powers the "Follow Up" list and message body
  const vendorPendingSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        vendorId: string;
        vendorName: string;
        phone?: string;
        email?: string;
        items: TrackingRow[];
        totalPendingQty: number;
      }
    >();

    data.forEach((row) => {
      if (row.pendingQty <= 0 || !row.vendor?.id) return;
      const key = row.vendor.id;
      if (!map.has(key)) {
        map.set(key, {
          vendorId: row.vendor.id,
          vendorName: row.vendor.name,
          phone: row.vendor.phone,
          email: row.vendor.email,
          items: [],
          totalPendingQty: 0,
        });
      }
      const entry = map.get(key)!;
      entry.items.push(row);
      entry.totalPendingQty += row.pendingQty;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalPendingQty - a.totalPendingQty,
    );
  }, [data]);

  /* -------------------------- Actions ----------------------------- */

  const openReceiveModal = (row: TrackingRow) => {
    setReceiveModalRow(row);
    setReceiveQty("");
    setReceiveRemarks("");
  };

  const handleSubmitReceive = async () => {
    if (!receiveModalRow) return;
    const qty = parseFloat(receiveQty);
    if (isNaN(qty) || qty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    if (qty > receiveModalRow.pendingQty) {
      toast.error(
        `Cannot receive more than pending qty (${receiveModalRow.pendingQty})`,
      );
      return;
    }
    if (!receiveModalRow.purchaseOrderItemId || !receiveModalRow.inventoryId) {
      toast.error(
        "Missing PO item / inventory reference on this row — cannot receive stock.",
      );
      return;
    }

    setReceiveSubmitting(true);
    try {
      await apiClient.post(RECEIVE_ENDPOINT, {
        purchaseOrderItemId: receiveModalRow.purchaseOrderItemId,
        inventoryId: receiveModalRow.inventoryId,
        receivedQty: qty,
        remarks: receiveRemarks || undefined,
      });
      toast.success("Stock received successfully");
      setReceiveModalRow(null);
      await fetchTracking();
    } catch (err: any) {
      toast.error(errMsg(err, "Failed to record received stock"));
    } finally {
      setReceiveSubmitting(false);
    }
  };

  /* -------------------------- Follow Up ---------------------------- */

  const generateFollowUpMessage = (
    summary: (typeof vendorPendingSummary)[number],
    mode: "SINGLE" | "ALL",
    selectedPO: string,
  ) => {
    if (mode === "SINGLE" && selectedPO) {
      const items = summary.items.filter((i) => i.poNo === selectedPO);
      if (items.length === 0) return "";
      const totalPending = items.reduce((sum, i) => sum + i.pendingQty, 0);
      const lines = [
        `Dear ${summary.vendorName},`,
        "",
        `This is a follow-up regarding the pending delivery against Purchase Order ${selectedPO}:`,
        "",
        ...items.map(
          (item) =>
            `${item.material?.name ?? "Item"} (Code: ${item.material?.code ?? "—"}): Ordered ${item.orderedQty}, Received ${item.receivedQty}, Pending ${item.pendingQty}`,
        ),
        "",
        `Total Pending Quantity: ${totalPending}`,
        "",
        "Kindly confirm the expected dispatch/delivery date at the earliest.",
        "",
        "Regards,",
        "DVEPL Procurement Team",
      ];
      return lines.join("\n");
    }

    const lines = [
      `Dear ${summary.vendorName},`,
      "",
      "This is a follow-up regarding pending deliveries against the following purchase order(s):",
      "",
      ...summary.items.map(
        (item) =>
          `• PO ${item.poNo} — ${item.material?.name ?? "Item"}: Ordered ${item.orderedQty}, Received ${item.receivedQty}, Pending ${item.pendingQty}`,
      ),
      "",
      `Total Pending Quantity: ${summary.totalPendingQty}`,
      "",
      "Kindly confirm the expected dispatch/delivery date at the earliest.",
      "",
      "Regards,",
      "DVEPL Procurement Team",
    ];
    return lines.join("\n");
  };

  const refreshFollowUpMessage = (
    mode: "SINGLE" | "ALL",
    selectedPO: string,
  ) => {
    if (!activeFollowUpSummary) return;
    setFollowUpMessage(
      generateFollowUpMessage(activeFollowUpSummary, mode, selectedPO),
    );
  };

  const openFollowUpModal = (
    summary: (typeof vendorPendingSummary)[number],
    initialPoNo?: string
  ) => {
    setFollowUpVendorId(summary.vendorId);
    setFollowUpChannel(summary.phone ? "whatsapp" : "email");
    setFollowUpPhone(summary.phone || "");
    setFollowUpEmail(summary.email || "");
    if (initialPoNo) {
      setFollowUpMode("SINGLE");
      setSelectedPurchaseOrder(initialPoNo);
      setFollowUpMessage(generateFollowUpMessage(summary, "SINGLE", initialPoNo));
    } else {
      setFollowUpMode("ALL");
      setSelectedPurchaseOrder("");
      setFollowUpMessage(generateFollowUpMessage(summary, "ALL", ""));
    }
  };

  const closeFollowUpModal = () => {
    setFollowUpVendorId(null);
    setFollowUpMessage("");
    setSelectedPurchaseOrder("");
  };

  const activeFollowUpSummary = useMemo(
    () => vendorPendingSummary.find((v) => v.vendorId === followUpVendorId) || null,
    [vendorPendingSummary, followUpVendorId],
  );

  // Distinct purchase orders for the selected vendor (for SINGLE mode)
  const purchaseOrderOptions = useMemo(() => {
    if (!activeFollowUpSummary) return [];
    const set = new Set<string>();
    activeFollowUpSummary.items.forEach((i) => set.add(i.poNo));
    return Array.from(set);
  }, [activeFollowUpSummary]);

  const handleChangeMode = (mode: "SINGLE" | "ALL") => {
    setFollowUpMode(mode);
    if (mode === "ALL") {
      setSelectedPurchaseOrder("");
      refreshFollowUpMessage("ALL", "");
    } else {
      refreshFollowUpMessage("SINGLE", selectedPurchaseOrder);
    }
  };

  const handleSelectPurchaseOrder = (poNo: string) => {
    setSelectedPurchaseOrder(poNo);
    refreshFollowUpMessage("SINGLE", poNo);
  };

  const handleSendFollowUp = async () => {
    if (!activeFollowUpSummary) return;

    if (followUpChannel === "whatsapp") {
      if (!followUpPhone.trim()) {
        toast.error("Enter a WhatsApp number to send the follow-up");
        return;
      }
      const cleanPhone = followUpPhone.replace(/[^\d]/g, "");
      window.open(
        `https://wa.me/${cleanPhone}?text=${encodeURIComponent(followUpMessage)}`,
        "_blank",
      );
      toast.success("WhatsApp opened with follow-up message");
    } else {
      if (!activeFollowUpSummary.email) {
        toast.error("Add an email address to this vendor before sending the follow-up");
        return;
      }
      const subject = `Follow-up: Pending Deliveries — ${activeFollowUpSummary.vendorName}`;
      setFollowUpSending(true);
      try {
        const response = await apiClient.post(
          "/settings/send-vendor-follow-up-email",
          {
            vendorId: activeFollowUpSummary.vendorId,
            subject,
            text: followUpMessage,
          },
        );
        toast.success(
          response.data?.message || "Vendor follow-up email sent successfully",
        );
      } catch (err: any) {
        toast.error(errMsg(err, "Failed to send vendor follow-up email"));
        return;
      } finally {
        setFollowUpSending(false);
      }
    }

    closeFollowUpModal();
  };

  /* -------------------------- Export ------------------------------ */

  const exportToExcel = (mode: "full" | "template" = "full") => {
    const source = mode === "full" ? filteredData : data;
    if (source.length === 0) {
      toast.error("No data to export");
      return;
    }

    const rows = source.map((item) => ({
      "PO No": item.poNo,
      Vendor: item.vendor?.name ?? "—",
      "Material Name": item.material?.name ?? "—",
      "Material Code": item.material?.code ?? "—",
      Ordered: item.orderedQty,
      Received: item.receivedQty,
      Pending: item.pendingQty,
      Status: item.status,
      "Unit Price": item.unitPrice ?? "—",
      "PO Item ID": item.poItemId,
      "Inventory ID": item.inventoryId ?? "",
    }));

    if (mode === "full") {
      rows.push({
        "PO No": "",
        Vendor: "",
        "Material Name": "",
        "Material Code": "TOTAL",
        Ordered: totals.ordered,
        Received: totals.received,
        Pending: totals.pending,
        Status: "",
        "Unit Price": "",
        "PO Item ID": "",
        "Inventory ID": "",
      });
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendor Tracking");

    const colWidths = [
      { wch: 14 },
      { wch: 22 },
      { wch: 24 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
    ];
    ws["!cols"] = colWidths;

    const dateStr = new Date().toISOString().split("T")[0];
    const suffix = mode === "template" ? "Template" : dateStr;
    XLSX.writeFile(wb, `Vendor_Tracking_${suffix}.xlsx`);
    toast.success(
      mode === "template" ? "Template downloaded" : "Excel downloaded successfully",
    );
  };

  /* -------------------------- Import ------------------------------ */

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(ws) as Record<string, any>[];

      if (!parsed.length) {
        toast.error("Excel file is empty");
        return;
      }

      const preview: ImportPreviewItem[] = [];
      const seen = new Set<string>();

      for (const excelRow of parsed) {
        const poNo = String(excelRow["PO No"] ?? "").trim();
        if (!poNo) continue;

        let matched: TrackingRow | undefined;
        const poItemId = String(excelRow["PO Item ID"] ?? "").trim();
        if (poItemId) {
          matched = data.find((d) => d.poItemId === poItemId);
        }
        if (!matched) {
          const matCode = String(excelRow["Material Code"] ?? "").trim();
          matched = data.find(
            (d) => d.poNo === poNo && d.material?.code === matCode,
          );
        }

        if (!matched) {
          preview.push({
            row: {
              poItemId: "",
              poId: "",
              poNo,
              orderedQty: 0,
              receivedQty: 0,
              pendingQty: 0,
              status: "PENDING",
              material: {
                name: String(excelRow["Material Name"] ?? "—"),
                code: String(excelRow["Material Code"] ?? ""),
              },
              vendor: { name: String(excelRow["Vendor"] ?? "—") },
            },
            excelReceived: 0,
            remarks: "",
            error: "No matching record found in system",
          });
          continue;
        }

        const key = matched.poItemId;
        if (seen.has(key)) continue;
        seen.add(key);

        const rawReceived = excelRow["Received"];
        const excelReceived =
          typeof rawReceived === "number"
            ? rawReceived
            : parseFloat(String(rawReceived ?? "").replace(/,/g, ""));

        if (isNaN(excelReceived)) {
          preview.push({
            row: matched,
            excelReceived: matched.receivedQty,
            remarks: "",
            error: `Invalid received quantity: "${rawReceived}"`,
          });
          continue;
        }

        if (excelReceived < matched.receivedQty) {
          preview.push({
            row: matched,
            excelReceived,
            remarks: "",
            error: `Cannot reduce received qty (current: ${matched.receivedQty})`,
          });
          continue;
        }

        if (excelReceived > matched.orderedQty) {
          preview.push({
            row: matched,
            excelReceived,
            remarks: "",
            error: `Exceeds ordered qty (${matched.orderedQty})`,
          });
          continue;
        }

        const delta = excelReceived - matched.receivedQty;
        if (delta > matched.pendingQty) {
          preview.push({
            row: matched,
            excelReceived,
            remarks: "",
            error: `Exceeds pending qty by ${fmtNum(delta - matched.pendingQty)}`,
          });
          continue;
        }

        preview.push({
          row: matched,
          excelReceived,
          remarks: String(excelRow["Remarks"] ?? ""),
        });
      }

      setImportRows(preview);
      setImportModalOpen(true);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to parse Excel file");
    }
  };

  const validImports = importRows.filter((i) => !i.error);
  const invalidImports = importRows.filter((i) => i.error);

  const updateImportReceived = (poItemId: string, val: string) => {
    const num = parseFloat(val);
    setImportRows((prev) =>
      prev.map((item) => {
        if (item.row.poItemId !== poItemId) return item;
        if (isNaN(num)) {
          return { ...item, excelReceived: num, error: "Invalid number" };
        }
        if (num < item.row.receivedQty) {
          return {
            ...item,
            excelReceived: num,
            error: `Cannot reduce received qty (current: ${item.row.receivedQty})`,
          };
        }
        if (num > item.row.orderedQty) {
          return {
            ...item,
            excelReceived: num,
            error: `Exceeds ordered qty (${item.row.orderedQty})`,
          };
        }
        const delta = num - item.row.receivedQty;
        if (delta > item.row.pendingQty) {
          return {
            ...item,
            excelReceived: num,
            error: `Exceeds pending qty by ${fmtNum(delta - item.row.pendingQty)}`,
          };
        }
        return { ...item, excelReceived: num, error: undefined, remarks: item.remarks };
      }),
    );
  };

  const updateImportRemarks = (poItemId: string, remarks: string) => {
    setImportRows((prev) =>
      prev.map((item) =>
        item.row.poItemId === poItemId ? { ...item, remarks } : item,
      ),
    );
  };

  const removeImportRow = (poItemId: string) => {
    setImportRows((prev) => prev.filter((i) => i.row.poItemId !== poItemId));
  };

  const submitBulkImport = async () => {
    const toProcess = validImports.filter(
      (i) => i.excelReceived !== i.row.receivedQty,
    );
    if (!toProcess.length) {
      toast.error("No changes to apply");
      return;
    }

    setImportSubmitting(true);
    setImportProgress({ done: 0, total: toProcess.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < toProcess.length; i++) {
      const item = toProcess[i];
      const delta = item.excelReceived - item.row.receivedQty;
      if (delta <= 0) continue;

      try {
        if (!item.row.purchaseOrderItemId || !item.row.inventoryId) {
          throw new Error("Missing PO item / inventory reference");
        }
        await apiClient.post(RECEIVE_ENDPOINT, {
          purchaseOrderItemId: item.row.purchaseOrderItemId,
          inventoryId: item.row.inventoryId,
          receivedQty: delta,
          remarks:
            item.remarks ||
            `Bulk update via Excel: ${item.row.receivedQty} → ${item.excelReceived}`,
        });
        successCount++;
      } catch (err: any) {
        console.error(err);
        failCount++;
        toast.error(
          `Failed for ${item.row.poNo} / ${item.row.material?.name}: ${errMsg(err, "Unknown error")}`,
        );
      } finally {
        setImportProgress({ done: i + 1, total: toProcess.length });
      }
    }

    setImportSubmitting(false);
    setImportModalOpen(false);
    setImportRows([]);

    if (successCount > 0) {
      toast.success(`${successCount} row(s) updated successfully`);
      await fetchTracking();
    }
    if (failCount > 0) {
      toast.error(`${failCount} row(s) failed to update`);
    }
  };

  /* -------------------------- Print / Clear ----------------------- */

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setSearch("");
    setVendorFilter("");
    setStatusFilter("");
  };

  /* -------------------------- Render ------------------------------ */

  return (
    <div className="space-y-6 print:space-y-2">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Truck className="size-5 text-primary" />
            Vendor Order Tracking
            {loading && (
              <RefreshCw className="size-4 animate-spin text-muted-foreground" />
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track ordered, received and pending quantities across all purchase
            orders.
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="gap-2"
          >
            <Printer className="size-4" />
            Print
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToExcel("full")}
            className="gap-2"
          >
            <FileSpreadsheet className="size-4" />
            Export Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            className="gap-2"
          >
            <Upload className="size-4" />
            Import Excel
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTracking}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print:hidden">
        {[
          {
            label: "Total Purchase Orders",
            value: kpis.totalPOs,
            color: "text-foreground",
            icon: Truck,
          },
          {
            label: "Pending Items",
            value: kpis.pending,
            color: "text-blue-600",
            bg: "bg-blue-500/5 border-blue-500/20",
            icon: Clock,
          },
          {
            label: "Partially Received",
            value: kpis.partial,
            color: "text-amber-600",
            bg: "bg-amber-500/5 border-amber-500/20",
            icon: AlertTriangle,
          },
          {
            label: "Completed",
            value: kpis.completed,
            color: "text-emerald-600",
            bg: "bg-emerald-500/5 border-emerald-500/20",
            icon: CheckCircle2,
          },
          {
            label: "Total Pending Qty",
            value: fmtNum(kpis.totalPendingQty),
            color: "text-rose-600",
            icon: PackageCheck,
          },
        ].map((card, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-xl border bg-card shadow-sm flex flex-col justify-between min-h-[96px] ${card.bg || ""}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">
                {card.label}
              </span>
              <card.icon className={`size-3.5 ${card.color}`} />
            </div>
            <span
              className={`text-2xl font-bold tracking-tight mt-2 ${card.color}`}
            >
              {card.value}
            </span>
          </div>
        ))}
      </div>

      {/* Vendor Follow-Up Panel */}
      {vendorPendingSummary.length > 0 && (
        <div className="bg-card rounded-xl border shadow-sm p-4 print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Send className="size-4 text-primary" />
              Vendors with Pending Deliveries
            </h3>
            <span className="text-xs text-muted-foreground">
              {vendorPendingSummary.length} vendor(s)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {vendorPendingSummary.map((summary) => (
              <div
                key={summary.vendorId}
                className="p-3 border rounded-lg flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-sm text-foreground truncate">
                    {summary.vendorName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {summary.items.length} item(s) · Pending{" "}
                    <strong className="text-amber-600">
                      {fmtNum(summary.totalPendingQty)}
                    </strong>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0"
                  onClick={() => openFollowUpModal(summary)}
                >
                  <Send className="size-3.5" />
                  Follow Up
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center justify-between bg-card p-4 rounded-xl border print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center flex-1 max-w-4xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search PO no, vendor, material..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={vendorFilter}
            onValueChange={(val: string | null) => setVendorFilter(val || "")}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent>
              {vendorOptions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(val: string | null) => setStatusFilter(val || "")}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(search || vendorFilter || statusFilter) && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={clearFilters}
          >
            <X className="size-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border shadow-sm overflow-x-auto print:shadow-none print:border-0">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleColumnDragEnd}
        >
          <SortableContext
            items={orderedColumns}
            strategy={horizontalListSortingStrategy}
          >
            <table
              ref={tableRef}
              className="w-full text-left border-collapse print:text-sm"
            >
              <thead className="print:table-header-group">
                <tr className="border-b bg-muted/40 print:bg-gray-100">
                  {orderedColumns.map((colId) => {
                    const col = defaultColumns.find((c) => c.id === colId);
                    if (!col) return null;
                    return (
                      <SortableHeaderCell key={col.id} id={col.id} className={col.className}>
                        {col.label}
                      </SortableHeaderCell>
                    );
                  })}
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right print:text-black print:hidden">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading && data.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-xs font-semibold text-muted-foreground"
                    >
                      Loading tracking data…
                    </td>
                  </tr>
                )}

                {!loading && filteredData.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-xs font-semibold text-muted-foreground"
                    >
                      No vendor tracking records found.
                    </td>
                  </tr>
                )}

                {filteredData.map((item, idx) => {
                  const s = statusMeta(item.status);
                  return (
                    <tr
                      key={item.poItemId}
                      className={`hover:bg-muted/10 ${idx % 2 === 0 ? "bg-white" : "bg-muted/20"} print:bg-white`}
                    >
                      {orderedColumns.map((colId) => {
                        if (colId === "poNo") {
                          return (
                            <td key={colId} className="p-4 font-semibold text-foreground">
                              {item.poNo}
                            </td>
                          );
                        }
                        if (colId === "vendor") {
                          return (
                            <td key={colId} className="p-4 text-sm text-muted-foreground">
                              {item.vendor?.name || "—"}
                            </td>
                          );
                        }
                        if (colId === "material") {
                          return (
                            <td key={colId} className="p-4 text-sm">
                              <div className="font-medium text-foreground">
                                {item.material?.name || "—"}
                              </div>
                              {item.material?.code && (
                                <div className="text-[10px] text-muted-foreground font-mono">
                                  {item.material.code}
                                </div>
                              )}
                            </td>
                          );
                        }
                        if (colId === "ordered") {
                          return (
                            <td key={colId} className="p-4 text-right font-semibold">
                              {fmtNum(item.orderedQty)}
                            </td>
                          );
                        }
                        if (colId === "received") {
                          return (
                            <td key={colId} className="p-4 text-right text-muted-foreground">
                              {fmtNum(item.receivedQty)}
                            </td>
                          );
                        }
                        if (colId === "pending") {
                          return (
                            <td
                              key={colId}
                              className={`p-4 text-right font-bold ${
                                item.pendingQty > 0 ? "text-amber-600" : "text-emerald-600"
                              }`}
                            >
                              {fmtNum(item.pendingQty)}
                            </td>
                          );
                        }
                        if (colId === "status") {
                          return (
                            <td key={colId} className="p-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${s.cls}`}
                              >
                                {s.label}
                              </span>
                            </td>
                          );
                        }
                        return null;
                      })}
                      <td className="p-4 text-right print:hidden">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={item.pendingQty <= 0}
                            onClick={() => openReceiveModal(item)}
                            className="gap-1.5"
                          >
                            <PackageCheck className="size-3.5" />
                            Receive
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={item.pendingQty <= 0}
                            onClick={() => {
                              const vendorId = item.vendor?.id;
                              if (!vendorId) {
                                toast.error("This row does not have a valid vendor ID");
                                return;
                              }
                              const summary = vendorPendingSummary.find((v) => v.vendorId === vendorId) || {
                                vendorId: vendorId,
                                vendorName: item.vendor?.name || "",
                                phone: item.vendor?.phone,
                                email: item.vendor?.email,
                                items: [item],
                                totalPendingQty: item.pendingQty,
                              };
                              openFollowUpModal(summary, item.poNo);
                            }}
                            className="gap-1.5"
                          >
                            <Send className="size-3.5" />
                            Follow Up
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                {filteredData.length > 0 && (
                  <tr className="border-t-2 border-border bg-muted/30 font-bold print:bg-gray-100">
                    {orderedColumns.map((colId, cIdx) => {
                      if (colId === "ordered") {
                        return (
                          <td key={colId} className="p-4 text-right">
                            {fmtNum(totals.ordered)}
                          </td>
                        );
                      }
                      if (colId === "received") {
                        return (
                          <td key={colId} className="p-4 text-right">
                            {fmtNum(totals.received)}
                          </td>
                        );
                      }
                      if (colId === "pending") {
                        return (
                          <td
                            key={colId}
                            className={`p-4 text-right ${
                              totals.pending > 0 ? "text-amber-600" : "text-emerald-600"
                            }`}
                          >
                            {fmtNum(totals.pending)}
                          </td>
                        );
                      }
                      if (cIdx === 0) {
                        return (
                          <td key={colId} className="p-4">
                            TOTAL ({filteredData.length} rows)
                          </td>
                        );
                      }
                      return <td key={colId} className="p-4"></td>;
                    })}
                    <td className="p-4 print:hidden"></td>
                  </tr>
                )}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block text-xs text-gray-500 mt-4">
        Generated on {new Date().toLocaleString()}
      </div>

      {/* Receive Modal */}
      {receiveModalRow && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border rounded-xl shadow-2xl max-w-sm w-full flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent">
              <h2 className="text-lg font-bold tracking-tight">
                Receive Stock — {receiveModalRow.poNo}
              </h2>
              <button
                type="button"
                onClick={() => setReceiveModalRow(null)}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-muted/40 border rounded-lg text-xs space-y-1">
                <div>
                  Vendor: <strong>{receiveModalRow.vendor?.name}</strong>
                </div>
                <div>
                  Material: <strong>{receiveModalRow.material?.name}</strong>
                </div>
                <div>
                  Ordered: <strong>{receiveModalRow.orderedQty}</strong> ·
                  Received: <strong>{receiveModalRow.receivedQty}</strong> ·
                  Pending:{" "}
                  <strong className="text-amber-600">
                    {receiveModalRow.pendingQty}
                  </strong>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Quantity Received *
                </label>
                <Input
                  type="number"
                  min={0}
                  max={receiveModalRow.pendingQty}
                  step="any"
                  autoFocus
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(e.target.value)}
                  placeholder={`Max ${receiveModalRow.pendingQty}`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Remarks
                </label>
                <Input
                  value={receiveRemarks}
                  onChange={(e) => setReceiveRemarks(e.target.value)}
                  placeholder="Optional note (e.g. batch no., condition)"
                />
              </div>

              {receiveQty && !isNaN(parseFloat(receiveQty)) && (
                <div className="p-3 border rounded-lg bg-primary/5 text-xs">
                  <div className="font-semibold text-foreground">
                    Pending after receipt:{" "}
                    <strong
                      className={
                        receiveModalRow.pendingQty - parseFloat(receiveQty) <= 0
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {Math.max(
                        0,
                        receiveModalRow.pendingQty - parseFloat(receiveQty),
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReceiveModalRow(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReceive}
                disabled={receiveSubmitting}
              >
                {receiveSubmitting ? "Saving..." : "Confirm Receive"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Follow Up Modal */}
      {activeFollowUpSummary && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border rounded-xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent shrink-0">
              <h2 className="text-lg font-bold tracking-tight">
                Follow Up — {activeFollowUpSummary.vendorName}
              </h2>
              <button
                type="button"
                onClick={closeFollowUpModal}
                className="p-1 hover:bg-muted rounded"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex border rounded-lg p-1 bg-muted/20 w-fit">
                <button
                  type="button"
                  onClick={() => setFollowUpChannel("whatsapp")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded ${
                    followUpChannel === "whatsapp"
                      ? "bg-card text-foreground shadow border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setFollowUpChannel("email")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded ${
                    followUpChannel === "email"
                      ? "bg-card text-foreground shadow border border-border/80"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Mail className="size-3.5" /> Email
                </button>
              </div>

              {followUpChannel === "whatsapp" ? (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    WhatsApp Number
                  </label>
                  <Input
                    value={followUpPhone}
                    onChange={(e) => setFollowUpPhone(e.target.value)}
                    placeholder="With country code, e.g. 91XXXXXXXXXX"
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <Input
                    value={followUpEmail || "No email address saved for this vendor"}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Follow Up Type
                </label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="followUpMode"
                      checked={followUpMode === "SINGLE"}
                      onChange={() => handleChangeMode("SINGLE")}
                      className="accent-primary"
                    />
                    Particular Purchase Order
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="followUpMode"
                      checked={followUpMode === "ALL"}
                      onChange={() => handleChangeMode("ALL")}
                      className="accent-primary"
                    />
                    All Pending Purchase Orders
                  </label>
                </div>
              </div>

              {followUpMode === "SINGLE" && (
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Purchase Order
                  </label>
                  <Select
                    value={selectedPurchaseOrder}
                    onValueChange={(val: string | null) =>
                      handleSelectPurchaseOrder(val || "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a purchase order" />
                    </SelectTrigger>
                    <SelectContent>
                      {purchaseOrderOptions.map((poNo) => (
                        <SelectItem key={poNo} value={poNo}>
                          {poNo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Message
                </label>
                <Textarea
                  rows={10}
                  value={followUpMessage}
                  onChange={(e) => setFollowUpMessage(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-6 border-t flex items-center justify-end gap-2 shrink-0">
              <Button variant="outline" onClick={closeFollowUpModal}>
                Cancel
              </Button>
              <Button
                onClick={handleSendFollowUp}
                disabled={followUpSending}
                className="gap-1.5"
              >
                <Send className="size-3.5" />
                {followUpChannel === "whatsapp"
                  ? "Open WhatsApp"
                  : followUpSending
                    ? "Sending..."
                    : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import / Bulk Update Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden">
          <div className="bg-card border rounded-xl shadow-2xl max-w-5xl w-full flex flex-col max-h-[90vh]">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-br from-primary/5 to-transparent shrink-0">
              <div>
                <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
                  <FileUp className="size-5 text-primary" />
                  Review Excel Import
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {validImports.length} valid, {invalidImports.length} invalid ·
                  Edit quantities below before confirming
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportToExcel("template")}
                  className="gap-1.5"
                >
                  <Download className="size-3.5" />
                  Template
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setImportModalOpen(false);
                    setImportRows([]);
                  }}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            <div className="overflow-auto flex-1 p-0">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10">
                  <tr className="border-b">
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      PO No
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Vendor / Material
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Ordered
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Current
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right w-32">
                      Excel Received
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Qty to Add
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">
                      Pending After
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Remarks
                    </th>
                    <th className="p-3 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center w-10">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {importRows.map((item) => {
                    const delta = item.error
                      ? 0
                      : Math.max(0, item.excelReceived - item.row.receivedQty);
                    const pendingAfter = item.error
                      ? item.row.pendingQty
                      : item.row.orderedQty - item.excelReceived;

                    return (
                      <tr
                        key={item.row.poItemId || item.row.poNo}
                        className={item.error ? "bg-red-500/5" : "hover:bg-muted/10"}
                      >
                        <td className="p-3 font-semibold">{item.row.poNo}</td>
                        <td className="p-3">
                          <div className="font-medium">
                            {item.row.material?.name || "—"}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.row.vendor?.name}
                            {item.row.material?.code && ` · ${item.row.material.code}`}
                          </div>
                          {item.error && (
                            <div className="flex items-center gap-1 text-[11px] text-red-600 mt-1 font-medium">
                              <AlertCircle className="size-3" />
                              {item.error}
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {fmtNum(item.row.orderedQty)}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">
                          {fmtNum(item.row.receivedQty)}
                        </td>
                        <td className="p-3 text-right">
                          <Input
                            type="number"
                            min={0}
                            step="any"
                            disabled={!!item.error && !item.row.poItemId}
                            value={
                              isNaN(item.excelReceived)
                                ? ""
                                : String(item.excelReceived)
                            }
                            onChange={(e) =>
                              item.row.poItemId &&
                              updateImportReceived(item.row.poItemId, e.target.value)
                            }
                            className={`w-28 ml-auto text-right h-8 text-sm ${
                              item.error
                                ? "border-red-300 focus-visible:ring-red-300"
                                : delta > 0
                                  ? "border-emerald-300 focus-visible:ring-emerald-300"
                                  : ""
                            }`}
                          />
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {delta > 0 ? (
                            <span className="text-emerald-600">+{fmtNum(delta)}</span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td
                          className={`p-3 text-right font-bold ${
                            pendingAfter > 0 ? "text-amber-600" : "text-emerald-600"
                          }`}
                        >
                          {fmtNum(pendingAfter)}
                        </td>
                        <td className="p-3">
                          <Input
                            value={item.remarks}
                            onChange={(e) =>
                              item.row.poItemId &&
                              updateImportRemarks(item.row.poItemId, e.target.value)
                            }
                            placeholder="Optional"
                            className="h-8 text-sm"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() =>
                              item.row.poItemId && removeImportRow(item.row.poItemId)
                            }
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-600"
                          >
                            <X className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {importRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="p-8 text-center text-sm text-muted-foreground"
                      >
                        No rows parsed from file.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t shrink-0 bg-card">
              {importSubmitting && (
                <div className="mb-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">Updating records…</span>
                    <span className="text-muted-foreground">
                      {importProgress.done} / {importProgress.total}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{
                        width: `${importProgress.total ? (importProgress.done / importProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  {validImports.filter((i) => i.excelReceived !== i.row.receivedQty)
                    .length === 0 ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle className="size-3.5 text-emerald-600" />
                      No changes detected
                    </span>
                  ) : (
                    <span>
                      Will update{" "}
                      <strong>
                        {
                          validImports.filter(
                            (i) => i.excelReceived !== i.row.receivedQty,
                          ).length
                        }
                      </strong>{" "}
                      row(s)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportModalOpen(false);
                      setImportRows([]);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={submitBulkImport}
                    disabled={
                      importSubmitting ||
                      validImports.filter(
                        (i) => i.excelReceived !== i.row.receivedQty,
                      ).length === 0
                    }
                  >
                    {importSubmitting
                      ? "Updating…"
                      : `Update All Valid (${validImports.filter((i) => i.excelReceived !== i.row.receivedQty).length})`}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
