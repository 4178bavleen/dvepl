import { useState, useCallback, useEffect, useMemo } from "react";
import { useExportOrdersStore } from "@/store/exportOrders.store";
import { useERPStore } from "@/store/erpStore";
import { canPerformPageAction } from "@/utils/pagePermissions";

import { Card, CardContent } from "@/components/ui/card";
import FilterPanel from "./components/FilterPanel";
import ExportToolbar from "./components/ExportToolbar";
import OrdersTable from "./components/OrdersTable";
import PdfPreview from "./components/PdfPreview";
import SelectedOrdersCard from "./components/SelectedOrdersCard";
import DrawingUploader from "./components/DrawingUploader";
import DrawingLibrary from "./components/DrawingLibrary";
import PdfOptions from "./components/PdfOptions";

export interface Filters {
  soNo: string;
  customer: string;
  status: string;
  assignedEngineer: string;
  startDate: string;
  endDate: string;
}

export interface PdfOpts {
  companyHeader: boolean;
  companyFooter: boolean;
  pageNumbers: boolean;
  includeDrawings: boolean;
  landscapeMode: boolean;
  alternateRows: boolean;
}

const DEFAULT_FILTERS: Filters = {
  soNo: "",
  customer: "",
  status: "all",
  assignedEngineer: "",
  startDate: "",
  endDate: "",
};

const DEFAULT_PDF_OPTS: PdfOpts = {
  companyHeader: true,
  companyFooter: true,
  pageNumbers: true,
  includeDrawings: true,
  landscapeMode: false,
  alternateRows: true,
};

