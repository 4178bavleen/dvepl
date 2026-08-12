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
  UserRound,
} from "lucide-react";
import workflowApi, { WorkflowOrder, WorkflowStage } from "@/services/workflowApi";

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
  return stages.find((s) => s.value === stage)?.label || stage.replace(/_/g, " ");
}

function stageClass(stage: WorkflowStage) {
  switch (stage) {
    case "ORDER_CONFIRMED": return "bg-blue-50 text-blue-700 border-blue-100";
    case "PO_READY": return "bg-violet-50 text-violet-700 border-violet-100";
    case "DRAWING_ASSIGNED":
    case "DRAWING_SENT": return "bg-purple-50 text-purple-700 border-purple-100";
    case "REVISION_REQUIRED": return "bg-orange-50 text-orange-700 border-orange-100";
    case "DRAWING_APPROVED":
    case "PO_PLACED": return "bg-green-50 text-green-700 border-green-100";
    default: return "bg-amber-50 text-amber-700 border-amber-100";
  }
}

function dotClass(stage: WorkflowStage) {
  if (stage === "ORDER_CONFIRMED") return "bg-blue-500";
  if (stage === "PO_READY") return "bg-violet-500";
  if (stage === "DRAWING_ASSIGNED" || stage === "DRAWING_SENT") return "bg-purple-500";
  if (stage === "REVISION_REQUIRED") return "bg-orange-500";
  if (stage === "DRAWING_APPROVED" || stage === "PO_PLACED") return "bg-green-500";
  return "bg-amber-500";
}

