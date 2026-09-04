import { useState, useEffect, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ExportOrder } from "@/types/exportOrders";
import { useSalesOrderAccess } from "@/utils/salesOrderAccess";
import { FileText, Columns3, Upload, Plus, CheckCircle2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { STATUS_CONFIG, type DrawingStatus } from "./constants";

interface Props {
  orders: ExportOrder[];
  isLoading: boolean;
  selectedOrderIds: string[];
  onSelectOrder: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onUploadDrawing?: (orderId: string) => void;
}

type ColumnKey =
  | "soNumber"
  | "customer"
  | "drawing"
  | "status"
  | "amount"
  | "delivery"
  | "access"
  | "actions";

interface ColumnDef {
  key: ColumnKey;
  label: string;
  defaultVisible: boolean;
}

const COLUMNS: ColumnDef[] = [
  { key: "soNumber", label: "SO Number", defaultVisible: true },
  { key: "customer", label: "Customer", defaultVisible: true },
  { key: "drawing", label: "Drawing", defaultVisible: true },
  { key: "status", label: "Status", defaultVisible: true },
  { key: "amount", label: "Amount", defaultVisible: true },
  { key: "delivery", label: "Delivery Target", defaultVisible: true },
  { key: "access", label: "Access", defaultVisible: true },
  { key: "actions", label: "Actions", defaultVisible: true },
];

const STORAGE_KEY = "engineering-drawings.orderColumns";

const DEFAULT_VISIBILITY = COLUMNS.reduce<Record<ColumnKey, boolean>>(
  (acc, c) => {
    acc[c.key] = c.defaultVisible;
    return acc;
  },
  {} as Record<ColumnKey, boolean>,
);

function loadVisibility(): Record<ColumnKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_VISIBILITY };
    const parsed = JSON.parse(raw);
    // Merge with defaults so new columns default to visible
    return { ...DEFAULT_VISIBILITY, ...parsed };
  } catch {
    return { ...DEFAULT_VISIBILITY };
  }
}

function fmt(amount: unknown) {
  return `₹${Number(amount ?? 0).toLocaleString("en-IN")}`;
}