export default function ExportOrdersPage() {
  const store = useERPStore();
  const currentUser = store.users?.find(
    (u: any) => u.id === store.currentUserId,
  ) as any;
  const canCreate = canPerformPageAction(
    currentUser?.actionPermissions,
    "export_orders",
    "create",
  );
  const canEdit = canPerformPageAction(
    currentUser?.actionPermissions,
    "export_orders",
    "edit",
  );

  const orders = useExportOrdersStore((s) => s.orders);
  const availableOrders = useExportOrdersStore((s) => s.availableOrders);
  const allDrawings = useExportOrdersStore((s) => s.drawings);
  const ordersLoading = useExportOrdersStore((s) => s.isOrdersLoading);
  const fetchOrders = useExportOrdersStore((s) => s.fetchOrders);
  const fetchAvailableOrders = useExportOrdersStore((s) => s.fetchAvailableOrders);
  const fetchDrawings = useExportOrdersStore((s) => s.fetchDrawings);

  // ── Filter state ─────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Partial<Filters>>({});
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Selection state ──────────────────────────────────────────────────────
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);

  // ── PDF Options ──────────────────────────────────────────────────────────
  const [pdfOptions, setPdfOptions] = useState<PdfOpts>(DEFAULT_PDF_OPTS);

  // ── Fetch data ───────────────────────────────────────────────────────────

  useEffect(() => {
    void fetchOrders({
      search: activeFilters.soNo || activeFilters.customer || undefined,
      status:
        activeFilters.status && activeFilters.status !== "all"
          ? activeFilters.status
          : undefined,
      assignedEngineer: activeFilters.assignedEngineer || undefined,
      startDate: activeFilters.startDate || undefined,
      endDate: activeFilters.endDate || undefined,
    });
  }, [activeFilters, fetchOrders]);

  useEffect(() => {
    void fetchAvailableOrders();
  }, [fetchAvailableOrders]);

  const allOrderIds = useMemo(() => orders.map((o) => o.id), [orders]);
  const allOrderIdsKey = allOrderIds.join(",");
  useEffect(() => {
    void fetchDrawings(allOrderIds);
  }, [allOrderIds, allOrderIdsKey, fetchDrawings]);

  // ── Computed ─────────────────────────────────────────────────────────────

  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
  const drawings = allDrawings.filter(
    (d) =>
      d.project?.salesOrderId &&
      selectedOrderIds.includes(d.project.salesOrderId),
  );

  const hasActiveFilters = Boolean(
    activeFilters.soNo ||
      activeFilters.customer ||
      (activeFilters.status && activeFilters.status !== "all") ||
      activeFilters.assignedEngineer ||
      activeFilters.startDate ||
      activeFilters.endDate,
  );

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(() => {
    setActiveFilters({ ...filters });
    setSelectedOrderIds([]);
    setSelectedDrawingIds([]);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveFilters({});
    setSelectedOrderIds([]);
    setSelectedDrawingIds([]);
  }, []);

  const handleSelectOrder = useCallback(
    (id: string, checked: boolean) => {
      setSelectedOrderIds((prev) =>
        checked ? [...prev, id] : prev.filter((x) => x !== id),
      );

      // Only clear drawings belonging to THIS order when deselecting
      if (!checked) {
        const drawingsToRemove = allDrawings
          .filter((d) => d.project?.salesOrderId === id)
          .map((d) => d.id);
        setSelectedDrawingIds((prev) =>
          prev.filter((did) => !drawingsToRemove.includes(did)),
        );
      }
    },
    [allDrawings],
  );

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedOrderIds(checked ? orders.map((o) => o.id) : []);
      if (!checked) setSelectedDrawingIds([]);
    },
    [orders],
  );

  const handleDrawingCreated = useCallback(() => {
    void fetchDrawings(allOrderIds);
  }, [allOrderIds, fetchDrawings]);

  // Pass all available orders so DrawingLibrary can resolve orderForDrawing
  const allKnownOrders = useMemo(() => {
    const merged = [...orders];
    availableOrders.forEach((ao) => {
      if (!merged.some((o) => o.id === ao.id)) merged.push(ao);
    });
    return merged;
  }, [orders, availableOrders]);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Toolbar */}
      <ExportToolbar
        selectedOrderIds={selectedOrderIds}
        selectedDrawingIds={selectedDrawingIds}
        orders={orders}
        selectedOrders={selectedOrders}
        drawings={drawings}
        pdfOptions={pdfOptions}
        onReset={handleReset}
        onOpenFilters={() => setFilterOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Filters (right drawer) */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
        open={filterOpen}
        setOpen={setFilterOpen}
      />

      {/* Main grid: orders + uploader on left, PDF tools on right */}
      <div className="grid grid-cols-12 gap-6 items-start">
        {/* Left column */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <Card>
            <CardContent className="p-5">
              <OrdersTable
                orders={orders}
                isLoading={ordersLoading}
                selectedOrderIds={selectedOrderIds}
                onSelectOrder={handleSelectOrder}
                onSelectAll={handleSelectAll}
              />
            </CardContent>
          </Card>

          <SelectedOrdersCard
            selectedOrders={selectedOrders}
            drawings={drawings}
            selectedDrawingIds={selectedDrawingIds}
          />

          {canCreate && (
            <Card>
              <CardContent className="p-5">
                <DrawingUploader
                  selectedOrderIds={selectedOrderIds}
                  selectedOrders={selectedOrders}
                  availableOrders={availableOrders}
                  onSuccess={handleDrawingCreated}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: sticky PDF tools */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-6">
          <Card>
            <CardContent className="p-5">
              <PdfPreview
                selectedOrders={selectedOrders}
                pdfOptions={pdfOptions}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <PdfOptions options={pdfOptions} setOptions={setPdfOptions} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drawing library — full width */}
      <Card>
        <CardContent className="p-5">
          <DrawingLibrary
            drawings={allDrawings}
            selectedDrawingIds={selectedDrawingIds}
            setSelectedDrawingIds={setSelectedDrawingIds}
            onStatusChanged={handleDrawingCreated}
            canEdit={canEdit}
            orders={allKnownOrders}
          />
        </CardContent>
      </Card>
    </div>
  );
}
