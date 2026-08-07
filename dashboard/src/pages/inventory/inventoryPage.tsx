import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Mail,
  Package,
  Plus,
  Settings,
  Truck,
  Upload,
} from "lucide-react";

import { cn } from "@/utils/helpers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/services/axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import DynamicTable from "@/components/dynamic/DynamicTable";
import DynamicForm from "@/components/dynamic/DynamicForm";
import DynamicFieldManager from "@/components/dynamic/DynamicFieldManager";
import useDynamicModule from "@/hooks/useDynamicModule";
import VendorTracking from "./vendorTracking";
import { DynamicRecord } from "@/types/dynamic";

type StockStatus = "all" | "in-stock" | "low-stock" | "out-of-stock";

export default function InventoryPage() {
  const navigate = useNavigate();
  const importInputRef = useRef<HTMLInputElement>(null);

  const {
    module,
    fields,
    records,
    loading,
    search,
    setSearch,
    createRecord,
    updateRecord,
    deleteRecord,
    loadFields,
    loadRecords,
  } = useDynamicModule({ moduleKey: "inventory" });

  const [mainView, setMainView] = useState<"inventory" | "tracking">("inventory");
  const [formOpen, setFormOpen] = useState(false);
  const [fieldManagerOpen, setFieldManagerOpen] = useState(false);
  const [editing, setEditing] = useState<DynamicRecord | null>(null);
  const [values, setValues] = useState<Record<string, any>>({});
  const [searchField, setSearchField] = useState<string>("all");
  const [fieldSearch, setFieldSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<StockStatus>("all");
  const [stockOpen, setStockOpen] = useState(false);
  const [stockRecord, setStockRecord] = useState<DynamicRecord | null>(null);
  const [stockMovType, setStockMovType] = useState<"IN" | "OUT" | "ADJUST" | "RETURN">("IN");
  const [stockQty, setStockQty] = useState("");
  const [stockDate, setStockDate] = useState(new Date().toISOString().split("T")[0]);
  const [stockRate, setStockRate] = useState("");
  const [stockVendorName, setStockVendorName] = useState("");
  const [stockInvoiceNo, setStockInvoiceNo] = useState("");
  const [stockOrderCode, setStockOrderCode] = useState("");
  const [stockReason, setStockReason] = useState("");
  const [stockLoading, setStockLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  const buildFormValues = (recordValues?: Record<string, any> | string | null) => {
    const base: Record<string, any> = {};
    fields.forEach((field) => {
      base[field.fieldName] = field.defaultValue ?? "";
    });

    let savedValues: Record<string, any> = {};
    if (typeof recordValues === "string") {
      try {
        savedValues = JSON.parse(recordValues);
      } catch {
        savedValues = {};
      }
    } else if (recordValues && typeof recordValues === "object") {
      savedValues = recordValues;
    }

    const savedEntries = Object.entries(savedValues);
    fields.forEach((field) => {
      const savedValue = savedEntries.find(
        ([key]) => key.toLowerCase() === field.fieldName.toLowerCase()
      )?.[1];

      if (savedValue !== undefined) {
        base[field.fieldName] = savedValue;
      }
    });

    return base;
  };

  const openCreate = () => {
    setEditing(null);
    setValues(buildFormValues());
    setFormOpen(true);
  };

  const openEdit = (record: DynamicRecord) => {
    setEditing(record);
    setValues(buildFormValues(record.values));
    setFormOpen(true);
  };

  const removeRecord = async (record: DynamicRecord) => {
    if (!confirm("Delete record?")) return;
    await deleteRecord(record.id);
  };

  const saveRecord = async () => {
    if (editing) {
      await updateRecord(editing.id, values);
    } else {
      await createRecord(values);
    }

    setFormOpen(false);
    setValues({});
  };

  const getStockStatus = (record: DynamicRecord) => {
    const quantityField = fields.find((field) => {
      const label = field.label.toLowerCase();
      return label.includes("qty") || label.includes("quantity") || label.includes("stock") || label.includes("balance");
    });

    const quantityValue = quantityField
      ? Number(record.values?.[quantityField.fieldName] ?? 0)
      : Number(record.values?.quantity ?? record.values?.qty ?? 0);

    if (Number.isNaN(quantityValue)) return "in-stock" as const;
    if (quantityValue <= 0) return "out-of-stock" as const;
    if (quantityValue <= 5) return "low-stock" as const;
    return "in-stock" as const;
  };

  const filteredRecords = useMemo(() => {
    const searchQuery = `${search} ${fieldSearch}`.trim().toLowerCase();
    const selectedField = fields.find((field) => field.fieldName === searchField);

    return (records || []).filter((record) => {
      const status = getStockStatus(record);
      if (stockFilter !== "all" && status !== stockFilter) return false;

      if (!searchQuery) return true;

      if (searchField !== "all" && selectedField) {
        return String(record.values?.[selectedField.fieldName] ?? "").toLowerCase().includes(searchQuery);
      }

      const searchableText = fields
        .map((field) => String(record.values?.[field.fieldName] ?? ""))
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchQuery);
    });
  }, [records, search, fieldSearch, searchField, stockFilter, fields]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [customPageSize, setCustomPageSize] = useState("10");

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fieldSearch, searchField, stockFilter]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize);
  const paginatedRecords = useMemo(() => {
    return filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const getVisiblePages = () => {
    const delta = 1;
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | null = null;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l !== null) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l > 2) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  const handleExportExcel = () => {
    const rows = filteredRecords.map((record) => {
      const row: Record<string, any> = {};
      fields.forEach((field) => {
        row[field.label] = record.values?.[field.fieldName];
      });
      row["Stock Status"] = getStockStatus(record);
      return row;
    });

    const sheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Inventory");
    XLSX.writeFile(workbook, "inventory.xlsx");
    toast.success("Inventory exported to Excel");
  };

  const handleImportExcel = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });

      let created = 0;
      for (const row of rows) {
        const values: Record<string, any> = {};
        Object.entries(row).forEach(([key, value]) => {
          const normalizedKey = String(key).trim().toLowerCase();
          const field = fields.find((candidate) => {
            const candidateName = candidate.fieldName.toLowerCase();
            const candidateLabel = candidate.label.toLowerCase();
            return candidateName === normalizedKey || candidateLabel === normalizedKey;
          });

          if (field) {
            values[field.fieldName] = value;
          }
        });

        if (Object.keys(values).length > 0) {
          await createRecord(values);
          created += 1;
        }
      }

      toast.success(`Imported ${created} inventory record${created === 1 ? "" : "s"}`);
    } catch (error) {
      console.error(error);
      toast.error("Unable to import Excel file");
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const getStockQuantityFieldName = (record: DynamicRecord) => {
    const quantityField = fields.find((field) => {
      const label = field.label.toLowerCase();
      return (
        label.includes("qty") ||
        label.includes("quantity") ||
        label.includes("stock") ||
        label.includes("balance")
      );
    });

    if (quantityField) return quantityField.fieldName;
    if (record.values?.quantity !== undefined) return "quantity";
    if (record.values?.qty !== undefined) return "qty";
    if (record.values?.currentStock !== undefined) return "currentStock";
    return "quantity";
  };

  const getCurrentStock = (record: DynamicRecord) => {
    const fieldName = getStockQuantityFieldName(record);
    return Number(record.values?.[fieldName] ?? 0);
  };

  const getNameValue = (record: DynamicRecord) => {
    const nameField = fields.find((field) => {
      const label = field.label.toLowerCase();
      const key = field.fieldName.toLowerCase();
      return label.includes("name") || key === "name" || key === "materialcode";
    });

    return String(
      nameField?.fieldName
        ? record.values?.[nameField.fieldName]
        : record.values?.name ?? record.values?.materialCode ?? "Item",
    );
  };

  const getUnitValue = (record: DynamicRecord) => {
    const unitField = fields.find((field) => {
      const label = field.label.toLowerCase();
      const key = field.fieldName.toLowerCase();
      return label.includes("unit") || key === "unit";
    });

    return String(unitField?.fieldName ? record.values?.[unitField.fieldName] : record.values?.unit ?? "");
  };

  const resetStockForm = () => {
    setStockQty("");
    setStockDate(new Date().toISOString().split("T")[0]);
    setStockRate("");
    setStockVendorName("");
    setStockInvoiceNo("");
    setStockOrderCode("");
    setStockReason("");
  };

  const handleOpenStockModal = (
    record: DynamicRecord,
    type: "IN" | "OUT" | "ADJUST" | "RETURN",
  ) => {
    setStockRecord(record);
    setStockMovType(type);
    resetStockForm();
    setStockOpen(true);
  };

  const handleSaveStock = async () => {
    if (!stockRecord) return;

    const qty = parseFloat(stockQty);
    if (Number.isNaN(qty) || qty < 0) {
      toast.error("Enter a valid quantity");
      return;
    }

    if ((stockMovType === "IN" || stockMovType === "OUT" || stockMovType === "RETURN") && qty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    setStockLoading(true);

    try {
      if (stockMovType === "ADJUST") {
        await apiClient.patch(`/inventory/update/${stockRecord.id}`, {
          currentStock: qty,
        });
      } else {
        const body: Record<string, any> = {
          inventoryId: stockRecord.id,
          quantity: qty,
          referenceType: "MANUAL",
          referenceId: stockRecord.id,
          remarks: stockReason || `${stockMovType} stock movement`,
        };

        if (stockMovType === "IN") {
          body.referenceType = stockInvoiceNo ? "INVOICE" : "MANUAL";
          if (stockRate) body.unitPrice = parseFloat(stockRate);
          if (stockVendorName) body.vendorName = stockVendorName;
          if (stockInvoiceNo) body.invoiceNo = stockInvoiceNo;
        }

        if (stockMovType === "OUT" || stockMovType === "RETURN") {
          body.referenceType = stockOrderCode ? "SALES_ORDER" : "MANUAL";
          body.referenceId = stockOrderCode || stockRecord.id;
        }

        if (stockMovType === "RETURN") {
          await apiClient.post("/inventory/stock-in", body);
        } else if (stockMovType === "IN") {
          await apiClient.post("/inventory/stock-in", body);
        } else {
          await apiClient.post("/inventory/stock-out", body);
        }
      }

      toast.success("Stock transaction completed successfully");
      setStockOpen(false);
      await loadRecords();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message ?? "Failed to submit stock transaction");
    } finally {
      setStockLoading(false);
    }
  };

  const handleRestockAction = (record: DynamicRecord) => {
    handleOpenStockModal(record, "IN");
  };

  const stockOptions: Array<{ value: StockStatus; label: string }> = [
    { value: "all", label: "All" },
    { value: "in-stock", label: "In Stock" },
    { value: "low-stock", label: "Low Stock" },
    { value: "out-of-stock", label: "Out of Stock" },
  ];

  const stockPreview = (() => {
    const qtyVal = parseFloat(stockQty) || 0;
    const current = stockRecord ? getCurrentStock(stockRecord) : 0;
    const unit = stockRecord ? getUnitValue(stockRecord) : "";
    let calculatedAfter = current;

    if (stockMovType === "IN" || stockMovType === "RETURN") {
      calculatedAfter += qtyVal;
    } else if (stockMovType === "OUT") {
      calculatedAfter -= qtyVal;
    } else if (stockMovType === "ADJUST") {
      calculatedAfter = qtyVal;
    }

    return {
      qtyVal,
      current,
      unit,
      calculatedAfter,
      isNegative: calculatedAfter < 0,
    };
  })();

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">Dynamic Inventory Management</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" />
            Export Excel
          </Button>

          <Button variant="outline" onClick={() => importInputRef.current?.click()} disabled={importing}>
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importing..." : "Import Excel"}
          </Button>

          <input ref={importInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />

          <Button variant="outline" onClick={() => setMainView("tracking")}>
            <Truck className="mr-2 h-4 w-4" />
            Vendor Tracking
          </Button>

          <Button variant="outline" onClick={() => setFieldManagerOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Manage Fields
          </Button>

          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {mainView === "inventory" ? (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Search inventory"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <Select
              value={searchField}
              onValueChange={(value) => setSearchField(value ?? "all")}
            >
              <SelectTrigger className="w-full md:w-[240px]">
                <SelectValue placeholder="Search field" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All fields</SelectItem>
                {fields.map((field) => (
                  <SelectItem key={field.id} value={field.fieldName}>
                    {field.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder={searchField === "all" ? "Search in selected field" : `Search ${fields.find((field) => field.fieldName === searchField)?.label ?? "field"}`}
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              disabled={searchField === "all"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {stockOptions.map((item) => (
              <Button
                key={item.value}
                variant={stockFilter === item.value ? "default" : "outline"}
                size="sm"
                onClick={() => setStockFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Table Toolbar */}
          {!loading && filteredRecords.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Left Side: Pagination & Bulk Actions */}
              <div className="flex flex-wrap items-center gap-3">
                {/* 1. Page Numbers Navigation Pill */}
                <div className="flex items-center gap-1 bg-muted/60 border border-border/70 p-1 h-11 rounded-xl shadow-xs">
                  {/* Prev Arrow */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/30 hover:shadow-3xs transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4.5 w-4.5" />
                  </Button>

                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {getVisiblePages().map((page, index) => {
                      if (page === "...") {
                        return (
                          <span
                            key={`dots-${index}`}
                            className="text-xs text-muted-foreground font-semibold px-1.5 select-none"
                          >
                            ...
                          </span>
                        );
                      }
                      const isCurrent = page === currentPage;
                      return (
                        <Button
                          key={`page-${page}`}
                          variant={isCurrent ? "default" : "ghost"}
                          size="sm"
                          className={cn(
                            "h-9 w-9 p-0 rounded-lg text-xs font-semibold transition-all duration-150",
                            isCurrent
                              ? "bg-primary text-white hover:bg-primary/95 shadow-sm"
                              : "text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/30 hover:shadow-3xs"
                          )}
                          onClick={() => setCurrentPage(page as number)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                  </div>

                  {/* Next Arrow */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-card border border-transparent hover:border-border/30 hover:shadow-3xs transition-all duration-150 disabled:opacity-30 disabled:pointer-events-none"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4.5 w-4.5" />
                  </Button>
                </div>

                {/* 2. Custom Entries Selector Pill */}
                <div className="flex items-center gap-2 bg-muted/60 border border-border/70 px-3 h-11 rounded-xl shadow-xs text-xs text-muted-foreground font-medium">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className="w-12 h-7 text-center bg-card border border-border/70 text-foreground rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 font-bold text-xs"
                    value={customPageSize}
                    onChange={(e) => {
                      const valStr = e.target.value.replace(/[^0-9]/g, "");
                      setCustomPageSize(valStr);
                      if (valStr) {
                        const valNum = parseInt(valStr, 10);
                        if (valNum > 0) {
                          setPageSize(valNum);
                          setCurrentPage(1);
                        }
                      }
                    }}
                    onBlur={() => {
                      if (!customPageSize || parseInt(customPageSize, 10) <= 0) {
                        setPageSize(10);
                        setCustomPageSize("10");
                        setCurrentPage(1);
                      }
                    }}
                  />
                  <span>entries per page</span>
                  <div className="w-px h-4 bg-border/80 mx-1.5" />
                  <button
                    type="button"
                    className="text-primary hover:text-primary/80 font-bold uppercase text-[10px] tracking-wider transition-colors"
                    onClick={() => {
                      setPageSize(filteredRecords.length || Number.MAX_SAFE_INTEGER);
                      setCustomPageSize(String(filteredRecords.length || Number.MAX_SAFE_INTEGER));
                      setCurrentPage(1);
                    }}
                  >
                    Show All
                  </button>
                </div>
              </div>

              {/* Right Side: Info */}
              <div className="text-xs text-muted-foreground font-medium">
                Showing {Math.min((currentPage - 1) * pageSize + 1, filteredRecords.length)} to{" "}
                {Math.min(currentPage * pageSize, filteredRecords.length)} of {filteredRecords.length} entries
              </div>
            </div>
          )}

          <DynamicTable
            fields={fields}
            records={paginatedRecords}
            loading={loading}
            onStock={handleRestockAction}
            onEdit={openEdit}
            onDelete={removeRecord}
          />
        </>
      ) : (
        <>
          <Button variant="outline" onClick={() => setMainView("inventory")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Inventory
          </Button>
          <VendorTracking />
        </>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Record" : "Add Record"}</DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
            <DynamicForm
              key={editing?.id ?? "new-record"}
              fields={fields}
              values={values}
              loading={loading}
              onChange={(field, value) =>
                setValues((prev) => ({
                  ...prev,
                  [field]: value,
                }))
              }
              onSubmit={saveRecord}
              onCancel={() => setFormOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-md h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Stock Movement</DialogTitle>
          </DialogHeader>

          {stockRecord ? (
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              <div className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <p className="font-medium">{getNameValue(stockRecord)}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Current stock: {getCurrentStock(stockRecord)} {getUnitValue(stockRecord)}
                </p>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {(["IN", "OUT", "ADJUST", "RETURN"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setStockMovType(type)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      stockMovType === type
                        ? "bg-card text-foreground border-border"
                        : "bg-muted/20 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {stockMovType === "ADJUST" ? "New Level" : "Quantity"} *
                    </label>
                    <Input
                      type="number"
                      required
                      min={0}
                      step="any"
                      placeholder="0"
                      value={stockQty}
                      onChange={(e) => setStockQty(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Transaction Date
                    </label>
                    <Input
                      type="date"
                      value={stockDate}
                      onChange={(e) => setStockDate(e.target.value)}
                    />
                  </div>
                </div>

                {stockMovType === "IN" && (
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">
                        Custom Rate (?)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Enter rate"
                        value={stockRate}
                        onChange={(e) => setStockRate(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">
                        Supplier Name
                      </label>
                      <Input
                        placeholder="Supplier name"
                        value={stockVendorName}
                        onChange={(e) => setStockVendorName(e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold tracking-wider text-muted-foreground">
                        Invoice No.
                      </label>
                      <Input
                        placeholder="Invoice number"
                        value={stockInvoiceNo}
                        onChange={(e) => setStockInvoiceNo(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {(stockMovType === "OUT" || stockMovType === "RETURN") && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold tracking-wider text-muted-foreground">
                      Sales Order / Project Code Reference
                    </label>
                    <Input
                      placeholder="Order or project code"
                      value={stockOrderCode}
                      onChange={(e) => setStockOrderCode(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Reason / Note
                  </label>
                  <Textarea
                    placeholder="Enter reason or comments"
                    value={stockReason}
                    onChange={(e) => setStockReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {stockQty && (
                  <div className="p-3 border rounded-lg bg-primary/5 text-sm text-muted-foreground">
                    <div className="font-semibold text-foreground">
                      Stock Level Preview: {stockPreview.current} {stockPreview.unit} ?{' '}
                      <strong className="text-primary">{stockPreview.calculatedAfter}</strong> {stockPreview.unit}
                    </div>
                    {stockPreview.isNegative && (
                      <div className="text-rose-500 font-bold mt-1">
                        Warning: Insufficient stock after this action
                      </div>
                    )}
                  </div>
                )}

                <div className="border-t pt-4 flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStockOpen(false)}
                    disabled={stockLoading}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveStock} disabled={stockLoading}>
                    {stockLoading ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 text-sm text-muted-foreground">
              Select an item to manage stock.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
