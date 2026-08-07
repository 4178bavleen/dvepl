import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { exportOrdersApi } from "@/services/modules";

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

  // ── Queries ───────────────────────────────────────────────────────
  const { data: ordersResponse, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ["export-orders", activeFilters],
    queryFn: () =>
      exportOrdersApi.listOrders({
        search: activeFilters.soNo || activeFilters.customer || undefined,
        status: activeFilters.status !== "all" ? activeFilters.status : undefined,
        assignedEngineer: activeFilters.assignedEngineer || undefined,
        startDate: activeFilters.startDate || undefined,
        endDate: activeFilters.endDate || undefined,
      }),
  });

  const orders: any[] = ordersResponse?.data ?? [];

  const { data: drawingsResponse, refetch: refetchDrawings } = useQuery({
    queryKey: ["export-order-drawings", selectedOrderIds],
    queryFn: () =>
      selectedOrderIds.length > 0
        ? exportOrdersApi.listDrawings(selectedOrderIds)
        : Promise.resolve({ data: [] }),
    enabled: selectedOrderIds.length > 0,
  });

  const drawings: any[] = drawingsResponse?.data ?? [];

  // ── Computed ──────────────────────────────────────────────────────
  const selectedOrders = orders.filter((o) => selectedOrderIds.includes(o.id));

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
    refetchDrawings();
  }, [refetchDrawings]);

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
            onSuccess={handleDrawingCreated}
          />
        </CardContent>
      </Card>

      {/* Drawing library */}
      <Card>
        <CardContent className="p-5">
          <DrawingLibrary
            drawings={drawings}
            selectedDrawingIds={selectedDrawingIds}
            setSelectedDrawingIds={setSelectedDrawingIds}
            onStatusChanged={refetchDrawings}
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