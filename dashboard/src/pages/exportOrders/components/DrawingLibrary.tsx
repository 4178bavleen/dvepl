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
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { apiClient } from "@/services/axios";
import toast from "react-hot-toast";
import { useState } from "react";

interface Props {
  drawings: any[];
  selectedDrawingIds: string[];
  setSelectedDrawingIds: (ids: string[]) => void;
  onStatusChanged?: () => void;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"];
const BASE_URL = (import.meta as any).env?.VITE_API_URL ?? "";

function buildFileUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("http")) return rawUrl;
  return `${BASE_URL}${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;
}

const STATUS_CONFIG = {
  PENDING:     { label: "Pending",     icon: Clock,        dot: "bg-amber-400",   pill: "bg-amber-50 text-amber-700 border border-amber-200",     row: "" },
  IN_PROGRESS: { label: "In Progress", icon: PlayCircle,   dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700 border border-blue-200",         row: "bg-blue-50/20" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700 border border-emerald-200", row: "bg-emerald-50/20" },
  ON_HOLD:     { label: "On Hold",     icon: PauseCircle,  dot: "bg-gray-400",    pill: "bg-gray-100 text-gray-600 border border-gray-200",         row: "bg-gray-50/40" },
  REJECTED:    { label: "Rejected",    icon: XCircle,      dot: "bg-red-500",     pill: "bg-red-50 text-red-600 border border-red-200",             row: "bg-red-50/20" },
} as const;

type DrawingStatus = keyof typeof STATUS_CONFIG;

const STATUS_ACTIONS: { status: DrawingStatus; label: string; hoverBg: string; textColor: string }[] = [
  { status: "PENDING",     label: "Pending",     hoverBg: "hover:bg-amber-50",   textColor: "text-amber-700" },
  { status: "IN_PROGRESS", label: "In Progress", hoverBg: "hover:bg-blue-50",    textColor: "text-blue-700" },
  { status: "COMPLETED",   label: "Completed",   hoverBg: "hover:bg-emerald-50", textColor: "text-emerald-700" },
  { status: "ON_HOLD",     label: "On Hold",     hoverBg: "hover:bg-gray-50",    textColor: "text-gray-600" },
  { status: "REJECTED",    label: "Rejected",    hoverBg: "hover:bg-red-50",     textColor: "text-red-600" },
];

const TYPE_LABELS: Record<string, string> = {
  SLD: "SLD", GA_DRAWING: "G.A.", WIRING_DIAGRAM: "Wiring",
  LAYOUT: "Layout", CAD: "CAD", PDF: "PDF", OTHER: "Other",
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
}: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    window.open(buildFileUrl(url), "_blank");
  };

  const changeStatus = async (e: React.MouseEvent, drawing: any, newStatus: string) => {
    e.stopPropagation();
    setOpenDropdown(null);
    setUpdatingId(drawing.id);
    try {
      await apiClient.put(`/export-orders/drawing/update/${drawing.id}`, { status: newStatus });
      toast.success(`Marked as ${STATUS_CONFIG[newStatus as DrawingStatus]?.label ?? newStatus}.`);
      onStatusChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Stats
  const counts = drawings.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="rounded-xl border bg-background overflow-hidden">

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
          {(["PENDING", "IN_PROGRESS", "COMPLETED", "ON_HOLD", "REJECTED"] as DrawingStatus[]).map((s) => {
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
            const fileUrl = buildFileUrl(d.fileUrl);
            const isUpdating = updatingId === d.id;
            const statusCfg = STATUS_CONFIG[d.status as DrawingStatus] ?? STATUS_CONFIG.PENDING;
            const StatusIcon = statusCfg.icon;

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
                {/* Thumbnail — tall, generous */}
                <div className="relative h-44 bg-muted/40 flex items-center justify-center flex-shrink-0 overflow-hidden">

                  {/* Selection overlay ring */}
                  {isSelected && (
                    <div className="absolute inset-0 bg-primary/10 z-10 pointer-events-none" />
                  )}

                  {/* Checkbox top-right */}
                  <div
                    className="absolute top-3 right-3 z-20"
                    onClick={(e) => { e.stopPropagation(); toggle(d.id); }}
                  >
                    {isSelected
                      ? <CheckSquare className="w-5 h-5 text-primary drop-shadow-sm" />
                      : <Square className="w-5 h-5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                    }
                  </div>

                  {/* Status badge top-left */}
                  <span className={`absolute top-3 left-3 z-20 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.pill}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>

                  <DrawingThumbnail mimeType={d.mimeType} fileName={d.fileName} fileUrl={fileUrl} />

                  {/* Hover action overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-end p-3 gap-2 z-10">

                    <button
                      onClick={(e) => openFile(e, d.fileUrl)}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-white text-gray-900 hover:bg-gray-100 transition-colors w-full"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open File
                    </button>

                    {/* Status buttons row */}
                    <div className="flex gap-1.5">
                      {STATUS_ACTIONS.filter((a) => a.status !== d.status).slice(0, 3).map((action) => {
                        const Icon = STATUS_CONFIG[action.status].icon;
                        const isRej = action.status === "REJECTED";
                        return (
                          <button
                            key={action.status}
                            disabled={isUpdating}
                            onClick={(e) => changeStatus(e, d, action.status)}
                            className={`flex-1 flex items-center justify-center gap-1 text-[10px] font-semibold py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                              isRej
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                            }`}
                          >
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                            {action.label.split(" ")[0]}
                          </button>
                        );
                      })}
                    </div>

                    {/* More status — dropdown trigger */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={isUpdating}
                        onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === d.id ? null : d.id); }}
                        className="flex items-center justify-center gap-1 text-[10px] font-medium px-2 py-1 rounded-lg bg-black/40 hover:bg-black/60 text-white w-full transition-colors"
                      >
                        <ChevronDown className="w-3 h-3" />
                        All statuses
                      </button>
                      {openDropdown === d.id && (
                        <div className="absolute bottom-full mb-1 left-0 right-0 z-50 rounded-xl border bg-background shadow-2xl py-1 overflow-hidden">
                          {STATUS_ACTIONS.map((action) => {
                            const Icon = STATUS_CONFIG[action.status].icon;
                            return (
                              <button
                                key={action.status}
                                disabled={d.status === action.status}
                                onClick={(e) => changeStatus(e, d, action.status)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${action.hoverBg} ${action.textColor}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {action.label}
                                {d.status === action.status && (
                                  <span className="ml-auto text-[10px] text-muted-foreground">Current</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card footer */}
                <div className="p-4 flex flex-col gap-1 bg-background">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-sm">{d.drawingNo}</p>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex-shrink-0 mt-0.5">
                      {TYPE_LABELS[d.drawingType] ?? d.drawingType}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate leading-snug">{d.title}</p>
                  {d.project?.name && (
                    <p className="text-[11px] text-muted-foreground/60 truncate">{d.project.name}</p>
                  )}
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
                    <td className="px-4 py-3 text-xs text-muted-foreground">{d.project?.name ?? "—"}</td>
                    <td className="px-4 py-3"><StatusPill status={d.status} /></td>
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => openFile(e, d.fileUrl)}
                          title="Open file"
                          className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <div className="relative">
                          <button
                            disabled={isUpdating}
                            onClick={(e) => { e.stopPropagation(); setOpenDropdown(openDropdown === d.id ? null : d.id); }}
                            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
                          >
                            {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <ChevronDown className="w-3 h-3" />}
                            {isUpdating ? "Saving…" : "Status"}
                          </button>
                          {openDropdown === d.id && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border bg-background shadow-xl py-1 overflow-hidden">
                              {STATUS_ACTIONS.map((action) => {
                                const Icon = STATUS_CONFIG[action.status].icon;
                                return (
                                  <button
                                    key={action.status}
                                    disabled={d.status === action.status}
                                    onClick={(e) => changeStatus(e, d, action.status)}
                                    className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${action.hoverBg} ${action.textColor}`}
                                  >
                                    <Icon className="w-3.5 h-3.5" />
                                    {action.label}
                                    {d.status === action.status && (
                                      <span className="ml-auto text-[10px] text-muted-foreground">Current</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {openDropdown && (
        <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
      )}
    </div>
  );
}