import React, { useCallback, useEffect, useRef, useState } from "react";
import workflowApi, {
  WorkflowOrder,
  WorkflowStage,
} from "@/services/workflowApi";

const stages: {
  value: WorkflowStage | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All" },
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

function getStageClass(stage: WorkflowStage) {
  switch (stage) {
    case "ORDER_CONFIRMED":
      return "bg-gray-100 text-gray-700";

    case "PO_READY":
      return "bg-blue-100 text-blue-700";

    case "DRAWING_ASSIGNED":
    case "DRAWING_SENT":
      return "bg-purple-100 text-purple-700";

    case "REVISION_REQUIRED":
      return "bg-orange-100 text-orange-700";

    case "DRAWING_APPROVED":
    case "PO_PLACED":
      return "bg-green-100 text-green-700";

    case "INVENTORY_FOLLOW_UP":
    case "PRODUCTION_FOLLOW_UP":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function WorkflowTrackerPage() {
  const [orders, setOrders] = useState<WorkflowOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [activeStage, setActiveStage] = useState<
    WorkflowStage | "ALL"
  >("ALL");

  const [search, setSearch] = useState("");
  const searchRef = useRef(search);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);

      const response = await workflowApi.getOrders({
        stage: activeStage === "ALL" ? undefined : activeStage,
        search: searchRef.current.trim() || undefined,
      });

      if (response.data.success) {
        setOrders(response.data.data);
      }
    } catch (error) {
      console.error("Failed to load workflow orders:", error);
    } finally {
      setLoading(false);
    }
  }, [activeStage]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    void loadOrders();
  };

  const handleStageChange = async (
    orderId: string,
    stage: WorkflowStage,
  ) => {
    if (updatingOrderId === orderId) return;

    const order = orders.find((item) => item.id === orderId);
    if (!order || order.workflowStage === stage) return;

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">
          Workflow Tracker
        </h1>

        <p className="text-sm text-muted-foreground mt-1">
          Track orders, drawings, PO status and follow-ups.
        </p>
      </div>

      {/* Search */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-3"
      >
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order..."
          className="h-10 w-full max-w-sm rounded-md border px-3 text-sm outline-none focus:ring-2"
        />

        <button
          type="submit"
          className="h-10 rounded-md bg-green-600 px-5 text-sm font-medium text-white hover:bg-green-700"
        >
          Search
        </button>
      </form>

      {/* Stage tabs */}
      <div className="flex gap-2 overflow-x-auto border-b pb-2">
        {stages.map((stage) => {
          const active = activeStage === stage.value;

          return (
            <button
              key={stage.value}
              type="button"
              onClick={() => setActiveStage(stage.value)}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {stage.label}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="min-w-[850px] w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <th className="px-4 py-3 text-left font-medium">
                Order
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Current Stage
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Next Action
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Due Date
              </th>

              <th className="px-4 py-3 text-left font-medium">
                Last Updated
              </th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  Loading workflow...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b last:border-b-0 hover:bg-muted/20"
                >
                  <td className="px-4 py-4 font-medium">
                    {order.dveplCode}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.workflowStage}
                        disabled={updatingOrderId === order.id}
                        onChange={(event) =>
                          void handleStageChange(
                            order.id,
                            event.target.value as WorkflowStage,
                          )
                        }
                        aria-label={`Change workflow stage for ${order.dveplCode}`}
                        className={`h-9 min-w-[180px] rounded-full border-0 px-3 text-xs font-medium outline-none ring-1 ring-inset ring-black/5 ${getStageClass(
                          order.workflowStage,
                        )} ${
                          updatingOrderId === order.id
                            ? "cursor-wait opacity-60"
                            : "cursor-pointer"
                        }`}
                      >
                        {stages
                          .filter((stage) => stage.value !== "ALL")
                          .map((stage) => (
                            <option key={stage.value} value={stage.value}>
                              {stage.label}
                            </option>
                          ))}
                      </select>

                      {updatingOrderId === order.id && (
                        <span className="text-xs text-muted-foreground">
                          Updating...
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    {order.nextAction || (
                      <span className="text-muted-foreground">
                        No action
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {order.dueDate
                      ? new Date(order.dueDate).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-4 py-4">
                    {new Date(
                      order.workflowUpdatedAt,
                    ).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
