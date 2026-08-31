import {
  FileText,
  CheckSquare,
  Square,
  ExternalLink,
  LayoutGrid,
  List,
  MoreVertical,
  History,
  Send,
  Upload,
} from "lucide-react";
import React, { useState } from "react";
import { useSalesOrderAccess } from "@/utils/salesOrderAccess";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  type EngineeringDrawing,
} from "@/types/exportOrders";
import {
  STATUS_CONFIG,
  TYPE_LABELS,
  getCurrentRevision,
  getRevisionFileUrl,
  buildFileUrl,
  parseContactDetails,
  orderForDrawing,
  toRevisionAware,
  type DrawingStatus,
} from "./constants";
import StatusMenu from "./StatusMenu";
import DrawingThumbnail from "./DrawingThumbnail";
import RevisionUploadModal from "./RevisionUploadModal";
import SendDrawingModal from "./SendDrawingModal";
import RevisionHistoryModal from "./RevisionHistoryModal";
import RejectDrawingModal from "./RejectDrawingModal";

interface Props {
  drawings: EngineeringDrawing[];
  selectedDrawingIds: string[];
  setSelectedDrawingIds: (ids: string[]) => void;
  onStatusChanged?: () => void;
  canEdit?: boolean;
  orders?: any[];
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
  const [openActionsMenu, setOpenActionsMenu] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Modal states
  const [revisionHistoryDrawing, setRevisionHistoryDrawing] = useState<EngineeringDrawing | null>(null);
  const [revisionUploadDrawing, setRevisionUploadDrawing] = useState<EngineeringDrawing | null>(null);
  const [sendModalDrawing, setSendModalDrawing] = useState<EngineeringDrawing | null>(null);
  const [rejectDrawing, setRejectDrawing] = useState<EngineeringDrawing | null>(null);

  const { canWorkOnOrder } = useSalesOrderAccess();

  const canWork = (drawing: EngineeringDrawing) =>
    canWorkOnOrder(orderForDrawing(drawing, orders));

  // ── Selection ──────────────────────────────────────────────────────────────

  const toggle = (id: string) =>
    setSelectedDrawingIds(
      selectedDrawingIds.includes(id)
        ? selectedDrawingIds.filter((x) => x !== id)
        : [...selectedDrawingIds, id],
    );

  const toggleAll = () =>
    setSelectedDrawingIds(
      selectedDrawingIds.length === drawings.length ? [] : drawings.map((d) => d.id),
    );

  // ── Status change ──────────────────────────────────────────────────────────

