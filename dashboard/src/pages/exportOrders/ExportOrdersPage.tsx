import { useState, useCallback, useEffect } from "react";
import { useExportOrdersStore } from "@/store/exportOrders.store";

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
  const orders = useExportOrdersStore((state) => state.orders);
  const availableOrders = useExportOrdersStore((state) => state.availableOrders);
  const allDrawings = useExportOrdersStore((state) => state.drawings);
  const ordersLoading = useExportOrdersStore((state) => state.isOrdersLoading);
  const fetchOrders = useExportOrdersStore((state) => state.fetchOrders);
  const fetchAvailableOrders = useExportOrdersStore((state) => state.fetchAvailableOrders);
  const fetchDrawings = useExportOrdersStore((state) => state.fetchDrawings);

  // ── Filter state ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [activeFilters, setActiveFilters] = useState<Partial<Filters>>({});

  // ── Selection state ───────────────────────────────────────────────
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [selectedDrawingIds, setSelectedDrawingIds] = useState<string[]>([]);

  // ── PDF Options ───────────────────────────────────────────────────
  const [pdfOptions, setPdfOptions] = useState<PdfOpts>(DEFAULT_PDF_OPTS);

  // ── Upload dialog state ───────────────────────────────────────────
  const [uploadOpen, setUploadOpen] = useState(false);

  // ── Backend data → typed service → Export Orders store ────────────
  useEffect(() => {
    void fetchOrders({
        search: (activeFilters.soNo || activeFilters.customer) || undefined,
        status: activeFilters.status && activeFilters.status !== "all" ? activeFilters.status : undefined,
        assignedEngineer: activeFilters.assignedEngineer || undefined,
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
    });
  }, [activeFilters, fetchOrders]);

  useEffect(() => {
    void fetchAvailableOrders();
  }, [fetchAvailableOrders]);

  const allOrderIds = orders.map((order) => order.id);
  useEffect(() => {
    void fetchDrawings(allOrderIds);
  }, [allOrderIds.join(","), fetchDrawings]);

  // ── Computed ──────────────────────────────────────────────────────
  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));
  const drawings = allDrawings.filter((drawing) =>
    drawing.project?.salesOrderId && selectedOrderIds.includes(drawing.project.salesOrderId),
  );

  // ── Handlers ──────────────────────────────────────────────────────
  const handleSearch = useCallback(() => {
    setActiveFilters({ ...filters });
    // clear selection when re-searching
    setSelectedOrderIds([]);
    setSelectedDrawingIds([]);
  }, [filters]);

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setActiveFilters({});
    setSelectedOrderIds([]);
    setSelectedDrawingIds([]);
  }, []);

  const handleSelectOrder = useCallback((id: string, checked: boolean) => {
    setSelectedOrderIds((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    );
    if (!checked) {
      // deselect drawings that belonged to this order
      setSelectedDrawingIds([]);
    }
  }, []);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      setSelectedOrderIds(checked ? orders.map((o) => o.id) : []);
      if (!checked) setSelectedDrawingIds([]);
    },
    [orders]
  );

  const handleDrawingCreated = useCallback(() => {
    void fetchDrawings(allOrderIds);
  }, [allOrderIds.join(","), fetchDrawings]);

  return (
    <div className="flex flex-col gap-6 p-6">

      {/* Page toolbar */}
      <ExportToolbar
        selectedOrderIds={selectedOrderIds}
        selectedDrawingIds={selectedDrawingIds}
        orders={orders}
        selectedOrders={selectedOrders}
        drawings={drawings}
        pdfOptions={pdfOptions}
        onReset={handleReset}
      />

      {/* Filter bar */}
      <FilterPanel
        filters={filters}
        setFilters={setFilters}
        onSearch={handleSearch}
      />

      {/* Main grid: table + PDF preview */}
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
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

        <Card className="col-span-4">
          <CardContent className="p-5">
            <PdfPreview
              selectedOrders={selectedOrders}
              pdfOptions={pdfOptions}
            />
          </CardContent>
        </Card>
      </div>

      {/* Selection summary */}
      <SelectedOrdersCard
        selectedOrders={selectedOrders}
        drawings={drawings}
        selectedDrawingIds={selectedDrawingIds}
      />

      {/* Drawing uploader */}
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

      {/* Drawing library */}
      <Card>
        <CardContent className="p-5">
          <DrawingLibrary
            drawings={allDrawings}
            selectedDrawingIds={selectedDrawingIds}
            setSelectedDrawingIds={setSelectedDrawingIds}
            onStatusChanged={handleDrawingCreated}
          />
        </CardContent>
      </Card>

      {/* PDF export options */}
      <Card>
        <CardContent className="p-5">
          <PdfOptions options={pdfOptions} setOptions={setPdfOptions} />
        </CardContent>
      </Card>

    </div>
  );
}
