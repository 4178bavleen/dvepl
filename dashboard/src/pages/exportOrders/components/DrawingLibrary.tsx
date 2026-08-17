import {
  FileText,
  ImageIcon,
  ExternalLink,
  Loader2,
  CheckSquare,
  Square,
  Clock,
  PlayCircle,
  CheckCircle2,
  PauseCircle,
  XCircle,
  PenLine,
  LayoutGrid,
  List,
  ChevronDown,
  Mail,
  MessageSquare,
  Send,
  MoreVertical,
  History,
  Eye,
  Upload,
} from "lucide-react";
import { exportOrdersApi } from "@/services/modules";
import toast from "react-hot-toast";
import React, { useState } from "react";
import type { EngineeringDrawing } from "@/types/exportOrders";
import { useSalesOrderAccess } from "@/utils/salesOrderAccess";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DrawingRevisionView {
  id: string;
  revisionNo: number;
  fileUrl: string;
  fileName: string;
  fileSize?: number | null;
  mimeType?: string | null;
  status?: string;
  changes?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: { id: string; name?: string | null };
  approvedBy?: { id: string; name?: string | null } | null;
  rejectedBy?: { id: string; name?: string | null } | null;
}

type RevisionAwareDrawing = EngineeringDrawing & {
  revisions?: DrawingRevisionView[];
  currentRevision?: DrawingRevisionView | null;
};

interface Props {
  drawings: EngineeringDrawing[];
  selectedDrawingIds: string[];
  setSelectedDrawingIds: (ids: string[]) => void;
  onStatusChanged?: () => void;
  canEdit?: boolean;
  orders?: any[];
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL ?? "";

function buildFileUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  try {
    return new URL(rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`, API_BASE_URL).toString();
  } catch {
    return rawUrl;
  }
}

function parseContactDetails(details?: string) {
  if (!details) return { name: "", phone: "", email: "" };
  const parts = details.split("|").map((p) => p.trim());
  if (parts.length >= 3) {
    return { name: parts[0], phone: parts[1], email: parts[2] };
  }
  // Try to find email and phone in any part
  let email = "";
  let phone = "";
  let name = parts[0] || "";
  for (const part of parts) {
    if (part.includes("@")) {
      email = part;
    } else if (/^[+\d\s-]{10,20}$/.test(part)) {
      phone = part;
    }
  }
  return { name, phone, email };
}

const STATUS_CONFIG = {
  DRAFT:       { label: "Draft",      icon: PenLine,      dot: "bg-gray-400",    pill: "bg-gray-50 text-gray-600 border border-gray-200",               row: "" },
  SUBMITTED:   { label: "Submitted",  icon: Send,         dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border border-blue-200",               row: "bg-blue-50/20" },
  APPROVED:    { label: "Approved",   icon: CheckCircle2, dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",     row: "bg-emerald-50/20" },
  PENDING:     { label: "Pending",    icon: Clock,        dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 border border-amber-200",           row: "" },
  IN_PROGRESS: { label: "In Progress", icon: PlayCircle,  dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border border-blue-200",               row: "bg-blue-50/20" },
  COMPLETED:   { label: "Completed",  icon: CheckCircle2, dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border border-emerald-200",     row: "bg-emerald-50/20" },
  ON_HOLD:     { label: "On Hold",    icon: PauseCircle,  dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600 border border-gray-200",             row: "bg-gray-50/40" },
  REJECTED:    { label: "Rejected",   icon: XCircle,      dot: "bg-red-500",     pill: "bg-red-50 text-red-600 border border-red-200",                 row: "bg-red-50/20" },
} as const;

type DrawingStatus = keyof typeof STATUS_CONFIG;

interface WorkflowAction {
  status: DrawingStatus;
  label: string;
  hoverBg: string;
  textColor: string;
  icon?: any;
  requiresReason?: boolean;
}

const WORKFLOW_ACTIONS: Record<string, WorkflowAction[]> = {
  DRAFT: [
    { status: "SUBMITTED", label: "Submit for Review", hoverBg: "hover:bg-blue-50",    textColor: "text-blue-700",    icon: Send },
  ],
  REJECTED: [
    { status: "DRAFT",     label: "Revise (back to Draft)", hoverBg: "hover:bg-gray-50",  textColor: "text-gray-600",   icon: PenLine },
    { status: "SUBMITTED", label: "Resubmit for Review",     hoverBg: "hover:bg-blue-50",  textColor: "text-blue-700",   icon: Send },
  ],
  SUBMITTED: [
    { status: "APPROVED",  label: "Approve",     hoverBg: "hover:bg-emerald-50", textColor: "text-emerald-700", icon: CheckCircle2 },
    { status: "REJECTED",  label: "Reject…",     hoverBg: "hover:bg-red-50",     textColor: "text-red-600",     icon: XCircle, requiresReason: true },
  ],
  APPROVED: [],
};

const LEGACY_ACTIONS: WorkflowAction[] = [
  { status: "SUBMITTED", label: "Submit for Review", hoverBg: "hover:bg-blue-50", textColor: "text-blue-700", icon: Send },
  { status: "APPROVED", label: "Approve", hoverBg: "hover:bg-emerald-50", textColor: "text-emerald-700", icon: CheckCircle2 },
  { status: "PENDING",     label: "Pending",     hoverBg: "hover:bg-amber-50",   textColor: "text-amber-700" },
  { status: "IN_PROGRESS", label: "In Progress", hoverBg: "hover:bg-blue-50",    textColor: "text-blue-700" },
  { status: "COMPLETED",   label: "Completed",   hoverBg: "hover:bg-emerald-50", textColor: "text-emerald-700" },
  { status: "ON_HOLD",     label: "On Hold",     hoverBg: "hover:bg-gray-50",    textColor: "text-gray-600" },
  { status: "REJECTED",    label: "Rejected",    hoverBg: "hover:bg-red-50",     textColor: "text-red-600" },
];

const WORKFLOW_STATUSES = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"];

function getStatusActions(currentStatus: string): WorkflowAction[] {
  if (WORKFLOW_STATUSES.includes(currentStatus)) {
    return WORKFLOW_ACTIONS[currentStatus] ?? [];
  }
  return LEGACY_ACTIONS;
}

const TYPE_LABELS: Record<string, string> = {
  SLD: "SLD", GA_DRAWING: "G.A.", WIRING_DIAGRAM: "Wiring",
  LAYOUT: "Layout", CAD: "CAD", PDF: "PDF",
};

function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as DrawingStatus] ?? STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${cfg.pill}`}>
      <Icon className="w-3 h-3 flex-shrink-0" />
      {cfg.label}
    </span>
  );
}