  const changeStatus = async (
    e: React.MouseEvent,
    drawing: EngineeringDrawing,
    newStatus: string,
    reason?: string,
  ) => {
    e.stopPropagation();
    if (!canWork(drawing)) return;
    setUpdatingId(drawing.id);
    try {
      const { exportOrdersApi } = await import("@/services/modules");
      await exportOrdersApi.updateDrawingStatus(drawing.id, newStatus, reason);
      const label = STATUS_CONFIG[newStatus]?.label ?? newStatus;
      const toast = (await import("react-hot-toast")).default;
      toast.success(`Marked as ${label}.`);
      onStatusChanged?.();
    } catch (err: any) {
      const toast = (await import("react-hot-toast")).default;
      toast.error(err?.response?.data?.message ?? "Status update failed.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectClick = (drawing: EngineeringDrawing) => {
    setOpenActionsMenu(null);
    setRejectDrawing(drawing);
  };

  // ── File open ──────────────────────────────────────────────────────────────

  const openFile = (e: React.MouseEvent, drawing: EngineeringDrawing) => {
    e.stopPropagation();
    setOpenActionsMenu(null);
    const url = buildFileUrl(getRevisionFileUrl(drawing));
    if (!url) {
      import("react-hot-toast").then((m) =>
        m.default.error("This drawing does not have an attached file."),
      );
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // ── Send modal ─────────────────────────────────────────────────────────────

  const openSendModal = (e: React.MouseEvent, drawing: EngineeringDrawing) => {
    e.stopPropagation();
    setOpenActionsMenu(null);
    setSendModalDrawing(drawing);
  };

  // ── Action menu buttons ────────────────────────────────────────────────────

  const ActionMenuButton = ({
    drawing,
    icon: Icon,
    label,
    onClick,
    className = "",
  }: {
    drawing: EngineeringDrawing;
    icon: any;
    label: string;
    onClick: (e: React.MouseEvent, d: EngineeringDrawing) => void;
    className?: string;
  }) => (
    <button
      onClick={(e) => onClick(e, drawing)}
      className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors text-left ${className}`}
    >
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      {label}
    </button>
  );

  const ActionsMenu = ({ drawing }: { drawing: EngineeringDrawing }) => {
    const workable = canWork(drawing);
    const hasRevisions =
      toRevisionAware(drawing).revisions &&
      toRevisionAware(drawing).revisions!.length > 0;

    return (
      <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <Popover
          open={openActionsMenu === drawing.id}
          onOpenChange={(o) => {
            setOpenActionsMenu(o ? drawing.id : null);
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
          <PopoverContent
            align="end"
            className="w-44 p-1 overflow-hidden z-50 bg-background border rounded-xl shadow-xl"
          >
            <ActionMenuButton
              drawing={drawing}
              icon={ExternalLink}
              label="Open File"
              onClick={openFile}
            />
            {hasRevisions && (
              <ActionMenuButton
                drawing={drawing}
                icon={History}
                label="Revision History"
                onClick={(e) => {
                  e.stopPropagation();
                  setRevisionHistoryDrawing(toRevisionAware(drawing));
                  setOpenActionsMenu(null);
                }}
              />
            )}
            {drawing.status === "REJECTED" && workable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRevisionUploadDrawing(drawing);
                  setOpenActionsMenu(null);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-blue-50 text-blue-700 transition-colors font-semibold text-left"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                Upload Revision
              </button>
            )}
            {workable && canEdit && (
              <button
                onClick={(e) => openSendModal(e, drawing)}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted text-foreground transition-colors font-semibold text-left"
              >
                <Send className="w-3.5 h-3.5 text-primary" />
                Send to Customer
              </button>
            )}
            {!workable && (
              <p className="px-3 py-2 text-[11px] text-muted-foreground">
                View only — no work actions available
              </p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  // ── Status counts ──────────────────────────────────────────────────────────

  const counts = drawings.reduce<Record<string, number>>((acc, d) => {
    acc[d.status] = (acc[d.status] ?? 0) + 1;
    return acc;
  }, {});

  const STATUSES_TO_SHOW: DrawingStatus[] = [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
    "PENDING",
  ];

  // ── Grid Card ──────────────────────────────────────────────────────────────

  const DrawingGridCard = ({ d }: { d: EngineeringDrawing }) => {
    const isSelected = selectedDrawingIds.includes(d.id);
    const currentRev = getCurrentRevision(d);
    const fileUrl = buildFileUrl(currentRev?.fileUrl || d.fileUrl);
    const workable = canWork(d);
    const statusCfg =
      STATUS_CONFIG[d.status as DrawingStatus] ?? STATUS_CONFIG.PENDING;

    return (
      <div
        onClick={() => toggle(d.id)}
        className={`group relative flex flex-col rounded-xl border overflow-hidden cursor-pointer transition-all duration-200 ${
          isSelected
            ? "ring-2 ring-primary border-primary shadow-lg"
            : "hover:shadow-md hover:border-primary/40"
        }`}
      >
        {/* Thumbnail */}
        <div className="relative h-44 bg-muted/40 flex items-center justify-center overflow-hidden border-b">
          {isSelected && (
            <div className="absolute inset-0 bg-primary/10 z-10 pointer-events-none" />
          )}
          {/* Checkbox */}
          <div
            className="absolute top-3 right-3 z-20"
            onClick={(e) => {
              e.stopPropagation();
              toggle(d.id);
            }}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-primary drop-shadow-sm" />
            ) : (
              <Square className="w-5 h-5 text-gray-400 bg-background/80 rounded border-gray-300 opacity-80 hover:opacity-100 transition-opacity" />
            )}
          </div>
          {/* Status badge */}
          <span
            className={`absolute top-3 left-3 z-20 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.pill}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>
          <DrawingThumbnail
            mimeType={d.mimeType ?? undefined}
            fileName={d.fileName}
            fileUrl={fileUrl}
          />
        </div>

        {/* Footer */}
        <div className="p-3 flex flex-col gap-2 bg-background">
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
                {currentRev && (
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-primary/5 text-primary border border-primary/10 flex-shrink-0">
                    R{currentRev.revisionNo}
                  </span>
                )}
              </div>
            </div>
            <ActionsMenu drawing={d} />
          </div>

          {d.project?.name && (
            <p className="text-[10px] text-muted-foreground/50 truncate -mt-0.5">
              {d.project.name}
            </p>
          )}

          {currentRev && (
            <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground bg-muted/30 rounded-md px-2 py-1.5">
              <span className="font-semibold">Revision R{currentRev.revisionNo}</span>
              <span className="truncate">{currentRev.fileName}</span>
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
          <div className="mt-0.5">
            <StatusMenu
              status={d.status}
              isUpdating={updatingId === d.id}
              disabled={!workable || !canEdit}
              disabledTooltip={
                !workable || !canEdit
                  ? "View only — you cannot change the status of this drawing"
                  : undefined
              }
              onStatusChange={(e, status) => changeStatus(e, d, status)}
              onReject={() => handleRejectClick(d)}
              side="top"
            />
          </div>
        </div>
      </div>
    );
  };

  // ── List Table Row ─────────────────────────────────────────────────────────

  const DrawingListRow = ({ d }: { d: EngineeringDrawing }) => {
    const isSelected = selectedDrawingIds.includes(d.id);
    const workable = canWork(d);
    const currentRev = getCurrentRevision(d);
    const statusCfg =
      STATUS_CONFIG[d.status as DrawingStatus] ?? STATUS_CONFIG.PENDING;

    return (
      <tr
        onClick={() => toggle(d.id)}
        className={`cursor-pointer transition-colors hover:bg-muted/30 ${
          isSelected ? "bg-primary/5" : statusCfg.rowBg
        }`}
      >
        {/* Checkbox */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => toggle(d.id)}>
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-primary" />
            ) : (
              <Square className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </td>

        {/* Drawing */}
        <td className="px-4 py-3">
          <div>
            <p className="font-semibold text-xs">{d.drawingNo}</p>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{d.title}</p>
          </div>
        </td>

        {/* Type */}
        <td className="px-4 py-3">
          <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-medium">
            {TYPE_LABELS[d.drawingType] ?? d.drawingType}
          </span>
        </td>

        {/* Revision */}
        <td className="px-4 py-3">
          {currentRev ? (
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[11px] font-semibold text-primary">R{currentRev.revisionNo}</span>
              <span className="text-[10px] text-muted-foreground max-w-[140px] truncate">
                {currentRev.fileName}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">R0</span>
          )}
        </td>

        {/* Order */}
        <td className="px-4 py-3 text-xs text-muted-foreground">
          {d.project?.name ?? "—"}
        </td>

        {/* Status */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <StatusMenu
            status={d.status}
            isUpdating={updatingId === d.id}
            disabled={!workable || !canEdit}
            disabledTooltip={
              !workable || !canEdit
                ? "View only — you cannot change the status of this drawing"
                : undefined
            }
            onStatusChange={(e, status) => changeStatus(e, d, status)}
            onReject={() => handleRejectClick(d)}
            align="start"
            compact
          />
          {d.status === "REJECTED" && d.rejectionReason && (
            <span
              className="text-[10px] text-red-600 max-w-[200px] truncate pl-1 mt-1 block"
              title={d.rejectionReason}
            >
              {d.rejectionReason}
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={(e) => openFile(e, d)}
              title="Open current revision"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            {toRevisionAware(d).revisions &&
              toRevisionAware(d).revisions!.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRevisionHistoryDrawing(toRevisionAware(d));
                  }}
                  title="Revision history"
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                </button>
              )}
            {d.status === "REJECTED" && workable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRevisionUploadDrawing(d);
                }}
                title="Upload Revision"
                className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
              </button>
            )}
            {workable && canEdit && (
              <button
                onClick={(e) => openSendModal(e, d)}
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
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-xl border bg-background overflow-hidden">
      {/* Header */}
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
          <span className="text-sm text-muted-foreground">
            {drawings.length} drawing{drawings.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 transition-colors ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 transition-colors ${
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Status bar */}
      {drawings.length > 0 && (
        <div className="grid grid-cols-5 divide-x border-b bg-muted/20 text-xs">
          {STATUSES_TO_SHOW.map((s) => {
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

      {/* Empty */}
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

      {/* Grid view */}
      {drawings.length > 0 && viewMode === "grid" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 p-6">
          {drawings.map((d) => (
            <DrawingGridCard key={d.id} d={d} />
          ))}
        </div>
      )}

      {/* List view */}
      {drawings.length > 0 && viewMode === "list" && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40 border-b">
                <th className="w-10 px-4 py-3 text-left">
                  <button
                    onClick={toggleAll}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {selectedDrawingIds.length === drawings.length && drawings.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-primary" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
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
              {drawings.map((d) => (
                <DrawingListRow key={d.id} d={d} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      {revisionUploadDrawing && (
        <RevisionUploadModal
          drawing={revisionUploadDrawing}
          open={true}
          onClose={() => setRevisionUploadDrawing(null)}
          onUploaded={onStatusChanged ?? (() => {})}
        />
      )}
      {revisionHistoryDrawing && (
        <RevisionHistoryModal
          drawing={revisionHistoryDrawing}
          open={true}
          onClose={() => setRevisionHistoryDrawing(null)}
        />
      )}
      {sendModalDrawing && (
        <SendDrawingModal
          drawing={sendModalDrawing}
          initialEmail={
            (() => {
              const order = orderForDrawing(sendModalDrawing, orders);
              return order ? parseContactDetails(order.contactDetails).email : "";
            })()
          }
          initialPhone={
            (() => {
              const order = orderForDrawing(sendModalDrawing, orders);
              return order ? parseContactDetails(order.contactDetails).phone : "";
            })()
          }
          orderCode={
            (() => {
              const order = orderForDrawing(sendModalDrawing, orders);
              return order?.dveplCode || "";
            })()
          }
          open={true}
          onClose={() => setSendModalDrawing(null)}
          onSent={onStatusChanged ?? (() => {})}
        />
      )}
      {rejectDrawing && (
        <RejectDrawingModal
          drawing={rejectDrawing}
          open={true}
          onClose={() => setRejectDrawing(null)}
          onRejected={onStatusChanged ?? (() => {})}
        />
      )}
    </div>
  );
}