function fmtDate(val: unknown) {
  if (!val) return "—";
  try {
    return new Date(val as string).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

export default function OrdersTable({
  orders,
  isLoading,
  selectedOrderIds,
  onSelectOrder,
  onSelectAll,
  onUploadDrawing,
}: Props) {
  const { canWorkOnOrder, isAdmin } = useSalesOrderAccess();
  const [visibility, setVisibility] = useState<Record<ColumnKey, boolean>>(
    loadVisibility,
  );

  // Persist to localStorage whenever visibility changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  }, [visibility]);

  const visibleCount = useMemo(
    () => COLUMNS.filter((c) => visibility[c.key]).length,
    [visibility],
  );

  const allSelected =
    orders.length > 0 && selectedOrderIds.length === orders.length;
  const someSelected = selectedOrderIds.length > 0 && !allSelected;

  // Total columns including the selection checkbox (always shown)
  const totalColumns = visibleCount + 1;

  const toggleColumn = (key: ColumnKey) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetColumns = () => setVisibility({ ...DEFAULT_VISIBILITY });

  return (
    <div className="rounded-lg border bg-background overflow-hidden">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Matching Orders</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${orders.length} Orders`}
            {selectedOrderIds.length > 0 &&
              ` · ${selectedOrderIds.length} selected`}
          </span>

          {/* Column customizer */}
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-2">
                  <Columns3 className="h-4 w-4" />
                  Columns
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </Button>
              }
            />
            <PopoverContent align="end" className="w-64">
              <PopoverHeader>
                <PopoverTitle>Customize Columns</PopoverTitle>
                <p className="text-xs text-muted-foreground">
                  Choose which fields to show. Saved to your browser.
                </p>
              </PopoverHeader>

              <div className="flex flex-col gap-1">
                {COLUMNS.map((col) => (
                  <label
                    key={col.key}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 hover:bg-muted/50 cursor-pointer"
                  >
                    <span className="text-sm">{col.label}</span>
                    <Checkbox
                      checked={visibility[col.key]}
                      onCheckedChange={() => toggleColumn(col.key)}
                    />
                  </label>
                ))}
              </div>

              <div className="border-t pt-2 mt-1 flex justify-between">
                <button
                  onClick={resetColumns}
                  className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Reset defaults
                </button>
                <span className="text-xs text-muted-foreground">
                  {visibleCount}/{COLUMNS.length} showing
                </span>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
              {visibility.soNumber && (
                <th className="px-4 py-3 text-left">SO Number</th>
              )}
              {visibility.customer && (
                <th className="px-4 py-3 text-left">Customer</th>
              )}
              {visibility.drawing && (
                <th className="px-4 py-3 text-left">Drawing</th>
              )}
              {visibility.status && (
                <th className="px-4 py-3 text-left">Status</th>
              )}
              {visibility.amount && (
                <th className="px-4 py-3 text-left">Amount</th>
              )}
              {visibility.delivery && (
                <th className="px-4 py-3 text-left">Delivery Target</th>
              )}
              {visibility.access && (
                <th className="px-4 py-3 text-left">Access</th>
              )}
              {visibility.actions && (
                <th className="px-4 py-3 text-right">Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-t">
                  {Array.from({ length: totalColumns }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-full rounded bg-muted animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && orders.length === 0 && (
              <tr>
                <td
                  colSpan={totalColumns}
                  className="px-4 py-10 text-center text-muted-foreground"
                >
                  No orders found. Use the filter above to search.
                </td>
              </tr>
            )}

            {!isLoading &&
              orders.map((row: ExportOrder) => {
                const isSelected = selectedOrderIds.includes(row.id);
                const hasDrawing = (row as any).engineeringProjects?.some(
                  (p: any) => p.drawings?.length > 0,
                );
                const canWork = canWorkOnOrder(row);
                const statusCfg =
                  STATUS_CONFIG[row.status as DrawingStatus] ??
                  STATUS_CONFIG.DRAFT;

                return (
                  <tr
                    key={row.id}
                    className={`border-t transition-colors cursor-pointer ${
                      isSelected ? "bg-primary/5" : "hover:bg-muted/40"
                    }`}
                    onClick={() => onSelectOrder(row.id, !isSelected)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(v) => onSelectOrder(row.id, !!v)}
                      />
                    </td>

                    {visibility.soNumber && (
                      <td className="px-4 py-3 font-medium">{row.dveplCode}</td>
                    )}
                    {visibility.customer && (
                      <td className="px-4 py-3">{row.partyName}</td>
                    )}

                    {visibility.drawing && (
                      <td className="px-4 py-3">
                        {hasDrawing ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <FileText className="w-3 h-3 text-emerald-500" />
                            Attached
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                            —
                          </span>
                        )}
                      </td>
                    )}

                    {visibility.status && (
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.pill}`}
                        >
                          {row.status}
                        </span>
                      </td>
                    )}
                    {visibility.amount && (
                      <td className="px-4 py-3">{fmt(row.grandTotal)}</td>
                    )}
                    {visibility.delivery && (
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {row.deliveryMonthTarget ||
                          fmtDate(row.orderConfirmDate)}
                      </td>
                    )}
                    {visibility.access && (
                      <td className="px-4 py-3">
                        {canWork ? (
                          isAdmin ? (
                            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                              Admin access
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Assigned to you
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border">
                            View only
                          </span>
                        )}
                      </td>
                    )}
                    {visibility.actions && (
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {canWork ? (
                          hasDrawing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Uploaded
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => onUploadDrawing?.(row.id)}
                                title="Upload another drawing or revision for this order"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Add More
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1.5 hover:bg-primary hover:text-primary-foreground"
                              onClick={() => onUploadDrawing?.(row.id)}
                            >
                              <Upload className="w-3 h-3" />
                              Upload Drawing
                            </Button>
                          )
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