function DrawingThumbnail({ mimeType, fileName, fileUrl }: { mimeType?: string; fileName?: string; fileUrl: string }) {
  const isImage = IMAGE_TYPES.includes(mimeType ?? "");
  const isPdf = mimeType === "application/pdf" || fileName?.endsWith(".pdf");

  if (isImage && fileUrl) {
    return (
      <img src={fileUrl} alt="" className="w-full h-full object-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
    );
  }
  if (isPdf) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
          <FileText className="w-6 h-6 text-red-500" />
        </div>
        <span className="text-[10px] font-bold tracking-widest text-red-400 uppercase">PDF</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-2 text-muted-foreground/40">
      <ImageIcon className="w-10 h-10" />
    </div>
  );
}

export default function DrawingLibrary({
  drawings,
  selectedDrawingIds,
  setSelectedDrawingIds,
  onStatusChanged,
  canEdit = true,
  orders = [],
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [revisionHistoryDrawing, setRevisionHistoryDrawing] =
    useState<RevisionAwareDrawing | null>(null);

  // Revision upload states
  const [revisionUploadDrawing, setRevisionUploadDrawing] =
    useState<EngineeringDrawing | null>(null);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionChanges, setRevisionChanges] = useState("");
  const [isUploadingRevision, setIsUploadingRevision] = useState(false);

  // Send drawing states
  const [sendModalDrawing, setSendModalDrawing] = useState<EngineeringDrawing | null>(null);
  const [sendMethod, setSendMethod] = useState<"EMAIL" | "WHATSAPP" | "BOTH">("EMAIL");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Reject drawing states
  const [rejectDrawing, setRejectDrawing] = useState<EngineeringDrawing | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const { canWorkOnOrder } = useSalesOrderAccess();

  const getRevisionAwareDrawing = (
    drawing: EngineeringDrawing,
  ): RevisionAwareDrawing => drawing as RevisionAwareDrawing;

  const getCurrentRevision = (drawing: EngineeringDrawing) => {
    const revisionAware = getRevisionAwareDrawing(drawing);
    return (
      revisionAware.currentRevision ??
      revisionAware.revisions?.[0] ??
      null
    );
  };

  const getRevisionFileUrl = (drawing: EngineeringDrawing): string => {
    const revision = getCurrentRevision(drawing);
    return revision?.fileUrl || drawing.fileUrl;
  };

  const handleOpenRevisionModal = (
    e: React.MouseEvent,
    drawing: EngineeringDrawing,
  ) => {
    e.stopPropagation();

    if (drawing.status !== "REJECTED") {
      toast.error("Only rejected drawings can receive a new revision.");
      return;
    }

    if (!canWorkOnOrder(orderForDrawing(drawing))) {
      toast.error(
        "View-only: you can only upload revisions for orders assigned to you.",
      );
      return;
    }

    setOpenActionsMenu(null);
    setRevisionUploadDrawing(drawing);
    setRevisionFile(null);
    setRevisionChanges("");
  };

  const handleRevisionSubmit = async () => {
    if (!revisionUploadDrawing || !revisionFile) {
      toast.error("Please select the revised drawing file.");
      return;
    }

    if (!canWorkOnOrder(orderForDrawing(revisionUploadDrawing))) {
      toast.error(
        "View-only: you can only upload revisions for orders assigned to you.",
      );
      return;
    }

    setIsUploadingRevision(true);

    try {
      const uploadRes = await exportOrdersApi.uploadDrawingFile(revisionFile);
      const fileUrl = uploadRes.data.fileUrl;

      if (!fileUrl) {
        throw new Error("Upload did not return a file URL.");
      }

      const result = await exportOrdersApi.createDrawingRevision({
        drawingId: revisionUploadDrawing.id,
        fileUrl,
        fileName: revisionFile.name,
        fileSize: revisionFile.size,
        mimeType: revisionFile.type || null,
        changes: revisionChanges.trim() || null,
      });

      const revisionNo =
        result?.data?.revisionNo ??
        result?.data?.currentRevision?.revisionNo;

      toast.success(
        revisionNo !== undefined
          ? `Revision R${revisionNo} uploaded successfully.`
          : "Drawing revision uploaded successfully.",
      );

      setRevisionUploadDrawing(null);
      setRevisionFile(null);
      setRevisionChanges("");
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
          err?.message ??
          "Failed to upload drawing revision.",
      );
    } finally {
      setIsUploadingRevision(false);
    }
  };

  const orderForDrawing = (drawing: EngineeringDrawing) => {
    const salesOrderId = drawing.project?.salesOrderId;
    return salesOrderId ? orders.find((o: any) => o.id === salesOrderId) : undefined;
  };

  const toggle = (id: string) =>
    setSelectedDrawingIds(
      selectedDrawingIds.includes(id)
        ? selectedDrawingIds.filter((x) => x !== id)
        : [...selectedDrawingIds, id]
    );

  const toggleAll = () => {
    if (selectedDrawingIds.length === drawings.length) setSelectedDrawingIds([]);
    else setSelectedDrawingIds(drawings.map((d) => d.id));
  };

  const openFile = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    setOpenActionsMenu(null);
    const fileUrl = buildFileUrl(url);
    if (!fileUrl) {
      toast.error("This drawing does not have an attached file.");
      return;
    }
    window.open(fileUrl, "_blank", "noopener,noreferrer");
  };

  const changeStatus = async (e: React.MouseEvent, drawing: EngineeringDrawing, newStatus: string, rejectionReasonArg?: string) => {
    e.stopPropagation();
    if (!canWorkOnOrder(orderForDrawing(drawing))) {
      toast.error("View-only: you cannot change the status of this drawing.");
      return;
    }
    setOpenDropdown(null);
    setUpdatingId(drawing.id);
    try {
      await exportOrdersApi.updateDrawingStatus(drawing.id, newStatus, rejectionReasonArg);
      toast.success(`Marked as ${STATUS_CONFIG[newStatus as DrawingStatus]?.label ?? newStatus}.`);
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStatusAction = (e: React.MouseEvent, drawing: EngineeringDrawing, action: WorkflowAction) => {
    e.stopPropagation();
    if (action.requiresReason) {
      setRejectReason("");
      setRejectDrawing(drawing);
      setOpenActionsMenu(null);
      setOpenDropdown(null);
      return;
    }
    void changeStatus(e, drawing, action.status);
  };

  const handleRejectSubmit = async () => {
    if (!rejectDrawing) return;
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }
    setIsRejecting(true);
    try {
      await exportOrdersApi.updateDrawingStatus(rejectDrawing.id, "REJECTED", rejectReason.trim());
      toast.success("Drawing rejected.");
      setRejectDrawing(null);
      setRejectReason("");
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Rejection failed.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenSendModal = (e: React.MouseEvent, drawing: EngineeringDrawing) => {
    e.stopPropagation();
    if (!canWorkOnOrder(orderForDrawing(drawing))) {
      toast.error("View-only: you cannot send drawings for orders you are not assigned to.");
      return;
    }
    setOpenActionsMenu(null);

    // Find matching order contact details
    let initialEmail = "";
    let initialPhone = "";
    let orderCode = "";

    const salesOrderId = drawing.project?.salesOrderId;
    if (salesOrderId && orders) {
      const order = orders.find((o) => o.id === salesOrderId);
      if (order) {
        orderCode = order.dveplCode || "";
        const contact = parseContactDetails(order.contactDetails);
        initialEmail = contact.email;
        initialPhone = contact.phone;
      }
    }

    setSendModalDrawing(drawing);
    setRecipientEmail(initialEmail);
    setRecipientPhone(initialPhone);
    setCustomSubject(`Engineering Drawing for Order ${orderCode}: ${drawing.drawingNo}`);
    setCustomMessage(
      `Dear Customer,\n\nPlease find attached the engineering drawing: ${drawing.title} (${drawing.drawingNo}) for your order ${orderCode}.\n\nBest Regards,\nDVEPL Team`
    );
    setSendMethod("EMAIL");
  };

  const handleSendSubmit = async () => {
    if (!sendModalDrawing) return;

    if ((sendMethod === "EMAIL" || sendMethod === "BOTH") && !recipientEmail) {
      toast.error("Please enter a recipient email address.");
      return;
    }
    if ((sendMethod === "WHATSAPP" || sendMethod === "BOTH") && !recipientPhone) {
      toast.error("Please enter a customer mobile number.");
      return;
    }

    setIsSending(true);
    try {
      const res = await exportOrdersApi.sendDrawing({
        drawingId: sendModalDrawing.id,
        method: sendMethod,
        email: recipientEmail || null,
        phone: recipientPhone || null,
        subject: customSubject || null,
        message: customMessage || null,
      });

      if (res.success) {
        if (res.data.emailSent) {
          toast.success("Drawing sent via email successfully!");
        }
        if (res.data.whatsappLink) {
          toast.success("WhatsApp link generated. Opening WhatsApp...");
          window.open(res.data.whatsappLink, "_blank", "noopener,noreferrer");
        }
        setSendModalDrawing(null);
      } else {
        toast.error(res.message || "Failed to send drawing.");
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "An error occurred while sending the drawing.");
    } finally {
      setIsSending(false);
    }
  };

  // Stats
  const counts = drawings.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl border bg-background overflow-hidden relative">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="font-semibold text-base tracking-tight">Drawing Library</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All drawings linked to loaded orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedDrawingIds.length > 0 && (
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {selectedDrawingIds.length} selected
            </span>
          )}
          <span className="text-sm text-muted-foreground">{drawings.length} drawing{drawings.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Stat bar ───────────────────────────────────────────── */}
      {drawings.length > 0 && (
        <div className="grid grid-cols-5 divide-x border-b bg-muted/20 text-xs">
          {(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED", "PENDING"] as DrawingStatus[]).map((s) => {
            const cfg = STATUS_CONFIG[s];
            return (
              <div key={s} className="flex items-center gap-2 px-4 py-2.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className="text-muted-foreground truncate">{cfg.label}</span>
                <span className="ml-auto font-semibold text-foreground">{counts[s] ?? 0}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Empty ──────────────────────────────────────────────── */}
      {drawings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <p className="font-semibold text-sm">No drawings yet</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Upload drawings using the uploader above — they'll appear here once attached to an order.
          </p>
        </div>
      )}

      {/* ── GRID VIEW ──────────────────────────────────────────── */}
      {drawings.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6">
          {drawings.map((d) => {
            const isSelected = selectedDrawingIds.includes(d.id);
            const currentRevision = getCurrentRevision(d);
            const fileUrl = buildFileUrl(currentRevision?.fileUrl || d.fileUrl);
            const isUpdating = updatingId === d.id;
            const statusCfg = STATUS_CONFIG[d.status as DrawingStatus] ?? STATUS_CONFIG.PENDING;
            const canWork = canWorkOnOrder(orderForDrawing(d));

            return (
              <div
                key={d.id}
                onClick={() => toggle(d.id)}
                className={`group relative flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-primary border-primary shadow-lg"
                    : "hover:shadow-md hover:border-primary/40 border-border"
                }`}
              >
                {/* Thumbnail — clean preview layout */}
                <div className="relative h-44 bg-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden border-b">

                  {/* Selection overlay ring */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 z-10 pointer-events-none" />
                  )}

                  {/* Checkbox top-right (Used to choose which drawings to bundle in export/PDF options) */}
                  <div
                    className="absolute top-3 right-3 z-20"
                    onClick={(e) => { e.stopPropagation(); toggle(d.id); }}
                    title="Select drawing for bulk export/PDF"
                  >
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-primary drop-shadow-sm" />
                      : <Square className="w-5 h-5 text-gray-400 bg-background/80 rounded border-gray-300 opacity-80 hover:opacity-100 transition-opacity" />
                    }
                  </div>

                  {/* Status badge top-left */}
                  <span className={`absolute top-3 left-3 z-20 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>

                  <DrawingThumbnail mimeType={d.mimeType ?? undefined} fileName={d.fileName} fileUrl={fileUrl} />
                </div>

                {/* Card footer info */}
                <div className="p-3 flex flex-col gap-2 bg-background">
                  {/* Drawing info and Action Menu (Three dots) */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm leading-tight truncate">{d.drawingNo}</p>
                        <span className="text-[9px] font-medium px-1 py-0.2 rounded bg-muted text-muted-foreground flex-shrink-0">
                          {TYPE_LABELS[d.drawingType] ?? d.drawingType}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <p className="text-xs text-muted-foreground truncate leading-snug">{d.title}</p>
                        {currentRevision && (
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 flex-shrink-0">
                            R{currentRevision.revisionNo}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu (Three dots) */}
                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Popover
                        open={openActionsMenu === d.id}
                        onOpenChange={(open) => {
                          if (open) {
                            setOpenActionsMenu(d.id);
                            setOpenDropdown(null);
                          } else {
                            setOpenActionsMenu(null);
                          }
                        }}
                      >
                        <PopoverTrigger
                          render={
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border bg-background"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          }
                        />
                        <PopoverContent align="end" className="w-44 p-1 overflow-hidden z-50 bg-background border rounded-xl shadow-xl">
                          <button
                            onClick={(e) => openFile(e, getRevisionFileUrl(d))}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors text-left"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                            Open File
                          </button>
                          {getRevisionAwareDrawing(d).revisions &&
                            getRevisionAwareDrawing(d).revisions!.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setRevisionHistoryDrawing(getRevisionAwareDrawing(d));
                                setOpenActionsMenu(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors text-left"
                            >
                              <History className="w-3.5 h-3.5 text-muted-foreground" />
                              Revision History
                            </button>
                          )}
                          {d.status === "REJECTED" && canWork && (
                            <button
                              onClick={(e) => handleOpenRevisionModal(e, d)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 text-blue-700 transition-colors font-semibold text-left"
                            >
                              <Upload className="w-3.5 h-3.5 text-blue-600" />
                              Upload Revision
                            </button>
                          )}
                          {canWork && canEdit && (
                            <button
                              onClick={(e) => handleOpenSendModal(e, d)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors font-semibold text-left"
                            >
                              <Send className="w-3.5 h-3.5 text-primary" />
                              Send to Customer
                            </button>
                          )}
                          {(!canWork || !canEdit) && (
                            <p className="px-3 py-2 text-[11px] text-muted-foreground">
                              View only — no work actions available
                            </p>
                          )}
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {d.project?.name && (
                    <p className="text-[10px] text-muted-foreground/50 truncate -mt-0.5">{d.project.name}</p>
                  )}

                  {currentRevision && (
                    <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5">
                      <span className="font-semibold">Revision R{currentRevision.revisionNo}</span>
                      <span className="truncate">{currentRevision.fileName}</span>
                    </div>
                  )}

                  {d.status === "REJECTED" && d.rejectionReason && (
                    <p
                      className="text-[10px] text-red-600 bg-red-50 border border-red-200 rounded-md px-2 py-1 truncate"
                      title={d.rejectionReason}
                    >
                      Reason: {d.rejectionReason}
                    </p>
                  )}

                  {/* Status dropdown */}
                  <div className="relative mt-0.5" onClick={(e) => e.stopPropagation()}>
                    <Popover
                      open={openDropdown === d.id}
                      onOpenChange={(open) => {
                        if (open) {
                          setOpenDropdown(d.id);
                          setOpenActionsMenu(null);
                        } else {
                          setOpenDropdown(null);
                        }
                      }}
                    >
                      <PopoverTrigger
                        render={
                          <button
                            disabled={isUpdating || !canWork || !canEdit}
                            title={!canWork || !canEdit ? "View only — you cannot change the status of this drawing" : undefined}
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-all duration-200 disabled:opacity-50 hover:brightness-95 hover:shadow-xs cursor-pointer ${statusCfg.pill}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot} ${d.status === "PENDING" || d.status === "SUBMITTED" ? "animate-pulse" : ""}`} />
                            <span className="flex-1 text-left">{statusCfg.label}</span>
                            {isUpdating
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin ml-auto opacity-70" />
                              : <ChevronDown className="w-3.5 h-3.5 ml-auto opacity-70" />
                            }
                          </button>
                        }
                      />
                      <PopoverContent align="center" side="top" className="w-72 p-1.5 overflow-hidden z-50 bg-background/98 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <div className="px-2.5 py-1.5 border-b border-muted mb-1.5">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Change Status</p>
                        </div>
                        <div className="space-y-0.5">
                          {getStatusActions(d.status).length === 0 ? (
                            <p className="text-[11px] text-muted-foreground px-2.5 py-2 italic text-center">No workflow transitions available</p>
                          ) : (
                            getStatusActions(d.status).map((action) => {
                              const Icon = action.icon ?? STATUS_CONFIG[action.status].icon;
                              const isCurrent = d.status === action.status;
                              return (
                                <button
                                  key={action.status}
                                  disabled={isCurrent}
                                  onClick={(e) => {
                                    handleStatusAction(e, d, action);
                                    setOpenDropdown(null);
                                  }}
                                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 text-left disabled:cursor-default ${action.hoverBg} ${action.textColor} ${isCurrent ? "opacity-50 bg-muted/30" : "hover:bg-muted/60"}`}
                                >
                                  <div className="w-5 h-5 rounded-md bg-background border flex items-center justify-center flex-shrink-0 shadow-2xs">
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  </div>
                                  <span className="flex-1">{action.label}</span>
                                  {isCurrent && (
                                    <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-md">Current</span>
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── LIST VIEW ──────────────────────────────────────────── */}
      {drawings.length > 0 && viewMode === "list" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="w-10 px-4 py-3 text-left">
                  <button onClick={toggleAll} className="text-muted-foreground hover:text-foreground transition-colors">
                    {selectedDrawingIds.length === drawings.length && drawings.length > 0
                      ? <CheckSquare className="w-4 h-4 text-primary" />
                      : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Drawing</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Revision</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Order</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {drawings.map((d) => {
                const isSelected = selectedDrawingIds.includes(d.id);
                const isUpdating = updatingId === d.id;
                const rowBg = STATUS_CONFIG[d.status as DrawingStatus]?.row ?? "";
                const canWork = canWorkOnOrder(orderForDrawing(d));
                const currentRevision = getCurrentRevision(d);
                const statusCfg = STATUS_CONFIG[d.status as DrawingStatus] ?? STATUS_CONFIG.PENDING;

                return (
                  <tr
                    key={d.id}
                    onClick={() => toggle(d.id)}
                    className={`cursor-pointer transition-colors hover:bg-muted/30 ${isSelected ? "bg-primary/5" : rowBg}`}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggle(d.id)}>
                        {isSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-xs">{d.drawingNo}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.title}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
                        {TYPE_LABELS[d.drawingType] ?? d.drawingType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {currentRevision ? (
                        <div className="flex flex-col items-start gap-0.5">
                          <span className="text-[11px] font-semibold text-primary">
                            R{currentRevision.revisionNo}
                          </span>
                          <span className="text-[10px] text-muted-foreground max-w-[140px] truncate">
                            {currentRevision.fileName}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">R0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.project?.name ?? "—"}</td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-col items-start gap-1">
                        <Popover
                          open={openDropdown === d.id}
                          onOpenChange={(open) => {
                            if (open) {
                              setOpenDropdown(d.id);
                              setOpenActionsMenu(null);
                            } else {
                              setOpenDropdown(null);
                            }
                          }}
                        >
                          <PopoverTrigger
                            render={
                              <button
                                disabled={isUpdating || !canWork || !canEdit}
                                title={!canWork || !canEdit ? "View only — you cannot change the status of this drawing" : undefined}
                                className={`group inline-flex items-center gap-2 px-3 py-1.5 min-w-[130px] justify-between rounded-full border text-[11px] font-semibold transition-all duration-200 ${statusCfg.pill} ${canWork && canEdit ? "hover:brightness-95 hover:shadow-xs cursor-pointer" : "cursor-default"}`}
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${d.status === "PENDING" || d.status === "SUBMITTED" ? "animate-pulse" : ""}`} />
                                  <span className="truncate">{statusCfg.label}</span>
                                </div>
                                {canWork && canEdit && (
                                  isUpdating ? (
                                    <Loader2 className="w-3 h-3 animate-spin opacity-60 flex-shrink-0" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3 opacity-60 transition-opacity flex-shrink-0" />
                                  )
                                )}
                              </button>
                            }
                          />
                          <PopoverContent align="start" className="w-64 p-1.5 overflow-hidden z-50 bg-background/98 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="px-2.5 py-1.5 border-b border-muted mb-1.5">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Change Status</p>
                            </div>
                            <div className="space-y-0.5">
                              {getStatusActions(d.status).length === 0 ? (
                                <p className="text-[11px] text-muted-foreground px-2.5 py-2 italic text-center">No workflow transitions available</p>
                              ) : (
                                getStatusActions(d.status).map((action) => {
                                  const Icon = action.icon ?? STATUS_CONFIG[action.status].icon;
                                  const isCurrent = d.status === action.status;
                                  return (
                                    <button
                                      key={action.status}
                                      disabled={isCurrent}
                                      onClick={(e) => {
                                        handleStatusAction(e, d, action);
                                        setOpenDropdown(null);
                                      }}
                                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 text-left disabled:cursor-default ${action.hoverBg} ${action.textColor} ${isCurrent ? "opacity-50 bg-muted/30" : "hover:bg-muted/60"}`}
                                    >
                                      <div className="w-5 h-5 rounded-md bg-background border flex items-center justify-center flex-shrink-0 shadow-2xs">
                                        <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                      </div>
                                      <span className="flex-1">{action.label}</span>
                                      {isCurrent && (
                                        <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-md">Current</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                        {d.status === "REJECTED" && d.rejectionReason && (
                          <span
                            className="text-[10px] text-red-600 max-w-[200px] truncate pl-1"
                            title={d.rejectionReason}
                          >
                            {d.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => openFile(e, getRevisionFileUrl(d))}
                          title="Open current revision"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        {getRevisionAwareDrawing(d).revisions &&
                          getRevisionAwareDrawing(d).revisions!.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRevisionHistoryDrawing(getRevisionAwareDrawing(d));
                            }}
                            title="Revision history"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === "REJECTED" && canWork && (
                          <button
                            onClick={(e) => handleOpenRevisionModal(e, d)}
                            title="Upload Revision"
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canWork && (
                          <button
                            onClick={(e) => handleOpenSendModal(e, d)}
                            title="Send to Customer"
                            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Upload Revision Modal ─────────────────────────────── */}
      {revisionUploadDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-lg text-foreground">
                  Upload Drawing Revision
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {revisionUploadDrawing.drawingNo} ·{" "}
                  {revisionUploadDrawing.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isUploadingRevision) {
                    setRevisionUploadDrawing(null);
                    setRevisionFile(null);
                    setRevisionChanges("");
                  }
                }}
                disabled={isUploadingRevision}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                  Previous Drawing Rejected
                </p>
                <p className="text-xs text-red-700 mt-1">
                  {revisionUploadDrawing.rejectionReason ||
                    "Revision required."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Revised Drawing File *
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setRevisionFile(e.target.files?.[0] ?? null)}
                  disabled={isUploadingRevision}
                  className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary-foreground hover:file:opacity-90 disabled:opacity-50"
                />
                {revisionFile && (
                  <p className="text-[10px] text-muted-foreground">
                    Selected: {revisionFile.name} (
                    {(revisionFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Changes in This Revision
                </label>
                <textarea
                  value={revisionChanges}
                  onChange={(e) => setRevisionChanges(e.target.value)}
                  placeholder="Describe what was changed in this revision..."
                  rows={4}
                  disabled={isUploadingRevision}
                  className="w-full p-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none disabled:opacity-50"
                />
              </div>

              <p className="text-[10px] text-muted-foreground font-semibold">
                This will create the next revision automatically (for example,
                R0 → R1). The previous revision remains unchanged in history.
              </p>
            </div>

            <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-muted/10">
              <button
                type="button"
                onClick={() => {
                  setRevisionUploadDrawing(null);
                  setRevisionFile(null);
                  setRevisionChanges("");
                }}
                disabled={isUploadingRevision}
                className="px-4.5 py-2.5 rounded-xl border text-sm font-bold hover:bg-muted transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!revisionFile || isUploadingRevision}
                onClick={handleRevisionSubmit}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
              >
                {isUploadingRevision ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload Revision
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Send Modal ─────────────────────────────────────────── */}
      {sendModalDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-lg text-foreground">Send Engineering Drawing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send {sendModalDrawing.drawingNo} ({sendModalDrawing.title})
                </p>
              </div>
              <button
                onClick={() => setSendModalDrawing(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Method Selection */}
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                  Send Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["EMAIL", "WHATSAPP", "BOTH"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setSendMethod(m)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border text-xs font-bold transition-all ${
                        sendMethod === m
                          ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                          : "border-input bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {m === "EMAIL" && <Mail className="w-4.5 h-4.5" />}
                      {m === "WHATSAPP" && <MessageSquare className="w-4.5 h-4.5" />}
                      {m === "BOTH" && (
                        <div className="flex gap-0.5">
                          <Mail className="w-3.5 h-3.5" />
                          <MessageSquare className="w-3.5 h-3.5" />
                        </div>
                      )}
                      {m === "EMAIL" && "Email"}
                      {m === "WHATSAPP" && "WhatsApp"}
                      {m === "BOTH" && "Both"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Input */}
              {(sendMethod === "EMAIL" || sendMethod === "BOTH") && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Customer Email Address
                  </label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="customer@example.com"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
              )}

              {/* WhatsApp Phone Input */}
              {(sendMethod === "WHATSAPP" || sendMethod === "BOTH") && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Customer Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="e.g. 919876543210 (with country code)"
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                  <p className="text-[10px] text-muted-foreground font-semibold">
                    Ensure the phone number includes the country code (e.g. 91 for India) without '+' or spaces.
                  </p>
                </div>
              )}

              {/* Subject (for email) */}
              {(sendMethod === "EMAIL" || sendMethod === "BOTH") && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    placeholder="Enter custom email subject..."
                    className="w-full h-10 px-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                  />
                </div>
              )}

              {/* Message Box */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Message Details
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your message to the customer..."
                  rows={4}
                  className="w-full p-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-muted/10">
              <button
                type="button"
                onClick={() => setSendModalDrawing(null)}
                className="px-4.5 py-2.5 rounded-xl border text-sm font-bold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendSubmit}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Drawing
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Revision History Modal ─────────────────────────────── */}
      {revisionHistoryDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-lg text-foreground">Revision History</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {revisionHistoryDrawing.drawingNo} · {revisionHistoryDrawing.title}
                </p>
              </div>
              <button
                onClick={() => setRevisionHistoryDrawing(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
              {(() => {
                const revisions = [...(revisionHistoryDrawing.revisions ?? [])].sort(
                  (a, b) => b.revisionNo - a.revisionNo,
                );

                if (revisions.length === 0) {
                  return (
                    <div className="py-10 text-center text-sm text-muted-foreground">
                      No revision history available.
                    </div>
                  );
                }

                return revisions.map((revision, index) => {
                  const revisionStatus = revision.status ?? "DRAFT";
                  const revisionCfg =
                    STATUS_CONFIG[revisionStatus as DrawingStatus] ??
                    STATUS_CONFIG.DRAFT;
                  const isCurrent =
                    revision.revisionNo ===
                    (getCurrentRevision(revisionHistoryDrawing)?.revisionNo ??
                      revisions[0]?.revisionNo);

                  return (
                    <div
                      key={revision.id}
                      className={`rounded-xl border p-4 ${
                        isCurrent
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">
                              R{revision.revisionNo}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                CURRENT
                              </span>
                            )}
                            <StatusPill status={revisionStatus} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {revision.fileName}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const url = buildFileUrl(revision.fileUrl);
                            if (url) {
                              window.open(url, "_blank", "noopener,noreferrer");
                            } else {
                              toast.error("This revision does not have an attached file.");
                            }
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-muted transition-colors flex-shrink-0"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-[10px]">
                        <div>
                          <p className="text-muted-foreground">Created By</p>
                          <p className="font-semibold mt-0.5">
                            {revision.createdBy?.name ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created</p>
                          <p className="font-semibold mt-0.5">
                            {revision.createdAt
                              ? new Date(revision.createdAt).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Approved</p>
                          <p className="font-semibold mt-0.5">
                            {revision.approvedAt
                              ? new Date(revision.approvedAt).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rejected</p>
                          <p className="font-semibold mt-0.5">
                            {revision.rejectedAt
                              ? new Date(revision.rejectedAt).toLocaleString()
                              : "—"}
                          </p>
                        </div>
                      </div>

                      {revision.changes && (
                        <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            Changes
                          </p>
                          <p className="text-xs mt-1 whitespace-pre-wrap">
                            {revision.changes}
                          </p>
                        </div>
                      )}

                      {revision.rejectionReason && (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                          <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                            Rejection Reason
                          </p>
                          <p className="text-xs text-red-700 mt-1 whitespace-pre-wrap">
                            {revision.rejectionReason}
                          </p>
                        </div>
                      )}

                      {index < revisions.length - 1 && (
                        <div className="hidden" aria-hidden="true" />
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            <div className="border-t px-6 py-4 flex items-center justify-end bg-muted/10">
              <button
                type="button"
                onClick={() => setRevisionHistoryDrawing(null)}
                className="px-4 py-2 rounded-xl border text-sm font-bold hover:bg-muted transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ─────────────────────────────────────── */}
      {rejectDrawing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-background rounded-2xl border max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="border-b px-6 py-4 flex items-center justify-between bg-muted/20">
              <div>
                <h3 className="font-bold text-lg text-foreground">Reject Drawing</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {rejectDrawing.drawingNo} ({rejectDrawing.title})
                </p>
              </div>
              <button
                onClick={() => { setRejectDrawing(null); setRejectReason(""); }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Rejection Reason *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this drawing needs to be revised..."
                  rows={4}
                  className="w-full p-3.5 text-sm rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                />
                <p className="text-[10px] text-muted-foreground font-semibold">
                  The assigned engineer will see this reason and can revise/resubmit the drawing.
                </p>
              </div>
            </div>

            <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-muted/10">
              <button
                type="button"
                onClick={() => { setRejectDrawing(null); setRejectReason(""); }}
                className="px-4.5 py-2.5 rounded-xl border text-sm font-bold hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRejecting}
                onClick={handleRejectSubmit}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold shadow-sm hover:opacity-90 active:scale-[0.98] transition disabled:opacity-50"
              >
                {isRejecting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {isRejecting ? "Rejecting..." : "Reject Drawing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
