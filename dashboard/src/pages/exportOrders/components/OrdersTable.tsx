import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  orders: any[];
  isLoading: boolean;
  selectedOrderIds: string[];
  onSelectOrder: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  DRAFT: "bg-gray-100 text-gray-600",
  COMPLETED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-red-100 text-red-600",
};

function fmt(amount: any) {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(val: any) {
  if (!val) return "—";
  try {
    return new Date(val).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return val;
  }
}

export default function OrdersTable({
  orders,
  isLoading,
  selectedOrderIds,
  onSelectOrder,
  onSelectAll,
}: Props) {
  const allSelected = orders.length > 0 && selectedOrderIds.length === orders.length;
  const someSelected = selectedOrderIds.length > 0 && !allSelected;

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <h2 className="text-lg font-semibold">Matching Orders</h2>
        <span className="text-sm text-muted-foreground">
          {isLoading ? "Loading…" : `${orders.length} Orders`}
          {selectedOrderIds.length > 0 && ` · ${selectedOrderIds.length} selected`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="w-12 px-4 py-3 text-left">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected ? "indeterminate" : undefined}
                  onCheckedChange={(v) => onSelectAll(!!v)}
                />
              </th>
              <th className="px-4 py-3 text-left">SO Number</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Amount</th>
              <th className="px-4 py-3 text-left">Delivery Target</th>
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  No orders found. Use the filter above to search.
                </td>
              </tr>
            )}

            {!isLoading &&
              orders.map((row) => {
                const isSelected = selectedOrderIds.includes(row.id);
                const statusClass =
                  STATUS_COLORS[row.status] ?? "bg-gray-100 text-gray-600";

                return (
                  <tr
                    key={row.id}
                    className={`border-t transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                    onClick={() => onSelectOrder(row.id, !isSelected)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => onSelectOrder(row.id, !!v)}
                      />
                    </td>

                    <td className="px-4 py-3 font-medium">{row.dveplCode}</td>
                    <td className="px-4 py-3">{row.partyName}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusClass}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{fmt(row.grandTotal)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {row.deliveryMonthTarget || fmtDate(row.orderConfirmDate)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}