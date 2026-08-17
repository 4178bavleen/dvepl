import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GripVertical,
  Search,
  Send,
  ShoppingCart,
} from "lucide-react";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import workflowApi, {
  WorkflowOrder,
  WorkflowStage,
  WorkflowEvent,
} from "@/services/workflowApi";
import { useERPStore } from "@/store/erpStore";
import { canPerformPageAction } from "@/utils/pagePermissions";

const STAGE_ORDER: WorkflowStage[] = [
  "ORDER_CONFIRMED",
  "PO_READY",
  "DRAWING_ASSIGNED",
  "DRAWING_SENT",
  "REVISION_REQUIRED",
  "DRAWING_APPROVED",
  "PO_PLACED",
  "INVENTORY_FOLLOW_UP",
  "PRODUCTION_FOLLOW_UP",
];

const stages: { value: WorkflowStage; label: string }[] = [
  { value: "ORDER_CONFIRMED", label: "Order Confirmed" },
  { value: "PO_READY", label: "PO Ready" },
  { value: "DRAWING_ASSIGNED", label: "Drawing Assigned" },
  { value: "DRAWING_SENT", label: "Drawing Sent" },
  { value: "REVISION_REQUIRED", label: "Revision Required" },
  { value: "DRAWING_APPROVED", label: "Drawing Approved" },
  { value: "PO_PLACED", label: "PO Placed" },
  { value: "INVENTORY_FOLLOW_UP", label: "Inventory Follow-up" },
  { value: "PRODUCTION_FOLLOW_UP", label: "Production Follow-up" },
];

const pipelineStages = stages;

function stageLabel(stage: WorkflowStage) {
  return (
    stages.find((s) => s.value === stage)?.label || stage.replace(/_/g, " ")
  );
}

const stageStyles: Record<
  WorkflowStage,
  { dot: string; text: string; chip: string }
> = {
  ORDER_CONFIRMED: {
    dot: "bg-blue-500",
    text: "text-blue-500 dark:text-blue-400",
    chip: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
  },
  PO_READY: {
    dot: "bg-violet-500",
    text: "text-violet-500 dark:text-violet-400",
    chip: "bg-violet-500/10 text-violet-600 border-violet-500/20 dark:text-violet-400",
  },
  DRAWING_ASSIGNED: {
    dot: "bg-purple-500",
    text: "text-purple-500 dark:text-purple-400",
    chip: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400",
  },
  DRAWING_SENT: {
    dot: "bg-indigo-500",
    text: "text-indigo-500 dark:text-indigo-400",
    chip: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:text-indigo-400",
  },
  REVISION_REQUIRED: {
    dot: "bg-orange-500",
    text: "text-orange-500 dark:text-orange-400",
    chip: "bg-orange-500/10 text-orange-600 border-orange-500/20 dark:text-orange-400",
  },
  DRAWING_APPROVED: {
    dot: "bg-green-500",
    text: "text-green-500 dark:text-green-400",
    chip: "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400",
  },
  PO_PLACED: {
    dot: "bg-emerald-500",
    text: "text-emerald-500 dark:text-emerald-400",
    chip: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
  },
  INVENTORY_FOLLOW_UP: {
    dot: "bg-amber-500",
    text: "text-amber-500 dark:text-amber-400",
    chip: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
  },
  PRODUCTION_FOLLOW_UP: {
    dot: "bg-cyan-500",
    text: "text-cyan-500 dark:text-cyan-400",
    chip: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20 dark:text-cyan-400",
  },
};

function formatDate(value?: string | Date | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function overdue(value?: string | Date | null) {
  return !!value && new Date(value).getTime() < Date.now();
}

function StageChip({ stage }: { stage: WorkflowStage }) {
  const style = stageStyles[stage];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${style.chip}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {stageLabel(stage)}
    </span>
  );
}

