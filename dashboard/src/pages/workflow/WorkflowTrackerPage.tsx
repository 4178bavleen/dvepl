import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  ListFilter,
  MoreVertical,
  Plus,
  Search,
  Send,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import workflowApi, {
  WorkflowOrder,
  WorkflowStage,
} from "@/services/workflowApi";
import { useERPStore } from "@/store/erpStore";
import { canPerformPageAction } from "@/utils/pagePermissions";

const stages: { value: WorkflowStage | "ALL"; label: string }[] = [
  { value: "ALL", label: "All Orders" },
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

const pipelineStages = stages.filter((s) => s.value !== "ALL");

function stageLabel(stage: WorkflowStage) {
  return (
    stages.find((s) => s.value === stage)?.label || stage.replace(/_/g, " ")
  );
}

function stageClass(stage: WorkflowStage) {
  switch (stage) {
    case "ORDER_CONFIRMED":
      return "bg-blue-500/15 text-blue-400 border-blue-500/20";
    case "PO_READY":
      return "bg-violet-500/15 text-violet-400 border-violet-500/20";
    case "DRAWING_ASSIGNED":
    case "DRAWING_SENT":
      return "bg-purple-500/15 text-purple-400 border-purple-500/20";
    case "REVISION_REQUIRED":
      return "bg-orange-500/15 text-orange-400 border-orange-500/20";
    case "DRAWING_APPROVED":
    case "PO_PLACED":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/20";
    default:
      return "bg-amber-500/15 text-amber-400 border-amber-500/20";
  }
}

function dotClass(stage: WorkflowStage) {
  if (stage === "ORDER_CONFIRMED") return "bg-blue-500";
  if (stage === "PO_READY") return "bg-violet-500";
  if (stage === "DRAWING_ASSIGNED" || stage === "DRAWING_SENT")
    return "bg-purple-500";
  if (stage === "REVISION_REQUIRED") return "bg-orange-500";
  if (stage === "DRAWING_APPROVED" || stage === "PO_PLACED")
    return "bg-green-500";
  return "bg-amber-500";
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function overdue(value?: string | Date | null) {
  return !!value && new Date(value).getTime() < Date.now();
}

export default function WorkflowTrackerPage() {
  const store = useERPStore();
  const currentUser = store.users?.find((u: any) => u.id === store.currentUserId) as any;
  const canEdit = canPerformPageAction(currentUser?.actionPermissions, "workflow_tracker", "edit");
  const [orders, setOrders] = useState<WorkflowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<WorkflowStage | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkflowOrder | null>(
    null,
  );
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [selectedStage, setSelectedStage] = useState<WorkflowStage | null>(
    null,
  );

  const handleStageSelect = (stage: WorkflowStage) => {
    setSelectedStage((current) => (current === stage ? null : stage));
  };

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workflowApi.getOrders({
        stage: activeStage === "ALL" ? undefined : activeStage,
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
    } finally {
      setLoading(false);
    }
  }, [activeStage, search]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleStageChange = async (orderId: string, stage: WorkflowStage) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.workflowStage === stage || updatingOrderId === orderId)
      return;

    try {
      setUpdatingOrderId(orderId);
      await workflowApi.updateOrderWorkflowStage(orderId, stage);
      await loadOrders();
    } catch (error) {
      console.error("Failed to update workflow stage:", error);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const poInProgress = orders.filter((o) =>
      ["PO_PLACED", "INVENTORY_FOLLOW_UP", "PRODUCTION_FOLLOW_UP"].includes(
        o.workflowStage,
      ),
    ).length;
    const completed = orders.filter(
      (o) => o.workflowStage === "PO_PLACED",
    ).length;
    const overdueCount = orders.filter((o) => overdue(o.dueDate)).length;
    const pending = Math.max(total - completed - overdueCount, 0);
    return { total, poInProgress, pending, completed, overdue: overdueCount };
  }, [orders]);

  const columns = useMemo(
    () =>
      pipelineStages.map((stage) => ({
        ...stage,
        orders: orders.filter((o) => o.workflowStage === stage.value),
      })),
    [orders],
  );

  const reminders = useMemo(
    () =>
      [...orders]
        .filter((o) => o.nextAction)
        .sort(
          (a, b) =>
            new Date(a.dueDate || "9999-12-31").getTime() -
            new Date(b.dueDate || "9999-12-31").getTime(),
        )
        .slice(0, 5),
    [orders],
  );

  const followUps = orders.filter((o) =>
    [
      "REVISION_REQUIRED",
      "INVENTORY_FOLLOW_UP",
      "PRODUCTION_FOLLOW_UP",
    ].includes(o.workflowStage),
  ).length;

  const poOrders = orders
    .filter((o) =>
      ["PO_PLACED", "INVENTORY_FOLLOW_UP", "PRODUCTION_FOLLOW_UP"].includes(
        o.workflowStage,
      ),
    )
    .slice(0, 5);

  return (
    <div className="min-h-full bg-background text-foreground p-3 lg:p-5">
      <div className="mx-auto max-w-[1540px] space-y-4">
        {/* HEADER — deliberately compact like the reference */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[23px] font-semibold tracking-[-0.02em] text-foreground">
              Workflow Tracker
            </h1>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              Track your orders, POs and follow ups
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-9 w-[245px] items-center rounded-lg border border-border bg-card px-3 shadow-[0_1px_2px_rgba(0,0,0,.02)] md:flex">
              <Search className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void loadOrders()}
                placeholder="Search orders, POs, customers..."
                className="w-full bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/75 text-foreground"
              />
              <button
                onClick={() => void loadOrders()}
                className="text-muted-foreground hover:text-foreground"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-[11px] text-foreground hover:bg-muted/50">
              <CalendarDays className="h-3.5 w-3.5" /> This Month{" "}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-foreground hover:bg-muted/50">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute right-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#3f8d32] text-[10px] text-white">
                3
              </span>
            </button>
            {/* <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#3f8d32] px-3.5 text-[11px] font-semibold text-white shadow-sm">
              <Plus className="h-3.5 w-3.5" /> New Order
            </button> */}
          </div>
        </header>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          <Summary
            icon={<ShoppingCart className="h-4 w-4" />}
            title="Total Orders"
            value={stats.total}
            note="Current view"
            cls="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <Summary
            icon={<Clock3 className="h-4 w-4" />}
            title="POs in Progress"
            value={stats.poInProgress}
            note="PO / stock workflow"
            cls="bg-violet-500/15 text-violet-600 dark:text-violet-400"
          />
          <Summary
            icon={<Clock3 className="h-4 w-4" />}
            title="Pending"
            value={stats.pending}
            note="Needs attention"
            cls="bg-amber-500/15 text-amber-600 dark:text-amber-400"
          />
          <Summary
            icon={<CheckCircle2 className="h-4 w-4" />}
            title="Completed"
            value={stats.completed}
            note="PO placed"
            cls="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          />
          <Summary
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Overdue"
            value={stats.overdue}
            note="Past due date"
            cls="bg-red-500/15 text-red-600 dark:text-red-400"
          />
        </div>

        {/* MAIN REFERENCE GRID */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">
          {/* PIPELINE */}
          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            {/* Pipeline Header */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-foreground">
                  Pipeline View
                </h2>

                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Move through your actual order workflow
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="flex h-7 items-center gap-1 rounded-md border border-border bg-card hover:bg-muted/50 px-2 text-[12px] text-foreground"
                >
                  Group by: <b>Status</b>
                  <ChevronDown className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted/50"
                >
                  <Filter className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  className="hidden h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[12px] text-foreground hover:bg-muted/50 md:flex"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Customize
                </button>
              </div>
            </div>

            {/* Selected Stage Bar */}
            {selectedStage && (
              <div className="mb-3 flex items-center justify-between rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#3f8d32]" />

                  <span className="text-[12px] text-muted-foreground">
                    Viewing stage:
                  </span>

                  <span className="truncate text-[10px] font-semibold text-foreground">
                    {columns.find((column) => column.value === selectedStage)
                      ?.label || "Selected Stage"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedStage(null)}
                  className="shrink-0 text-[12px] font-semibold text-[#3d8b2f] transition-colors hover:text-[#2f7028] hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {/* Pipeline Board - Read Only */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex min-w-max gap-3">
                {columns.map((column) => (
                  <PipelineColumn
                    key={column.value}
                    stage={column}
                    onSelect={setSelectedOrder}
                    onStageSelect={handleStageSelect}
                    selectedStage={selectedStage}
                  />
                ))}
              </div>
            </div>
          </section>

          {/* UPCOMING + FOLLOWUP */}
          <div className="grid gap-3">
            <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Upcoming Reminders
                </h2>
                <button className="text-[12px] font-semibold text-[#3f8d32] hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-0.5">
                {reminders.length ? (
                  reminders.map((order) => (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left hover:bg-muted/40"
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${overdue(order.dueDate) ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
                      >
                        {overdue(order.dueDate) ? (
                          <AlertTriangle className="h-3.5 w-3.5" />
                        ) : (
                          <Bell className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[10px] font-semibold text-foreground">
                          {order.dveplCode}
                        </span>
                        <span className="mt-0.5 block truncate text-[12px] text-muted-foreground">
                          {order.nextAction || "Follow up"}
                        </span>
                      </span>
                      <span className="text-right">
                        <span
                          className={`block text-[12px] font-semibold ${overdue(order.dueDate) ? "text-red-400" : "text-emerald-500"}`}
                        >
                          {overdue(order.dueDate) ? "Overdue" : "Upcoming"}
                        </span>
                        <span className="block text-[8px] text-muted-foreground">
                          {formatDate(order.dueDate)}
                        </span>
                      </span>
                    </button>
                  ))
                ) : (
                  <Empty text="No upcoming reminders" />
                )}
              </div>
            </section>

            <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-foreground">
                  Follow Up Summary
                </h2>
                <button className="rounded-md bg-muted px-2 py-1 text-[8px] text-muted-foreground hover:bg-muted/80">
                  This Month <ChevronDown className="inline h-2.5 w-2.5" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="relative h-[88px] w-[88px] shrink-0 rounded-full"
                  style={{
                    background: `conic-gradient(#3f8d32 0 42%, #8fc27f 42% 67%, #e7a51f 67% 84%, #e7ebe6 84% 100%)`,
                  }}
                >
                  <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-card">
                    <span className="text-[18px] font-semibold text-foreground">
                      {followUps}
                    </span>
                    <span className="text-[8px] text-muted-foreground">Total</span>
                  </div>
                </div>
                <div className="space-y-2 text-[12px] text-muted-foreground">
                  <Legend label="Today" value={Math.min(followUps, 5)} />
                  <Legend
                    label="This Week"
                    value={Math.max(followUps - 5, 0)}
                  />
                  <Legend label="Overdue" value={stats.overdue} />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ALL ORDERS + FOLLOW-UP SUMMARY — reference table density */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">
          <section className="rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
              <h2 className="text-[13px] font-semibold text-foreground">
                All Orders
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-[175px] items-center rounded-md border border-border bg-background px-2">
                  <Search className="mr-1.5 h-3 w-3 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && void loadOrders()}
                    placeholder="Search..."
                    className="w-full bg-transparent text-[12px] outline-none text-foreground"
                  />
                </div>
                <button className="flex h-7 items-center gap-1 rounded-md border border-border bg-card hover:bg-muted/50 px-2 text-[12px] text-foreground">
                  <ListFilter className="h-3 w-3" /> Columns
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-muted/30">
                  <tr className="text-left text-[8px] font-medium text-muted-foreground">
                    <th className="px-3.5 py-2.5">Order / PO No.</th>
                    <th className="px-3.5 py-2.5">Customer / Vendor</th>
                    <th className="px-3.5 py-2.5">Order Value</th>
                    <th className="px-3.5 py-2.5">Current Stage</th>
                    <th className="px-3.5 py-2.5">Next Action</th>
                    <th className="px-3.5 py-2.5">Due Date</th>
                    <th className="px-3.5 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-[10px] text-muted-foreground"
                      >
                        Loading workflow...
                      </td>
                    </tr>
                  ) : !orders.length ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-[10px] text-muted-foreground"
                      >
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.slice(0, 7).map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => setSelectedOrder(order)}
                        className={`cursor-pointer border-t border-border ${selectedOrder?.id === order.id ? "bg-muted" : "hover:bg-muted/40"}`}
                      >
                        <td className="px-3.5 py-2.5 text-[12px] font-semibold text-[#3f8d32]">
                          {order.dveplCode}
                        </td>
                        <td className="px-3.5 py-2.5 text-[12px] text-foreground/80">
                          Customer / Vendor
                        </td>
                        <td className="px-3.5 py-2.5 text-[12px] text-foreground/80">
                          -
                        </td>
                        <td className="px-3.5 py-2.5">
                          <select
                            value={order.workflowStage}
                            disabled={updatingOrderId === order.id || !canEdit}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(event) =>
                              void handleStageChange(
                                order.id,
                                event.target.value as WorkflowStage,
                              )
                            }
                            aria-label={`Change workflow stage for ${order.dveplCode}`}
                            className={`h-7 min-w-[130px] rounded-md border px-1.5 text-[8px] font-medium ${stageClass(order.workflowStage)} ${updatingOrderId === order.id ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                          >
                            {pipelineStages.map((stage) => (
                              <option key={stage.value} value={stage.value} className="bg-card text-foreground">
                                {stage.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3.5 py-2.5 text-[12px] text-foreground/80">
                          {order.nextAction || "Follow up"}
                        </td>
                        <td
                          className={`px-3.5 py-2.5 text-[12px] ${overdue(order.dueDate) ? "font-semibold text-red-400" : "text-muted-foreground"}`}
                        >
                          {formatDate(order.dueDate)}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[8px] font-medium ${overdue(order.dueDate) ? "bg-red-950/40 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
                          >
                            {overdue(order.dueDate) ? "Overdue" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                Follow Up Analytics
              </h2>
              <button className="text-muted-foreground hover:text-foreground">×</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Mini label="Total" value={followUps} />
              <Mini label="Completed" value={stats.completed} />
              <Mini
                label="Pending"
                value={Math.max(followUps - stats.completed, 0)}
              />
              <Mini label="Overdue" value={stats.overdue} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <div className="mb-2 text-[12px] font-semibold text-foreground/90">
                  Follow Up Trend
                </div>
                <div className="flex h-[85px] items-end gap-1">
                  {[30, 44, 38, 55, 49, 67, 58, 76, 63, 80, 71, 86].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-[#8fc27f]"
                        style={{ height: `${h}%` }}
                      />
                    ),
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>1 Aug</span>
                  <span>10 Aug</span>
                  <span>20 Aug</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="rounded-lg border border-border p-3 bg-muted/20">
                <div className="mb-2 text-[12px] font-semibold text-foreground/90">
                  By Status
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="relative h-[78px] w-[78px] rounded-full"
                    style={{
                      background:
                        "conic-gradient(#3f8d32 0 61%, #e7a51f 61% 86%, #e05a50 86% 100%)",
                    }}
                  >
                    <div className="absolute inset-[12px] rounded-full bg-card" />
                  </div>
                  <div className="space-y-1.5 text-[8px] text-muted-foreground">
                    <Legend label="Completed" value={stats.completed} />
                    <Legend
                      label="Pending"
                      value={Math.max(followUps - stats.completed, 0)}
                    />
                    <Legend label="Overdue" value={stats.overdue} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* DETAIL + PO TRACKING */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">
          <section className="rounded-xl border border-border bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <button className="mb-2 text-[12px] font-semibold text-[#3f8d32] hover:underline">
                  ‹ Back
                </button>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    {selectedOrder?.dveplCode || "Select an order"}
                  </h2>
                  {selectedOrder && (
                    <span
                      className={`rounded-md border px-1.5 py-0.5 text-[8px] font-medium ${stageClass(selectedOrder.workflowStage)}`}
                    >
                      {overdue(selectedOrder.dueDate) ? "Overdue" : "Pending"}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Order workflow details and activity
                </p>
              </div>
              {selectedOrder && (
                <div className="flex items-center gap-1.5">
                  <button className="flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[12px] text-foreground hover:bg-muted/50">
                    <Send className="h-3 w-3" /> Send Reminder
                  </button>
                  <button className="flex h-7 items-center gap-1 rounded-md bg-[#3f8d32] px-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#3f8d32]/90">
                    <Bell className="h-3 w-3" /> Follow Up
                  </button>
                  <button className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted/50">
                    <MoreVertical className="h-3 w-3" />
                  </button>
                </div>
              )}
            </div>

            {selectedOrder ? (
              <>
                {/* Workflow Summary */}
                <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-border pb-3 text-[12px] text-muted-foreground">
                  <span>
                    Current Stage{" "}
                    <b className="ml-1 font-semibold text-foreground">
                      {stageLabel(selectedOrder.workflowStage)}
                    </b>
                  </span>

                  <span>
                    Next Action{" "}
                    <b className="ml-1 font-semibold text-foreground">
                      {selectedOrder.nextAction || "No action assigned"}
                    </b>
                  </span>

                  <span>
                    Due Date{" "}
                    <b
                      className={`ml-1 font-semibold ${
                        overdue(selectedOrder.dueDate)
                          ? "text-red-400"
                          : "text-foreground"
                      }`}
                    >
                      {formatDate(selectedOrder.dueDate)}
                    </b>
                  </span>

                  <span>
                    Workflow Status{" "}
                    <b className="ml-1 font-semibold text-foreground">
                      {overdue(selectedOrder.dueDate) ? "Overdue" : "On Track"}
                    </b>
                  </span>
                </div>

                {/* Workflow Timeline */}
                <Timeline current={selectedOrder.workflowStage} />

                {/* Workflow Actions */}
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <Action
                    title="Next Action"
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    value={selectedOrder.nextAction || "No action assigned"}
                    sub={
                      selectedOrder.dueDate
                        ? overdue(selectedOrder.dueDate)
                          ? `Overdue · Due ${formatDate(selectedOrder.dueDate)}`
                          : `Due ${formatDate(selectedOrder.dueDate)}`
                        : "No due date"
                    }
                    button="✓ Mark as Done"
                  />

                  <Action
                    title="Reminders"
                    icon={<Bell className="h-3.5 w-3.5" />}
                    value="Follow up with customer"
                    sub={
                      selectedOrder.dueDate
                        ? `Due ${formatDate(selectedOrder.dueDate)}`
                        : "No reminder date"
                    }
                    button="Add Reminder"
                  />

                  <Action
                    title="Activity Timeline"
                    icon={<Clock3 className="h-3.5 w-3.5" />}
                    value="Workflow updated"
                    sub={
                      selectedOrder.workflowUpdatedAt
                        ? formatDate(selectedOrder.workflowUpdatedAt)
                        : "No activity recorded"
                    }
                  />
                </div>
              </>
            ) : (
              <Empty text="Select an order from the table to see its workflow." />
            )}
          </section>

          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                PO Tracking
              </h2>
              <button className="text-[12px] text-[#3f8d32] hover:underline">View All</button>
            </div>
            <div className="mb-2.5 flex h-7 items-center rounded-md border border-border bg-background px-2">
              <Search className="mr-1.5 h-3 w-3 text-muted-foreground" />
              <input
                placeholder="Search POs..."
                className="w-full bg-transparent text-[12px] outline-none text-foreground"
              />
              <Filter className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="overflow-hidden rounded-md border border-border bg-muted/10">
              <table className="w-full">
                <thead className="bg-muted/40 text-left text-[10px] text-muted-foreground">
                  <tr>
                    <th className="px-2 py-2">PO No.</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Due</th>
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {poOrders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer border-t border-border hover:bg-muted/40"
                    >
                      <td className="px-2 py-2 text-[8px] font-semibold text-[#3f8d32]">
                        {order.dveplCode}
                      </td>
                      <td className="px-2 py-2">
                        <span
                          className={`rounded px-1 py-0.5 text-[10px] ${stageClass(order.workflowStage)}`}
                        >
                          {stageLabel(order.workflowStage)}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-[8px] text-muted-foreground">
                        {formatDate(order.dueDate)}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <Bell className="ml-auto h-2.5 w-2.5 text-muted-foreground" />
                      </td>
                    </tr>
                  ))}
                  {!poOrders.length && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-2 py-7 text-center text-[8px] text-muted-foreground"
                      >
                        No PO records yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* BOTTOM REFERENCE STRIP */}
        <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr_1fr]">
          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                Reminders
              </h2>
              <button className="flex h-7 items-center gap-1 rounded-md bg-[#3f8d32] px-2.5 text-[12px] font-semibold text-white shadow-sm hover:bg-[#3f8d32]/90">
                <Plus className="h-3 w-3" /> New Reminder
              </button>
            </div>
            <div className="mb-2.5 flex gap-3 border-b border-border text-[8px]">
              {["All", "Today", "This Week", "This Month", "Overdue"].map(
                (tab, i) => (
                  <button
                    key={tab}
                    className={`pb-2 ${i === 0 ? "border-b-2 border-[#3f8d32] font-semibold text-[#3f8d32]" : "text-muted-foreground"}`}
                  >
                    {tab}
                  </button>
                ),
              )}
            </div>
            {reminders.slice(0, 4).map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-border py-2 last:border-0"
              >
                <div>
                  <div className="text-[12px] font-medium text-foreground/90">
                    {order.nextAction || "Follow up"}
                  </div>
                  <div className="mt-0.5 text-[10px] text-muted-foreground">
                    {order.dveplCode}
                  </div>
                </div>
                <div
                  className={`text-[8px] ${overdue(order.dueDate) ? "text-red-400" : "text-emerald-500"}`}
                >
                  {formatDate(order.dueDate)}
                </div>
                <Bell className="h-2.5 w-2.5 text-muted-foreground" />
              </div>
            ))}
            {!reminders.length && <Empty text="No reminders" />}
          </section>

          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                Workflow Summary
              </h2>
              <button className="text-[12px] text-[#3f8d32] hover:underline">
                This Month <ChevronDown className="inline h-2.5 w-2.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <Mini label="Total Orders" value={stats.total} />
              <Mini label="POs in Progress" value={stats.poInProgress} />
              <Mini label="Pending" value={stats.pending} />
              <Mini label="Overdue" value={stats.overdue} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="mb-2 text-[12px] font-semibold text-foreground/90">
                  Follow Up Trend
                </div>
                <div className="flex h-[70px] items-end gap-1">
                  {[28, 42, 37, 55, 47, 64, 58, 76, 62, 80, 69, 84].map(
                    (h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t bg-[#8fc27f]"
                        style={{ height: `${h}%` }}
                      />
                    ),
                  )}
                </div>
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
                  <span>1 Aug</span>
                  <span>10 Aug</span>
                  <span>20 Aug</span>
                  <span>Today</span>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="mb-2 text-[12px] font-semibold text-foreground/90">
                  By Status
                </div>
                <div className="flex items-center gap-3">
                  <div
                    className="relative h-[70px] w-[70px] rounded-full"
                    style={{
                      background:
                        "conic-gradient(#3f8d32 0 61%,#e7a51f 61% 84%,#e05a50 84% 100%)",
                    }}
                  >
                    <div className="absolute inset-[11px] rounded-full bg-card" />
                  </div>
                  <div className="space-y-1.5 text-[8px] text-muted-foreground">
                    <Legend label="Completed" value={stats.completed} />
                    <Legend label="Pending" value={stats.pending} />
                    <Legend label="Overdue" value={stats.overdue} />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-3.5 shadow-[0_1px_3px_rgba(0,0,0,.035)] text-card-foreground">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-foreground">
                Workflow Stages
              </h2>
              <button className="text-[12px] text-[#3f8d32] hover:underline">View All</button>
            </div>
            <div className="space-y-1.5">
              {columns.slice(0, 6).map((stage) => (
                <button
                  key={stage.value}
                  onClick={() => setActiveStage(stage.value as WorkflowStage)}
                  className="flex w-full items-center justify-between rounded-md border border-border px-2.5 py-2 text-left bg-muted/30 hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${dotClass(stage.value as WorkflowStage)}`}
                    />
                    <span className="text-[8px] text-foreground/80">
                      {stage.label}
                    </span>
                  </span>
                  <span className="text-[8px] font-semibold text-foreground">
                    {stage.orders.length}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
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
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm text-card-foreground">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}
        >
          {icon}
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          <div className="mt-1 text-[10px] text-muted-foreground">{note}</div>
        </div>
      </div>
    </div>
  );
}

const stageHeaderStyles: Record<
  WorkflowStage,
  {
    dot: string;
    bg: string;
    border: string;
    text: string;
    soft: string;
  }
> = {
  ORDER_CONFIRMED: {
    dot: "bg-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    soft: "bg-blue-500/20",
  },

  PO_READY: {
    dot: "bg-violet-500",
    bg: "bg-violet-500/10",
    border: "border-violet-500/20",
    text: "text-violet-400",
    soft: "bg-violet-500/20",
  },

  DRAWING_ASSIGNED: {
    dot: "bg-purple-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    soft: "bg-purple-500/20",
  },

  DRAWING_SENT: {
    dot: "bg-indigo-500",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    text: "text-indigo-400",
    soft: "bg-indigo-500/20",
  },

  REVISION_REQUIRED: {
    dot: "bg-orange-500",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    soft: "bg-orange-500/20",
  },

  DRAWING_APPROVED: {
    dot: "bg-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    soft: "bg-green-500/20",
  },

  PO_PLACED: {
    dot: "bg-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-400",
    soft: "bg-emerald-500/20",
  },

  INVENTORY_FOLLOW_UP: {
    dot: "bg-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-400",
    soft: "bg-amber-500/20",
  },

  PRODUCTION_FOLLOW_UP: {
    dot: "bg-cyan-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    text: "text-cyan-400",
    soft: "bg-cyan-500/20",
  },
};
function PipelineColumnHeader({
  stage,
  selectedStage,
  onStageSelect,
}: {
  stage: {
    value: WorkflowStage | "ALL";
    label: string;
    orders: WorkflowOrder[];
  };
  selectedStage: WorkflowStage | null;
  onStageSelect: (stage: WorkflowStage) => void;
}) {
  const stageKey = stage.value as WorkflowStage;
  const style = stageHeaderStyles[stageKey];

  const overdueCount = stage.orders.filter((order) =>
    overdue(order.dueDate),
  ).length;

  const isSelected = selectedStage === stage.value;

  return (
    <button
      type="button"
      disabled={stage.value === "ALL"}
      onClick={() => {
        if (stage.value !== "ALL") {
          onStageSelect(stage.value as WorkflowStage);
        }
      }}
      className={`
     min-w-[190px]
    w-[190px]
    shrink-0
    rounded-xl
    border
    p-2
    transition-all
    duration-150

      ${style.border}
      ${style.bg}

      ${isSelected ? "shadow-sm ring-2 ring-[#76b95f]/25" : "hover:shadow-sm"}

      focus:outline-none
      focus:ring-2
      focus:ring-[#76b95f]/30
    `}
    >
      {/* Header */}
      <div className="flex min-w-0 items-center justify-between gap-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={`
            h-1.5
            w-1.5
            shrink-0
            rounded-full
            ${style.dot}
          `}
          />

          <span
            className={`
            min-w-0
            truncate
            text-[12px]
            font-semibold
            ${style.text}
          `}
          >
            {stage.label}
          </span>
        </div>

        <span
          className={`
          flex
          h-4
          min-w-4
          shrink-0
          items-center
          justify-center
          rounded-full
          px-1
          text-[10px]
          font-bold
          ${style.soft}
          ${style.text}
        `}
        >
          {stage.orders.length}
        </span>
      </div>

      {/* Stage Info */}
      <div className="mt-1.5 flex min-w-0 items-center justify-between gap-1 text-[10px]">
        <span className="truncate text-slate-400">
          {stage.orders.length === 1
            ? "1 order"
            : `${stage.orders.length} orders`}
        </span>

        {overdueCount > 0 ? (
          <span className="shrink-0 font-semibold text-red-500">
            {overdueCount} overdue
          </span>
        ) : (
          <span className="shrink-0 font-medium text-emerald-600">
            On track
          </span>
        )}
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="mt-1.5 flex items-center gap-1 text-[10px] font-medium text-[#3d8b2f]">
          <span className="h-1 w-1 rounded-full bg-[#3d8b2f]" />
          Selected
        </div>
      )}
    </button>
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

  return (
    <button
      type="button"
      onClick={() => onSelect(order)}
      className="
        group
        relative
        w-full
        rounded-xl
        border
        border-border
        bg-card
        p-2.5
        text-left
        shadow-[0_1px_2px_rgba(0,0,0,0.03)]
        transition-all
        duration-150

        hover:-translate-y-[1px]
        hover:border-emerald-500/30
        hover:bg-muted/20

        focus:outline-none
        focus:ring-2
        focus:ring-[#3f8d32]/20
      "
    >
      {/* Status indicator */}
      <span
        className={`
          absolute
          left-0
          top-3
          h-8
          w-0.5
          rounded-r-full
          ${isOverdue ? "bg-red-400" : "bg-[#76b95f]"}
        `}
      />

      {/* Header */}
      <div className="flex min-w-0 items-start justify-between gap-1.5 pl-1">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="min-w-0 truncate text-[12px] font-bold tracking-tight text-[#3d8b2f]">
              {order.dveplCode}
            </span>

            {isOverdue && (
              <span className="shrink-0 rounded-full bg-red-950/40 border border-red-500/20 px-1 py-0.5 text-[6px] font-semibold text-red-400">
                OVERDUE
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Next Action */}
      <div className="mt-2 pl-1">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Next Action
        </p>

        <p className="line-clamp-2 text-[12px] font-medium leading-4 text-foreground/90">
          {order.nextAction || "No action assigned"}
        </p>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex min-w-0 items-center justify-between gap-1 border-t border-border pt-2 pl-1">
        <div className="flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
          <CalendarDays className="h-2.5 w-2.5 shrink-0" />

          <span className="truncate">
            {order.dueDate ? formatDate(order.dueDate) : "No due date"}
          </span>
        </div>
      </div>
    </button>
  );
}

function PipelineColumn({
  stage,
  onSelect,
  onStageSelect,
  selectedStage,
}: {
  stage: {
    value: WorkflowStage | "ALL";
    label: string;
    orders: WorkflowOrder[];
  };

  onSelect: (order: WorkflowOrder) => void;

  onStageSelect: (stage: WorkflowStage) => void;

  selectedStage: WorkflowStage | null;
}) {
  const isSelected = selectedStage === stage.value;

  return (
    <div
      className={`
        min-w-0
        w-full
        rounded-xl
        border
        p-2
        transition-all
        duration-150

        ${
          isSelected
            ? "border-emerald-500/40 bg-emerald-500/10 shadow-sm"
            : "border-border bg-muted/30"
        }
      `}
    >
      <PipelineColumnHeader
        stage={stage}
        selectedStage={selectedStage}
        onStageSelect={onStageSelect}
      />

      <div className="space-y-2">
        {stage.orders.map((order) => (
          <PipelineCard key={order.id} order={order} onSelect={onSelect} />
        ))}

        {!stage.orders.length && (
          <div className="rounded-lg border border-dashed border-border bg-card/60 px-2 py-5 text-center">
            <div className="mx-auto mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-muted">
              <span className="text-[10px] text-muted-foreground">—</span>
            </div>

            <p className="text-[8px] text-muted-foreground">No orders</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ current }: { current: WorkflowStage }) {
  const index = Math.max(
    0,
    pipelineStages.findIndex((s) => s.value === current),
  );
  const items = pipelineStages.slice(0, 5);
  return (
    <div className="overflow-x-auto rounded-lg border border-border p-5">
      <div className="flex min-w-[650px] items-start">
        {items.map((item, i) => (
          <React.Fragment key={item.value}>
            <div className="flex w-full flex-col items-center text-center">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${i <= index ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400" : "border-border bg-card text-muted-foreground"}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
              </span>
              <span className="mt-2 text-[10px] font-medium text-foreground/90">
                {item.label}
              </span>
            </div>
            {i < items.length - 1 && (
              <div
                className={`mt-3 h-0.5 flex-1 ${i < index ? "bg-emerald-500" : "bg-border"}`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

function Action({
  title,
  icon,
  value,
  sub,
  button,
}: {
  title: string;
  icon: React.ReactNode;
  value: string;
  sub: string;
  button?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 bg-card text-card-foreground">
      <div className="flex items-center gap-2 text-xs font-semibold text-foreground/90">
        <span className="text-[#3d8b2f]">{icon}</span>
        {title}
      </div>
      <div className="mt-4 text-xs font-medium text-foreground/80">{value}</div>
      <div className="mt-1 text-[10px] text-muted-foreground">{sub}</div>
      {button && (
        <button className="mt-4 rounded-md bg-[#3d8b2f] px-3 py-2 text-[10px] font-medium text-white">
          {button}
        </button>
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Legend({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2 text-foreground/80">
      <span className="h-2 w-2 rounded-full bg-[#76b95f]" />
      <span>
        {label} <span className="font-medium text-foreground">{value}</span>
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
      {text}
    </div>
  );
}