function formatDate(value?: string | Date | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function overdue(value?: string | Date | null) {
  return !!value && new Date(value).getTime() < Date.now();
}


export default function WorkflowTrackerPage() {
  const [orders, setOrders] = useState<WorkflowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStage, setActiveStage] = useState<WorkflowStage | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<WorkflowOrder | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

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
          current ? data.find((x) => x.id === current.id) || data[0] || null : data[0] || null
        );
      }
    } catch (error) {
      console.error("Failed to load workflow orders:", error);
    } finally {
      setLoading(false);
    }
  }, [activeStage, search]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const handleStageChange = async (orderId: string, stage: WorkflowStage) => {
    const order = orders.find((item) => item.id === orderId);
    if (!order || order.workflowStage === stage || updatingOrderId === orderId) return;

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
      ["PO_PLACED", "INVENTORY_FOLLOW_UP", "PRODUCTION_FOLLOW_UP"].includes(o.workflowStage)
    ).length;
    const completed = orders.filter((o) => o.workflowStage === "PO_PLACED").length;
    const overdueCount = orders.filter((o) => overdue(o.dueDate)).length;
    const pending = Math.max(total - completed - overdueCount, 0);
    return { total, poInProgress, pending, completed, overdue: overdueCount };
  }, [orders]);

  const columns = useMemo(
    () => pipelineStages.map((stage) => ({
      ...stage,
      orders: orders.filter((o) => o.workflowStage === stage.value),
    })),
    [orders]
  );

  const reminders = useMemo(
    () => [...orders]
      .filter((o) => o.nextAction)
      .sort((a, b) => new Date(a.dueDate || "9999-12-31").getTime() - new Date(b.dueDate || "9999-12-31").getTime())
      .slice(0, 5),
    [orders]
  );

  const followUps = orders.filter((o) =>
    ["REVISION_REQUIRED", "INVENTORY_FOLLOW_UP", "PRODUCTION_FOLLOW_UP"].includes(o.workflowStage)
  ).length;

  const poOrders = orders.filter((o) =>
    ["PO_PLACED", "INVENTORY_FOLLOW_UP", "PRODUCTION_FOLLOW_UP"].includes(o.workflowStage)
  ).slice(0, 5);

  return (
    <div className="min-h-full bg-[#f8faf7] p-3 lg:p-5">
      <div className="mx-auto max-w-[1540px] space-y-4">

        {/* HEADER — deliberately compact like the reference */}
        <header className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[23px] font-semibold tracking-[-0.02em] text-[#171b18]">Workflow Tracker</h1>
            <p className="mt-0.5 text-[12px] text-[#7a817c]">Track your orders, POs and follow ups</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden h-9 w-[245px] items-center rounded-lg border border-[#e4e9e3] bg-white px-3 shadow-[0_1px_2px_rgba(0,0,0,.02)] md:flex">
              <Search className="mr-2 h-3.5 w-3.5 text-[#9aa09c]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && void loadOrders()}
                placeholder="Search orders, POs, customers..."
                className="w-full bg-transparent text-[11px] outline-none placeholder:text-[#a1a7a3]"
              />
              <button onClick={() => void loadOrders()} className="text-[#8b928d]"><Search className="h-3.5 w-3.5" /></button>
            </div>
            <button className="flex h-9 items-center gap-1.5 rounded-lg border border-[#e4e9e3] bg-white px-3 text-[11px] text-[#333834]">
              <CalendarDays className="h-3.5 w-3.5" /> This Month <ChevronDown className="h-3 w-3 text-[#9aa09c]" />
            </button>
            <button className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-[#e4e9e3] bg-white text-[#555d57]">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute right-1.5 top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-[#3f8d32] text-[7px] text-white">3</span>
            </button>
            <button className="flex h-9 items-center gap-1.5 rounded-lg bg-[#3f8d32] px-3.5 text-[11px] font-semibold text-white shadow-sm">
              <Plus className="h-3.5 w-3.5" /> New Order
            </button>
          </div>
        </header>

        {/* KPI STRIP */}
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-5">
          <Summary icon={<ShoppingCart className="h-4 w-4" />} title="Total Orders" value={stats.total} note="Current view" cls="bg-[#eef8eb] text-[#3f8d32]" />
          <Summary icon={<Clock3 className="h-4 w-4" />} title="POs in Progress" value={stats.poInProgress} note="PO / stock workflow" cls="bg-[#f4effa] text-[#8b65a9]" />
          <Summary icon={<Clock3 className="h-4 w-4" />} title="Pending" value={stats.pending} note="Needs attention" cls="bg-[#fff7e9] text-[#d59b32]" />
          <Summary icon={<CheckCircle2 className="h-4 w-4" />} title="Completed" value={stats.completed} note="PO placed" cls="bg-[#eef8eb] text-[#3f8d32]" />
          <Summary icon={<AlertTriangle className="h-4 w-4" />} title="Overdue" value={stats.overdue} note="Past due date" cls="bg-[#fff0ef] text-[#e05a50]" />
        </div>

        {/* MAIN REFERENCE GRID */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">

          {/* PIPELINE */}
          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-[13px] font-semibold text-[#202520]">Pipeline View</h2>
                <p className="mt-0.5 text-[9px] text-[#969c98]">Move through your actual order workflow</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button className="flex h-7 items-center gap-1 rounded-md border border-[#e7ebe6] px-2 text-[9px] text-[#68706b]">Group by: <b>Status</b><ChevronDown className="h-3 w-3" /></button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e7ebe6] text-[#737b76]"><Filter className="h-3 w-3" /></button>
                <button className="hidden h-7 items-center gap-1 rounded-md border border-[#e7ebe6] px-2 text-[9px] text-[#68706b] md:flex"><SlidersHorizontal className="h-3 w-3" /> Customize</button>
              </div>
            </div>

            {/* No separate stage-filter pills — the reference uses the columns themselves */}
            <div className="overflow-x-auto">
              <div className="grid min-w-[980px] grid-cols-5 gap-1.5">
                {columns.slice(0, 5).map((column) => (
                  <PipelineColumn key={column.value} stage={column} onSelect={setSelectedOrder} />
                ))}
              </div>
              {columns.length > 5 && (
                <div className="mt-1.5 grid min-w-[980px] grid-cols-5 gap-1.5">
                  {columns.slice(5).map((column) => (
                    <PipelineColumn key={column.value} stage={column} onSelect={setSelectedOrder} />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* UPCOMING + FOLLOWUP */}
          <div className="grid gap-3">
            <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#202520]">Upcoming Reminders</h2>
                <button className="text-[9px] font-semibold text-[#3f8d32]">View All</button>
              </div>
              <div className="space-y-0.5">
                {reminders.length ? reminders.map((order) => (
                  <button key={order.id} onClick={() => setSelectedOrder(order)} className="flex w-full items-center gap-2 rounded-md px-1.5 py-2 text-left hover:bg-[#fafcf9]">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${overdue(order.dueDate) ? "bg-[#fff0ef] text-[#e05a50]" : "bg-[#eef8eb] text-[#4c963f]"}`}>
                      {overdue(order.dueDate) ? <AlertTriangle className="h-3.5 w-3.5" /> : <Bell className="h-3.5 w-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[10px] font-semibold text-[#303631]">{order.dveplCode}</span>
                      <span className="mt-0.5 block truncate text-[9px] text-[#929994]">{order.nextAction || "Follow up"}</span>
                    </span>
                    <span className="text-right">
                      <span className={`block text-[9px] font-semibold ${overdue(order.dueDate) ? "text-[#e05a50]" : "text-[#3f8d32]"}`}>{overdue(order.dueDate) ? "Overdue" : "Upcoming"}</span>
                      <span className="block text-[8px] text-[#9ba19d]">{formatDate(order.dueDate)}</span>
                    </span>
                  </button>
                )) : <Empty text="No upcoming reminders" />}
              </div>
            </section>

            <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-[13px] font-semibold text-[#202520]">Follow Up Summary</h2>
                <button className="rounded-md bg-[#f7faf6] px-2 py-1 text-[8px] text-[#667069]">This Month <ChevronDown className="inline h-2.5 w-2.5" /></button>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-[88px] w-[88px] shrink-0 rounded-full" style={{background: `conic-gradient(#3f8d32 0 42%, #8fc27f 42% 67%, #e7a51f 67% 84%, #e7ebe6 84% 100%)`}}>
                  <div className="absolute inset-[10px] flex flex-col items-center justify-center rounded-full bg-white">
                    <span className="text-[18px] font-semibold text-[#222822]">{followUps}</span>
                    <span className="text-[8px] text-[#979e99]">Total</span>
                  </div>
                </div>
                <div className="space-y-2 text-[9px] text-[#69716b]">
                  <Legend label="Today" value={Math.min(followUps, 5)} />
                  <Legend label="This Week" value={Math.max(followUps - 5, 0)} />
                  <Legend label="Overdue" value={stats.overdue} />
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* ALL ORDERS + FOLLOW-UP SUMMARY — reference table density */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">
          <section className="rounded-xl border border-[#e5e9e4] bg-white shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="flex items-center justify-between border-b border-[#eef1ed] px-3.5 py-3">
              <h2 className="text-[13px] font-semibold text-[#202520]">All Orders</h2>
              <div className="flex items-center gap-1.5">
                <div className="flex h-7 w-[175px] items-center rounded-md border border-[#e7ebe6] px-2">
                  <Search className="mr-1.5 h-3 w-3 text-[#9aa19c]" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && void loadOrders()} placeholder="Search..." className="w-full bg-transparent text-[9px] outline-none" />
                </div>
                <button className="flex h-7 items-center gap-1 rounded-md border border-[#e7ebe6] px-2 text-[9px] text-[#68706b]"><ListFilter className="h-3 w-3" /> Columns</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead className="bg-[#fcfdfb]">
                  <tr className="text-left text-[8px] font-medium text-[#8d948f]">
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
                  {loading ? <tr><td colSpan={7} className="px-4 py-8 text-center text-[10px] text-[#9aa19c]">Loading workflow...</td></tr> :
                  !orders.length ? <tr><td colSpan={7} className="px-4 py-8 text-center text-[10px] text-[#9aa19c]">No orders found.</td></tr> :
                  orders.slice(0, 7).map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className={`cursor-pointer border-t border-[#f0f2ef] ${selectedOrder?.id === order.id ? "bg-[#f8fcf6]" : "hover:bg-[#fbfcfa]"}`}>
                      <td className="px-3.5 py-2.5 text-[9px] font-semibold text-[#3f8d32]">{order.dveplCode}</td>
                      <td className="px-3.5 py-2.5 text-[9px] text-[#626a64]">Customer / Vendor</td>
                      <td className="px-3.5 py-2.5 text-[9px] text-[#626a64]">-</td>
                      <td className="px-3.5 py-2.5">
                        <select
                          value={order.workflowStage}
                          disabled={updatingOrderId === order.id}
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
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3.5 py-2.5 text-[9px] text-[#626a64]">{order.nextAction || "Follow up"}</td>
                      <td className={`px-3.5 py-2.5 text-[9px] ${overdue(order.dueDate) ? "font-semibold text-[#e05a50]" : "text-[#68706b]"}`}>{formatDate(order.dueDate)}</td>
                      <td className="px-3.5 py-2.5"><span className={`rounded-md px-1.5 py-0.5 text-[8px] font-medium ${overdue(order.dueDate) ? "bg-[#fff0ef] text-[#df594f]" : "bg-[#eef8eb] text-[#3f8d32]"}`}>{overdue(order.dueDate) ? "Overdue" : "Pending"}</span></td>
                    </tr>
                  ))
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[#202520]">Follow Up Analytics</h2>
              <button className="text-[#9aa19c]">×</button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <Mini label="Total" value={followUps} />
              <Mini label="Completed" value={stats.completed} />
              <Mini label="Pending" value={Math.max(followUps - stats.completed, 0)} />
              <Mini label="Overdue" value={stats.overdue} />
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-[#eef1ed] p-3">
                <div className="mb-2 text-[9px] font-semibold text-[#4d554f]">Follow Up Trend</div>
                <div className="flex h-[85px] items-end gap-1">
                  {[30,44,38,55,49,67,58,76,63,80,71,86].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-[#8fc27f]" style={{height: `${h}%`}} />
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-[7px] text-[#a0a6a2]"><span>1 Aug</span><span>10 Aug</span><span>20 Aug</span><span>Today</span></div>
              </div>
              <div className="rounded-lg border border-[#eef1ed] p-3">
                <div className="mb-2 text-[9px] font-semibold text-[#4d554f]">By Status</div>
                <div className="flex items-center gap-3">
                  <div className="relative h-[78px] w-[78px] rounded-full" style={{background: "conic-gradient(#3f8d32 0 61%, #e7a51f 61% 86%, #e05a50 86% 100%)"}}>
                    <div className="absolute inset-[12px] rounded-full bg-white" />
                  </div>
                  <div className="space-y-1.5 text-[8px] text-[#737a75]">
                    <Legend label="Completed" value={stats.completed}/>
                    <Legend label="Pending" value={Math.max(followUps-stats.completed,0)}/>
                    <Legend label="Overdue" value={stats.overdue}/>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* DETAIL + PO TRACKING */}
        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,.72fr)]">
          <section className="rounded-xl border border-[#e5e9e4] bg-white p-4 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <button className="mb-2 text-[9px] font-semibold text-[#3f8d32]">‹ Back</button>
                <div className="flex items-center gap-2">
                  <h2 className="text-[15px] font-semibold text-[#202520]">{selectedOrder?.dveplCode || "Select an order"}</h2>
                  {selectedOrder && <span className={`rounded-md border px-1.5 py-0.5 text-[8px] font-medium ${stageClass(selectedOrder.workflowStage)}`}>{overdue(selectedOrder.dueDate) ? "Overdue" : "Pending"}</span>}
                </div>
                <p className="mt-1 text-[9px] text-[#969c98]">Order workflow details and activity</p>
              </div>
              {selectedOrder && <div className="flex items-center gap-1.5">
                <button className="flex h-7 items-center gap-1 rounded-md border border-[#e7ebe6] px-2 text-[9px] text-[#59615b]"><Send className="h-3 w-3" /> Send Reminder</button>
                <button className="flex h-7 items-center gap-1 rounded-md bg-[#3f8d32] px-2.5 text-[9px] font-semibold text-white"><Bell className="h-3 w-3" /> Follow Up</button>
                <button className="flex h-7 w-7 items-center justify-center rounded-md border border-[#e7ebe6] text-[#737b76]"><MoreVertical className="h-3 w-3" /></button>
              </div>}
            </div>

            {selectedOrder ? (
              <>
                <div className="mb-4 flex items-center gap-6 border-b border-[#eef1ed] pb-3 text-[9px] text-[#8a918c]">
                  <span>Current Stage <b className="ml-1 text-[#333a35]">{stageLabel(selectedOrder.workflowStage)}</b></span>
                  <span>Next Action <b className="ml-1 text-[#333a35]">{selectedOrder.nextAction || "-"}</b></span>
                  <span>Due Date <b className="ml-1 text-[#333a35]">{formatDate(selectedOrder.dueDate)}</b></span>
                </div>
                <Timeline current={selectedOrder.workflowStage} />
                <div className="mt-4 grid gap-2 md:grid-cols-3">
                  <Action title="Next Action" icon={<Clock3 className="h-3.5 w-3.5" />} value={selectedOrder.nextAction || "No action assigned"} sub={selectedOrder.dueDate ? `Due ${formatDate(selectedOrder.dueDate)}` : "No due date"} button="✓ Mark as Done" />
                  <Action title="Reminders" icon={<Bell className="h-3.5 w-3.5" />} value="Follow up with customer" sub={formatDate(selectedOrder.dueDate)} button="Add Reminder" />
                  <Action title="Activity Timeline" icon={<Clock3 className="h-3.5 w-3.5" />} value="Workflow updated" sub={formatDate(selectedOrder.workflowUpdatedAt)} />
                </div>
              </>
            ) : <Empty text="Select an order from the table to see its workflow." />}
          </section>

          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-[#202520]">PO Tracking</h2><button className="text-[9px] text-[#3f8d32]">View All</button></div>
            <div className="mb-2.5 flex h-7 items-center rounded-md border border-[#e7ebe6] px-2"><Search className="mr-1.5 h-3 w-3 text-[#9aa19c]" /><input placeholder="Search POs..." className="w-full bg-transparent text-[9px] outline-none" /><Filter className="h-3 w-3 text-[#9aa19c]" /></div>
            <div className="overflow-hidden rounded-md border border-[#eef1ed]">
              <table className="w-full">
                <thead className="bg-[#fcfdfb] text-left text-[7px] text-[#8d948f]">
                  <tr><th className="px-2 py-2">PO No.</th><th className="px-2 py-2">Status</th><th className="px-2 py-2">Due</th><th className="px-2 py-2"></th></tr>
                </thead>
                <tbody>
                  {poOrders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)} className="cursor-pointer border-t border-[#f0f2ef] hover:bg-[#fbfcfa]">
                      <td className="px-2 py-2 text-[8px] font-semibold text-[#3f8d32]">{order.dveplCode}</td>
                      <td className="px-2 py-2"><span className={`rounded px-1 py-0.5 text-[7px] ${stageClass(order.workflowStage)}`}>{stageLabel(order.workflowStage)}</span></td>
                      <td className="px-2 py-2 text-[8px] text-[#737a75]">{formatDate(order.dueDate)}</td>
                      <td className="px-2 py-2 text-right"><Bell className="ml-auto h-2.5 w-2.5 text-[#8c938e]" /></td>
                    </tr>
                  ))}
                  {!poOrders.length && <tr><td colSpan={4} className="px-2 py-7 text-center text-[8px] text-[#9aa19c]">No PO records yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* BOTTOM REFERENCE STRIP */}
        <div className="grid gap-3 xl:grid-cols-[1fr_1.15fr_1fr]">
          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[13px] font-semibold text-[#202520]">Reminders</h2>
              <button className="flex h-7 items-center gap-1 rounded-md bg-[#3f8d32] px-2.5 text-[9px] font-semibold text-white"><Plus className="h-3 w-3" /> New Reminder</button>
            </div>
            <div className="mb-2.5 flex gap-3 border-b border-[#eef1ed] text-[8px]">
              {["All", "Today", "This Week", "This Month", "Overdue"].map((tab, i) => (
                <button key={tab} className={`pb-2 ${i === 0 ? "border-b-2 border-[#3f8d32] font-semibold text-[#3f8d32]" : "text-[#969d98]"}`}>{tab}</button>
              ))}
            </div>
            {reminders.slice(0,4).map((order) => (
              <div key={order.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-[#f1f3f0] py-2 last:border-0">
                <div><div className="text-[9px] font-medium text-[#424a44]">{order.nextAction || "Follow up"}</div><div className="mt-0.5 text-[7px] text-[#9aa19c]">{order.dveplCode}</div></div>
                <div className={`text-[8px] ${overdue(order.dueDate) ? "text-[#e05a50]" : "text-[#3f8d32]"}`}>{formatDate(order.dueDate)}</div>
                <Bell className="h-2.5 w-2.5 text-[#8f9691]" />
              </div>
            ))}
            {!reminders.length && <Empty text="No reminders" />}
          </section>

          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-[#202520]">Workflow Summary</h2><button className="text-[9px] text-[#3f8d32]">This Month <ChevronDown className="inline h-2.5 w-2.5" /></button></div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <Mini label="Total Orders" value={stats.total}/>
              <Mini label="POs in Progress" value={stats.poInProgress}/>
              <Mini label="Pending" value={stats.pending}/>
              <Mini label="Overdue" value={stats.overdue}/>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-[#eef1ed] p-3">
                <div className="mb-2 text-[9px] font-semibold text-[#4d554f]">Follow Up Trend</div>
                <div className="flex h-[70px] items-end gap-1">{[28,42,37,55,47,64,58,76,62,80,69,84].map((h,i)=><div key={i} className="flex-1 rounded-t bg-[#8fc27f]" style={{height:`${h}%`}} />)}</div>
                <div className="mt-2 flex justify-between text-[7px] text-[#a0a6a2]"><span>1 Aug</span><span>10 Aug</span><span>20 Aug</span><span>Today</span></div>
              </div>
              <div className="rounded-lg border border-[#eef1ed] p-3">
                <div className="mb-2 text-[9px] font-semibold text-[#4d554f]">By Status</div>
                <div className="flex items-center gap-3">
                  <div className="relative h-[70px] w-[70px] rounded-full" style={{background:"conic-gradient(#3f8d32 0 61%,#e7a51f 61% 84%,#e05a50 84% 100%)"}}><div className="absolute inset-[11px] rounded-full bg-white" /></div>
                  <div className="space-y-1.5 text-[8px] text-[#737a75]"><Legend label="Completed" value={stats.completed}/><Legend label="Pending" value={stats.pending}/><Legend label="Overdue" value={stats.overdue}/></div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-[#e5e9e4] bg-white p-3.5 shadow-[0_1px_3px_rgba(20,30,20,.035)]">
            <div className="mb-3 flex items-center justify-between"><h2 className="text-[13px] font-semibold text-[#202520]">Workflow Stages</h2><button className="text-[9px] text-[#3f8d32]">View All</button></div>
            <div className="space-y-1.5">
              {columns.slice(0,6).map((stage) => (
                <button key={stage.value} onClick={() => setActiveStage(stage.value as WorkflowStage)} className="flex w-full items-center justify-between rounded-md border border-[#f0f2ef] px-2.5 py-2 text-left hover:bg-[#fbfcfa]">
                  <span className="flex items-center gap-2"><span className={`h-1.5 w-1.5 rounded-full ${dotClass(stage.value as WorkflowStage)}`} /><span className="text-[8px] text-[#626a64]">{stage.label}</span></span>
                  <span className="text-[8px] font-semibold text-[#303631]">{stage.orders.length}</span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Summary({ icon, title, value, note, cls }: { icon: React.ReactNode; title: string; value: number; note: string; cls: string }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start gap-3"><div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cls}`}>{icon}</div><div><div className="text-xs text-slate-400">{title}</div><div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div><div className="mt-1 text-[10px] text-slate-400">{note}</div></div></div></div>;
}

function PipelineColumn({ stage, onSelect }: { stage: { value: WorkflowStage | "ALL"; label: string; orders: WorkflowOrder[] }; onSelect: (o: WorkflowOrder) => void }) {
  return <div className="min-w-[190px] rounded-lg border border-slate-100 bg-[#fcfdfc] p-2"><div className="mb-2 flex items-center justify-between px-1"><span className="text-[11px] font-semibold text-slate-600">{stage.label}</span><span className="rounded-full bg-white px-1.5 py-0.5 text-[9px] text-slate-400">{stage.orders.length}</span></div><div className="space-y-2">{stage.orders.slice(0,3).map((o) => <button key={o.id} onClick={() => onSelect(o)} className="w-full rounded-lg border border-slate-100 bg-white p-3 text-left shadow-sm hover:border-[#cfe3c9]"><div className="text-[10px] font-semibold text-[#3d8b2f]">{o.dveplCode}</div><div className="mt-2 text-[11px] font-medium text-slate-700">{o.nextAction || "No action assigned"}</div><div className={`mt-2 text-[10px] ${overdue(o.dueDate) ? "text-red-500" : "text-slate-400"}`}>{formatDate(o.dueDate)}</div></button>)}{!stage.orders.length && <div className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-[10px] text-slate-400">No orders</div>}</div><button className="mt-2 flex w-full items-center justify-center gap-1 rounded-md py-2 text-[10px] font-medium text-[#3d8b2f]"><Plus className="h-3 w-3"/> Add Order</button></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-slate-100 bg-[#fcfdfc] p-3"><div className="text-[10px] text-slate-400">{label}</div><div className="mt-1 text-xs font-medium text-slate-700">{value}</div></div>;
}

function Timeline({ current }: { current: WorkflowStage }) {
  const index = Math.max(0, pipelineStages.findIndex((s) => s.value === current));
  const items = pipelineStages.slice(0, 5);
  return <div className="overflow-x-auto rounded-lg border border-slate-100 p-5"><div className="flex min-w-[650px] items-start">{items.map((item, i) => <React.Fragment key={item.value}><div className="flex w-full flex-col items-center text-center"><span className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${i <= index ? "border-[#76b95f] bg-[#eef7eb] text-[#3d8b2f]" : "border-slate-200 bg-white text-slate-300"}`}><CheckCircle2 className="h-3.5 w-3.5"/></span><span className="mt-2 text-[10px] font-medium text-slate-600">{item.label}</span></div>{i < items.length-1 && <div className={`mt-3 h-0.5 flex-1 ${i < index ? "bg-[#76b95f]" : "bg-slate-200"}`} />}</React.Fragment>)}</div></div>;
}

function Action({ title, icon, value, sub, button }: { title: string; icon: React.ReactNode; value: string; sub: string; button?: string }) {
  return <div className="rounded-lg border border-slate-100 p-4"><div className="flex items-center gap-2 text-xs font-semibold text-slate-700"><span className="text-[#3d8b2f]">{icon}</span>{title}</div><div className="mt-4 text-xs font-medium text-slate-700">{value}</div><div className="mt-1 text-[10px] text-slate-400">{sub}</div>{button && <button className="mt-4 rounded-md bg-[#3d8b2f] px-3 py-2 text-[10px] font-medium text-white">{button}</button>}</div>;
}

function Mini({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-100 p-3"><div className="text-[10px] text-slate-400">{label}</div><div className="mt-1 text-xl font-semibold text-slate-900">{value}</div></div>;
}

function Legend({ label, value }: { label: string; value: number }) {
  return <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#76b95f]"/><span>{label} <span className="font-medium text-slate-700">{value}</span></span></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-lg border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">{text}</div>;
}