export default function WorkflowTrackerPage() {
  const store = useERPStore();
  const currentUser = store.users?.find(
    (u: any) => u.id === store.currentUserId,
  ) as any;
  const canEdit = canPerformPageAction(
    currentUser?.actionPermissions,
    "workflow_tracker",
    "edit",
  );

  const [orders, setOrders] = useState<WorkflowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkflowOrder | null>(
    null,
  );
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [timeline, setTimeline] = useState<WorkflowEvent[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  const [reminderOpen, setReminderOpen] = useState(false);
  const [savingReminder, setSavingReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    nextAction: "",
    dueDate: "",
    description: "",
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const loadTracker = useCallback(async (orderId: string) => {
    setLoadingTimeline(true);
    try {
      const response = await workflowApi.getOrderTracker(orderId);
      if (response.data.success) {
        setTimeline(response.data.data.timeline || []);
      }
    } catch (error) {
      console.error("Failed to load workflow tracker:", error);
      setTimeline([]);
    } finally {
      setLoadingTimeline(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workflowApi.getOrders({
        search: search.trim() || undefined,
      });
      if (response.data.success) {
        const data = response.data.data || [];
        setOrders(data);
        setSelectedOrder((current) =>
          current
            ? data.find((x) => x.id === current.id) || data[0] || null
            : data[0] || null,
        );
      }
    } catch (error) {
      console.error("Failed to load workflow orders:", error);
      toast.error("Failed to load workflow orders.");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const selectedOrderId = selectedOrder?.id;
  useEffect(() => {
    if (selectedOrderId) {
      void loadTracker(selectedOrderId);
    } else {
      setTimeline([]);
    }
  }, [selectedOrderId, loadTracker]);

  const handleSelectOrder = (order: WorkflowOrder) => {
    setSelectedOrder(order);
    void loadTracker(order.id);
  };

  const handleStageChange = async (
    orderId: string,
    stage: WorkflowStage,
    extra?: {
      nextAction?: string | null;
      dueDate?: string | null;
      description?: string | null;
    },
  ) => {
    const order = orders.find((item) => item.id === orderId);
    if (
      !order ||
      (order.workflowStage === stage && !extra) ||
      updatingOrderId === orderId
    )
      return;

    try {
      setUpdatingOrderId(orderId);
      await workflowApi.updateOrderWorkflowStage(orderId, stage, extra);
      toast.success(
        extra
          ? "Workflow details updated successfully."
          : `Order moved to "${stageLabel(stage)}".`,
      );
      await loadOrders();
      await loadTracker(orderId);
    } catch (error: any) {
      console.error("Failed to update workflow stage:", error);
      toast.error(
        error?.response?.data?.message ?? "Failed to update workflow stage.",
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const orderId = active.id.toString().replace("order:", "");
    const targetStage = over.id.toString().replace("stage:", "");
    if (
      !orderId ||
      !targetStage ||
      !(STAGE_ORDER as string[]).includes(targetStage)
    )
      return;

    const order = orders.find((item) => item.id === orderId);
    if (!order || order.workflowStage === (targetStage as WorkflowStage))
      return;

    void handleStageChange(orderId, targetStage as WorkflowStage);
  };

  const handleMarkAsDone = async () => {
    if (!selectedOrder) return;
    const currentIndex = STAGE_ORDER.indexOf(selectedOrder.workflowStage);
    const nextStage = STAGE_ORDER[currentIndex + 1];
    if (!nextStage) {
      toast.success("Order is already in the final stage.");
      return;
    }
    await handleStageChange(selectedOrder.id, nextStage, {
      description: `Marked as done — advanced to ${stageLabel(nextStage)}`,
    });
  };

  const openReminder = () => {
    if (!selectedOrder) return;
    setReminderForm({
      nextAction: selectedOrder.nextAction || "",
      dueDate: selectedOrder.dueDate
        ? new Date(selectedOrder.dueDate).toISOString().slice(0, 10)
        : "",
      description: "",
    });
    setReminderOpen(true);
  };

  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setSavingReminder(true);
    try {
      await workflowApi.updateOrderWorkflowStage(
        selectedOrder.id,
        selectedOrder.workflowStage,
        {
          nextAction: reminderForm.nextAction.trim() || null,
          dueDate: reminderForm.dueDate || null,
          description:
            reminderForm.description.trim() || "Reminder / follow-up scheduled",
        },
      );
      toast.success("Reminder details saved successfully.");
      setReminderOpen(false);
      await loadOrders();
      await loadTracker(selectedOrder.id);
    } catch (error: any) {
      console.error("Failed to save reminder:", error);
      toast.error(error?.response?.data?.message ?? "Failed to save reminder.");
    } finally {
      setSavingReminder(false);
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter(
      (o) => o.workflowStage === "PO_PLACED",
    ).length;
    const inProgress = total - completed;
    const overdueCount = orders.filter((o) => overdue(o.dueDate)).length;
    return { total, inProgress, completed, overdue: overdueCount };
  }, [orders]);

  const columns = useMemo(
    () =>
      pipelineStages.map((stage) => ({
        ...stage,
        orders: orders.filter((o) => o.workflowStage === stage.value),
      })),
    [orders],
  );

  const sortedOrders = useMemo(
    () =>
      [...orders].sort(
        (a, b) =>
          (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) -
          (b.dueDate ? new Date(b.dueDate).getTime() : Infinity),
      ),
    [orders],
  );

  return (
    <div className="min-h-full bg-background p-3 text-foreground lg:p-5">
      <div className="mx-auto max-w-[1400px] space-y-4">
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Workflow Tracker
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Track orders from confirmation to PO placement
            </p>
          </div>
          <div className="flex h-9 w-full max-w-xs items-center rounded-lg border border-border bg-card px-3">
            <Search className="mr-2 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadOrders()}
              placeholder="Search order, PO, customer..."
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </header>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Summary
            icon={<ShoppingCart className="h-4 w-4" />}
            title="Total Orders"
            value={stats.total}
            note="All orders in view"
            cls="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          />
          <Summary
            icon={<Clock3 className="h-4 w-4" />}
            title="In Progress"
            value={stats.inProgress}
            note="Awaiting completion"
            cls="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          />
          <Summary
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Completed"
            value={stats.completed}
            note="PO placed"
            cls="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          />
          <Summary
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Overdue"
            value={stats.overdue}
            note="Past due date"
            cls="bg-red-500/10 text-red-600 dark:text-red-400"
          />
        </div>

        {/* PIPELINE BOARD */}
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Pipeline</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Drag an order card to move it to another stage
              </p>
            </div>
          </div>

          <div className="w-full overflow-x-auto pb-2">
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="flex min-w-max gap-3">
                {columns.map((column) => (
                  <PipelineColumn
                    key={column.value}
                    stage={column}
                    onSelect={handleSelectOrder}
                  />
                ))}
              </div>
            </DndContext>
          </div>
        </section>

        {/* ALL ORDERS + ORDER DETAIL */}
        <div className="space-y-4">
          {/* ALL ORDERS */}
          <section className="rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">All Orders</h2>
              <span className="text-xs text-muted-foreground">
                {orders.length} order{orders.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-2.5">Order / PO</th>
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Value</th>
                    <th className="px-4 py-2.5">Stage</th>
                    <th className="px-4 py-2.5">Next Action</th>
                    <th className="px-4 py-2.5">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-xs text-muted-foreground"
                      >
                        Loading workflow...
                      </td>
                    </tr>
                  ) : !sortedOrders.length ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-xs text-muted-foreground"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    sortedOrders.map((order) => {
                      const isOverdue = overdue(order.dueDate);
                      return (
                        <tr
                          key={order.id}
                          onClick={() => handleSelectOrder(order)}
                          className={`cursor-pointer border-b border-border last:border-0 ${
                            selectedOrder?.id === order.id
                              ? "bg-muted/60"
                              : "hover:bg-muted/30"
                          }`}
                        >
                          <td className="px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {order.dveplCode}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground/80">
                            {order.partyName || order.caNo || "—"}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-foreground/80">
                            {order.grandTotal
                              ? "₹" +
                                Number(order.grandTotal).toLocaleString(
                                  "en-IN",
                                  { maximumFractionDigits: 0 },
                                )
                              : "—"}
                          </td>
                          <td className="px-4 py-2.5">
                            <select
                              value={order.workflowStage}
                              disabled={
                                updatingOrderId === order.id || !canEdit
                              }
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                void handleStageChange(
                                  order.id,
                                  event.target.value as WorkflowStage,
                                )
                              }
                              aria-label={`Change stage for ${order.dveplCode}`}
                              className={`h-7 min-w-[130px] cursor-pointer rounded-md border px-1.5 text-[11px] font-medium ${stageStyles[order.workflowStage].chip} ${updatingOrderId === order.id ? "cursor-wait opacity-60" : ""}`}
                            >
                              {pipelineStages.map((stage) => (
                                <option
                                  key={stage.value}
                                  value={stage.value}
                                  className="bg-card text-foreground"
                                >
                                  {stage.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="max-w-[180px] truncate px-4 py-2.5 text-xs text-foreground/80">
                            {order.nextAction || "—"}
                          </td>
                          <td
                            className={`px-4 py-2.5 text-xs ${isOverdue ? "font-semibold text-red-500" : "text-muted-foreground"}`}
                          >
                            {isOverdue && (
                              <span className="mr-1.5 inline-block rounded bg-red-500/10 px-1 py-0.5 text-[10px] font-semibold text-red-500">
                                Overdue
                              </span>
                            )}
                            {formatDate(order.dueDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ORDER DETAIL */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:p-6">
            {selectedOrder ? (
              <OrderDetail
                order={selectedOrder}
                timeline={timeline}
                loadingTimeline={loadingTimeline}
                updating={updatingOrderId === selectedOrder.id}
                canEdit={canEdit}
                onBack={() => setSelectedOrder(null)}
                onMarkAsDone={() => void handleMarkAsDone()}
                onOpenReminder={openReminder}
              />
            ) : (
              <Empty text="Select an order to view its details and workflow history." />
            )}
          </section>
        </div>
      </div>

      {/* REMINDER DIALOG */}
      <Dialog
        open={reminderOpen}
        onOpenChange={(open) => {
          if (!open && !savingReminder) setReminderOpen(false);
        }}
      >
        <DialogContent className="overflow-hidden rounded-xl p-0 sm:max-w-md">
          <DialogHeader className="border-b bg-muted/30 px-6 py-4">
            <DialogTitle className="text-base font-bold">
              {selectedOrder?.dveplCode || "Order"} — Follow Up
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Set the next action, due date, and notes for this order.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveReminder} className="space-y-4 p-6">
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Next Action
              </Label>
              <Input
                value={reminderForm.nextAction}
                onChange={(e) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    nextAction: e.target.value,
                  }))
                }
                placeholder="e.g. Follow up with customer for drawings"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Due Date
              </Label>
              <Input
                type="date"
                value={reminderForm.dueDate}
                onChange={(e) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">
                Notes
              </Label>
              <Textarea
                value={reminderForm.description}
                onChange={(e) =>
                  setReminderForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Optional note recorded in workflow history"
                className="text-xs"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReminderOpen(false)}
                disabled={savingReminder}
                className="h-9 rounded-lg text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={savingReminder}
                className="h-9 rounded-lg text-xs font-bold"
              >
                {savingReminder ? "Saving..." : "Save Reminder"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Summary({
  icon,
  title,
  value,
  note,
  cls,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  note: string;
  cls: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-0.5 text-2xl font-semibold tracking-tight">
            {value}
          </div>
          <div className="text-[10px] text-muted-foreground">{note}</div>
        </div>
      </div>
    </div>
  );
}

function OrderDetail({
  order,
  timeline,
  loadingTimeline,
  updating,
  canEdit,
  onBack,
  onMarkAsDone,
  onOpenReminder,
}: {
  order: WorkflowOrder;
  timeline: WorkflowEvent[];
  loadingTimeline: boolean;
  updating: boolean;
  canEdit: boolean;
  onBack: () => void;
  onMarkAsDone: () => void;
  onOpenReminder: () => void;
}) {
  const isOverdue = overdue(order.dueDate);

  return (
    <div>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <button
            onClick={onBack}
            className="mb-2 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
          >
            ‹ Back to orders
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{order.dveplCode}</h2>
            <StageChip stage={order.workflowStage} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {order.partyName || order.caNo || "—"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={onOpenReminder}>
            <Send className="h-3.5 w-3.5" /> Reminder
          </Button>
          <Button
            size="sm"
            onClick={onMarkAsDone}
            disabled={updating || !canEdit}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Mark as Done
          </Button>
        </div>
      </div>

      {/* Pipeline progress */}
      <PipelineProgress current={order.workflowStage} />

      {/* Quick info */}
      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <InfoBox label="Next Action" value={order.nextAction || "No action"} />
        <InfoBox
          label="Due Date"
          value={formatDate(order.dueDate)}
          alert={isOverdue}
        />
        <InfoBox
          label="Order Value"
          value={
            order.grandTotal
              ? "₹" +
                Number(order.grandTotal).toLocaleString("en-IN", {
                  maximumFractionDigits: 0,
                })
              : "—"
          }
        />
        <InfoBox
          label="Status"
          value={isOverdue ? "Overdue" : "On Track"}
          alert={isOverdue}
        />
      </div>

      {/* Workflow history */}
      <div className="mt-6">
        <h3 className="mb-3 text-sm font-semibold">Activity History</h3>
        {loadingTimeline ? (
          <div className="py-4 text-center text-xs text-muted-foreground">
            Loading activity...
          </div>
        ) : timeline.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {timeline.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3"
              >
                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${stageStyles[event.stage].dot}`}
                />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground">
                    {event.title}
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${stageStyles[event.stage].chip}`}
                    >
                      {stageLabel(event.stage)}
                    </span>
                  </div>
                  {event.description && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      {event.description}
                    </div>
                  )}
                  <div className="mt-1 text-[10px] text-muted-foreground">
                    {formatDate(event.createdAt)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-xs text-muted-foreground">
            No workflow activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 truncate text-xs font-medium ${
          alert ? "text-red-500" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PipelineProgress({ current }: { current: WorkflowStage }) {
  const currentIndex = Math.max(
    0,
    pipelineStages.findIndex((s) => s.value === current),
  );
  const total = pipelineStages.length;
  const percent = Math.round((currentIndex / (total - 1)) * 100);
  const isDone = currentIndex === total - 1;

  return (
    <div className="rounded-xl border border-border bg-muted/10 p-4 lg:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Workflow Progress
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isDone
              ? "This order has completed all stages."
              : `Currently at "${stageLabel(current)}" — ${total - 1 - currentIndex} stage${total - 1 - currentIndex === 1 ? "" : "s"} remaining.`}
          </p>
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold ${
            isDone
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
          }`}
        >
          {isDone ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> 100% Done
            </>
          ) : (
            <>
              <Clock3 className="h-4 w-4" /> {percent}% Complete
            </>
          )}
        </div>
      </div>

      {/* Pipe */}
      <div className="overflow-x-auto">
        <div className="min-w-[680px]">
          <div className="flex items-center gap-1">
            {pipelineStages.map((stage, i) => {
              const completed = i < currentIndex;
              const active = i === currentIndex;
              return (
                <div key={stage.value} className="flex flex-1 items-center gap-1">
                  <div
                    className={`h-2.5 flex-1 rounded-full transition-colors ${
                      completed
                        ? "bg-emerald-500"
                        : active
                          ? "bg-blue-500/70"
                          : "bg-border"
                    }`}
                  />
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      completed
                        ? "border-emerald-500 bg-emerald-500 text-white"
                        : active
                          ? "border-blue-500 bg-blue-500 text-white"
                          : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-2.5 w-2.5" />
                    ) : active ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : null}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Stage labels */}
          <div className="mt-2 flex items-center">
            {pipelineStages.map((stage, i) => (
              <div
                key={stage.value}
                className={`flex-1 text-center text-[10px] font-medium leading-tight ${
                  i === currentIndex
                    ? "text-blue-600 dark:text-blue-400"
                    : i < currentIndex
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                }`}
              >
                {stage.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PipelineColumn({
  stage,
  onSelect,
}: {
  stage: { value: WorkflowStage; label: string; orders: WorkflowOrder[] };
  onSelect: (order: WorkflowOrder) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage:${stage.value}`,
  });
  const overdueCount = stage.orders.filter((o) => overdue(o.dueDate)).length;

  return (
    <div
      ref={setNodeRef}
      className={`flex w-[230px] shrink-0 flex-col rounded-xl border p-2 transition-all ${
        isOver
          ? "border-emerald-500/60 bg-emerald-500/5 ring-2 ring-emerald-500/20"
          : "border-border bg-muted/20"
      }`}
    >
      <div className="flex items-center justify-between px-1.5 py-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`h-2 w-2 rounded-full ${stageStyles[stage.value].dot}`}
          />
          <span className="text-xs font-semibold text-foreground">
            {stage.label}
          </span>
        </div>
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${stageStyles[stage.value].chip}`}
        >
          {stage.orders.length}
        </span>
      </div>

      {overdueCount > 0 && (
        <div className="mb-1 px-1.5 text-[10px] font-medium text-red-500">
          {overdueCount} overdue
        </div>
      )}

      <div className="space-y-2">
        {stage.orders.map((order) => (
          <PipelineCard key={order.id} order={order} onSelect={onSelect} />
        ))}
        {!stage.orders.length && (
          <div
            className={`rounded-lg border border-dashed px-2 py-6 text-center text-[11px] text-muted-foreground ${
              isOver ? "border-emerald-500/60" : "border-border"
            }`}
          >
            {isOver ? "Drop here" : "No orders"}
          </div>
        )}
      </div>
    </div>
  );
}

function PipelineCard({
  order,
  onSelect,
}: {
  order: WorkflowOrder;
  onSelect: (order: WorkflowOrder) => void;
}) {
  const isOverdue = overdue(order.dueDate);
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `order:${order.id}` });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={() => onSelect(order)}
      {...attributes}
      {...listeners}
      style={{
        transform: transform
          ? `translate(${transform.x}px, ${transform.y}px)`
          : undefined,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 40 : undefined,
        position: "relative",
        touchAction: "none",
      }}
      className="group w-full cursor-grab rounded-lg border border-border bg-card p-2.5 text-left shadow-sm transition-all hover:-translate-y-px hover:border-emerald-500/40 hover:bg-muted/20 active:cursor-grabbing"
    >
      <span className="absolute right-2 top-2 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
        <GripVertical className="h-3 w-3" />
      </span>

      <div className="pr-4">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {order.dveplCode}
          </span>
          {isOverdue && (
            <span className="shrink-0 rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-red-500">
              Overdue
            </span>
          )}
        </div>
      </div>

      <p className="mt-1.5 line-clamp-2 text-[11px] leading-4 text-foreground/80">
        {order.nextAction || "No action assigned"}
      </p>

      <div className="mt-2 flex items-center gap-1 border-t border-border pt-1.5 text-[10px] text-muted-foreground">
        <CalendarDays className="h-3 w-3 shrink-0" />
        <span className="truncate">
          {order.dueDate ? formatDate(order.dueDate) : "No due date"}
        </span>
      </div>
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-10 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}