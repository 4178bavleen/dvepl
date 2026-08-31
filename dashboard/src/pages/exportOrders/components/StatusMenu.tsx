import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  STATUS_CONFIG,
  getStatusActions,
  type DrawingStatus,
  type WorkflowAction,
} from "./constants";

interface Props {
  status: string;
  isUpdating?: boolean;
  disabled?: boolean;
  disabledTooltip?: string;
  onStatusChange: (
    e: React.MouseEvent,
    status: string,
    reason?: string,
  ) => void;
  onReject?: (drawingId: string) => void;
  align?: "center" | "start";
  side?: "top" | "bottom" | "left" | "right";
  className?: string;
  compact?: boolean;
}

export default function StatusMenu({
  status,
  isUpdating = false,
  disabled = false,
  disabledTooltip,
  onStatusChange,
  onReject,
  align = "center",
  side = "top",
  className = "",
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status as DrawingStatus] ?? STATUS_CONFIG.PENDING;
  const actions = getStatusActions(status);
  const hasActions = actions.length > 0;
  const isAnimated =
    status === "PENDING" || status === "SUBMITTED";

  const handleAction = (e: React.MouseEvent, action: WorkflowAction) => {
    e.stopPropagation();
    if (action.requiresReason && onReject) {
      onReject(status);
      setOpen(false);
      return;
    }
    onStatusChange(e, action.status);
    setOpen(false);
  };

  const triggerBase = compact
    ? `group inline-flex items-center gap-2 px-3 py-1.5 min-w-[130px] justify-between rounded-full border text-[11px] font-semibold transition-all duration-200 ${cfg.pill}`
    : `w-full flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold shadow-2xs transition-all duration-200 ${cfg.pill}`;

  const triggerState = disabled
    ? "opacity-70 cursor-default"
    : "hover:brightness-95 hover:shadow-xs cursor-pointer";

  const triggerClasses = `${triggerBase} ${triggerState} ${className}`;

  const triggerDisabled = isUpdating || disabled || !hasActions;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <Popover
        open={open}
        onOpenChange={(o) => {
          if (o) setOpen(true);
          else setOpen(false);
        }}
      >
        <PopoverTrigger
          render={
            <button
              disabled={triggerDisabled}
              title={disabledTooltip}
              className={triggerClasses}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${
                    isAnimated ? "animate-pulse" : ""
                  }`}
                />
                <span className="truncate">{cfg.label}</span>
              </div>
              {!disabled && hasActions && (
                isUpdating ? (
                  <Loader2 className="w-3 h-3 animate-spin opacity-60 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-3 h-3 opacity-60 transition-opacity flex-shrink-0" />
                )
              )}
            </button>
          }
        />
        <PopoverContent
          align={align}
          side={side}
          className="w-72 p-1.5 overflow-hidden z-50 bg-background/98 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="px-2.5 py-1.5 border-b border-muted mb-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Change Status
            </p>
          </div>
          <div className="space-y-0.5">
            {actions.length === 0 ? (
              <p className="text-[11px] text-muted-foreground px-2.5 py-2 italic text-center">
                No workflow transitions available
              </p>
            ) : (
              actions.map((action) => {
                const ActionIcon =
                  action.icon ?? STATUS_CONFIG[action.status]?.icon;
                const isCurrent = status === action.status;
                return (
                  <button
                    key={action.status}
                    disabled={isCurrent}
                    onClick={(e) => handleAction(e, action)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 text-left disabled:cursor-default ${action.hoverBg} ${action.textColor} ${
                      isCurrent
                        ? "opacity-50 bg-muted/30"
                        : "hover:bg-muted/60"
                    }`}
                  >
                    <div className="w-5 h-5 rounded-md bg-background border flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <ActionIcon className="w-3.5 h-3.5 flex-shrink-0" />
                    </div>
                    <span className="flex-1">{action.label}</span>
                    {isCurrent && (
                      <span className="text-[10px] text-muted-foreground font-semibold bg-muted px-1.5 py-0.5 rounded-md">
                        Current
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
