import React, { useState, useEffect, useMemo, useRef } from "react";
import { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";
import {
  Building2,
  Search,
  Plus,
  Trash2,
  Edit,
  Eye,
  Clock,
  FileText,
  X,
  Check,
  Copy,
  Trash,
  Maximize2,
  Minimize2,
  Save,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
  RefreshCw,
  Package,
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, arrayMove, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { jsPDF } from "jspdf";
import { tenderApi, inventoryApi, securityApi } from "@/services/modules";

import { apiClient } from "@/services/axios";
import { useERPStore } from "@/store/erpStore";
import { DynamicFormRenderer } from "@/components/customFields/dynamicFormRenderer";
import {
  useDynamicCustomFields,
  validateCustomFields,
} from "@/hooks/useDynamicCustomFields";
import dynamicApi from "@/services/dynamicApi";
import { DynamicField, DynamicRecord } from "@/types/dynamic";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import "@/styles/vendors.css";

function SortableHeaderCell({
  id,
  children,
  className,
  width,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
  width?: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    width,
    minWidth: width,
  };

  return (
    <th ref={setNodeRef} style={style} className={className}>
      <div className="flex items-center gap-2">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground shrink-0"
        >
          <Package className="size-3" />
        </span>
        <span>{children}</span>
      </div>
    </th>
  );
}

// Interfaces
interface Vendor {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  gstNumber: string;
  address: string;
  notes: string;
  createdAt: string;
}

interface InventoryMaterial {
  id: string;
  materialCode: string;
  name: string;
  category: string;
  hsnCode: string;
  gst: string;
  unit: string;
  type: string;
}

interface InventoryItem {
  id: string;
  materialId: string;
  quantity: string;
  unitPrice: string;
  location: string | null;
  material: InventoryMaterial;
  currentStock?: number;
  reorderLevel?: number;
  preferredVendor?: { vendorName?: string };
  customFields?: Record<string, any>;
}

interface VendorProductAssoc {
  id: string;
  vendorId: string;
  materialId: string;
  vendorRate: number | null;
  vendorMaterialCode: string | null;
  isPreferred: boolean;
  material: InventoryMaterial;
}

interface POItem {
  id: string;
  description: string;
  qty: number;
  unit: string;
  hsnCode: string;
  catNo: string;
  rate: number;
  discountPercent: number;
  net: number;
  total: number;
  [key: string]: any; // Custom fields
}

interface PORevision {
  id: string;
  vendorId: string;
  poNumber: string;
  poDate: string;
  poStatus: string;
  paymentTerms: string;
  materialStatus: string;
  advance: number;
  remarks: string;
  cgstPercent: number;
  sgstPercent: number;
  igstPercent: number;
  subtotal: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  termsAndConditions: string;
  lineItems: POItem[];
  companyDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
    iso: string;
    signatory: string;
    division: string;
  };
  createdAt: string;
  createdBy: string;
  revisionNo: number;
  customColumns?: string[];
  referenceCode?: string;
}
interface PurchaseOrderRecord {
  id: string;
  poNo: string;
  vendorId: string;
  orderDate: string;
  expectedDelivery?: string | null;
  status?: string; // PurchaseOrderStatus enum e.g. DRAFT, ORDERED, RECEIVED
  paymentTerms?: string;
  shippingTerms?: string;
  remarks?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  items?: {
    id?: string;
    materialId: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    material?: { name: string; materialCode?: string; unit?: string; hsnCode?: string };
  }[];
  createdAt?: string;
}
// ==========================================
// API ADAPTERS (EASILY REPLACE WITH AXIOS/FETCH LATER)
// ==========================================
export const apiService = {
  vendors: {
    list: async (): Promise<Vendor[]> => {
      return tenderApi.vendors.list() as unknown as Vendor[];
    },
    create: async (
      vendor: Omit<Vendor, "id" | "createdAt">,
    ): Promise<Vendor> => {
      const companyId = useERPStore.getState().currentCompanyId;
      return tenderApi.vendors.create({
        ...vendor,
        companyId,
      }) as unknown as Vendor;
    },
    update: async (id: string, vendor: Partial<Vendor>): Promise<Vendor> => {
      const companyId = useERPStore.getState().currentCompanyId;
      return tenderApi.vendors.update!(id, {
        ...vendor,
        companyId,
      }) as unknown as Vendor;
    },
    delete: async (id: string): Promise<void> => {
      return tenderApi.vendors.remove!(id);
    },
  },
  revisions: {
    list: async (): Promise<PORevision[]> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const saved = localStorage.getItem("dvepl_po_revisions");
      return saved ? JSON.parse(saved) : [];
    },
    create: async (revision: PORevision): Promise<PORevision> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const saved = localStorage.getItem("dvepl_po_revisions");
      const list: PORevision[] = saved ? JSON.parse(saved) : [];
      list.unshift(revision);
      localStorage.setItem("dvepl_po_revisions", JSON.stringify(list));
      return revision;
    },
    delete: async (id: string): Promise<void> => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const saved = localStorage.getItem("dvepl_po_revisions");
      const list: PORevision[] = saved ? JSON.parse(saved) : [];
      const toDelete = list.find((r) => r.id === id);
      if (toDelete) {
        const trashSaved = localStorage.getItem("dvepl_po_revisions_trash");
        const trashList: PORevision[] = trashSaved
          ? JSON.parse(trashSaved)
          : [];
        (toDelete as any).deletedAt = new Date().toISOString();
        trashList.unshift(toDelete);
        localStorage.setItem(
          "dvepl_po_revisions_trash",
          JSON.stringify(trashList),
        );
      }
      const filtered = list.filter((r) => r.id !== id);
      localStorage.setItem("dvepl_po_revisions", JSON.stringify(filtered));
    },
  },
  inventory: {
    list: async (): Promise<InventoryItem[]> => {
      return inventoryApi.list() as unknown as Promise<InventoryItem[]>;
    },
  },
  vendorProducts: {
    list: async (vendorId: string): Promise<VendorProductAssoc[]> => {
      return tenderApi.vendorProducts.list(
        vendorId,
      ) as unknown as VendorProductAssoc[];
    },
    attach: async (
      vendorId: string,
      materialIds: string[],
    ): Promise<VendorProductAssoc[]> => {
      return tenderApi.vendorProducts.attach(
        vendorId,
        materialIds,
      ) as unknown as VendorProductAssoc[];
    },
    detach: async (id: string): Promise<void> => {
      return tenderApi.vendorProducts.detach(id);
    },
  },
  purchaseOrders: {
    create: async (body: any) => {
      const response = await apiClient.post(
        "/purchase-order/create",
        body,
      );

      return response.data?.data ?? response.data;
    },

    list: async () => {
      const response = await apiClient.get(
        "/purchase-order/read",
      );

      return response.data?.data ?? [];
    },

    // NEW: fetch all POs and filter client-side by vendorId (works regardless of
    // whether the backend route supports a vendorId query filter yet)
    listByVendor: async (vendorId: string): Promise<PurchaseOrderRecord[]> => {
      const response = await apiClient.get("/purchase-order/read", {
        params: { vendorId },
      });
      const all = (response.data?.data ?? []) as PurchaseOrderRecord[];
      return all.filter((po) => po.vendorId === vendorId);
    },
  },
};

export function VendorsPage() {
  const { currentCompanyId, companies } = useERPStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [revisions, setRevisions] = useState<PORevision[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [inventoryFields, setInventoryFields] = useState<DynamicField[]>([]);
  const [inventoryRecords, setInventoryRecords] = useState<DynamicRecord[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allVendorProducts, setAllVendorProducts] = useState<
    VendorProductAssoc[]
  >([]);
  const [vendorProductsLoaded, setVendorProductsLoaded] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    setInventoryLoading(true);
    try {
      const [vList, rList, invList, dynFieldsRes, dynRecordsRes] = await Promise.all([
        apiService.vendors.list(),
        apiService.revisions.list(),
        apiService.inventory.list(),
        dynamicApi.getFields("inventory"),
        dynamicApi.getRecords("inventory"),
      ]);
      if (invList[0]) {
        console.log(invList[0].material);
        console.log(invList[0].material?.name);
      }
      setVendors(vList);
      setRevisions(rList);
      setInventoryItems(invList);
      setInventoryFields((dynFieldsRes.data?.data || []).sort((a: any, b: any) => a.orderNo - b.orderNo));
      setInventoryRecords(dynRecordsRes.data?.data || []);
      console.log("Inventory Loaded");
      console.log(invList);
      console.log(invList.length);
    } catch (err: any) {
      toast.error("Failed to sync data");
    } finally {
      setLoading(false);
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // UI States
  const [globalSearch, setGlobalSearch] = useState("");
  const [fieldSearch, setFieldSearch] = useState("");
  const [productOnlySearch, setProductOnlySearch] = useState("");

  const [searchField, setSearchField] = useState<
    | "all"
    | "name"
    | "category"
    | "contactPerson"
    | "phone"
    | "email"
    | "gstNumber"
    | "products"
  >("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [overviewVendor, setOverviewVendor] = useState<Vendor | null>(null);
  const [formTab, setFormTab] = useState<"details" | "products">("details");

  // Revisions Modal States
  const [selectedVendorForRevisions, setSelectedVendorForRevisions] =
    useState<Vendor | null>(null);

  // Data Entry PO States
  const [activePoVendor, setActivePoVendor] = useState<Vendor | null>(null);
  const [isDataEntryOpen, setIsDataEntryOpen] = useState(false);
  const [deMaximized, setDeMaximized] = useState(false);
  const [customColumns, setCustomColumns] = useState<string[]>([]);
  const [newColName, setNewColName] = useState("");
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [poColumnOrder, setPoColumnOrder] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem("vendor-po-table-column-order");
      return saved ? (JSON.parse(saved) as string[]) : [];
    } catch {
      return [];
    }
  });

  const localStoragePoColumnOrderKey = "vendor-po-table-column-order";

  // Product picker (used in Vendor form)
  const [productSearch, setProductSearch] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<string>>(
    new Set(),
  );
  const [existingVendorProducts, setExistingVendorProducts] = useState<
    VendorProductAssoc[]
  >([]);

  // Inline inventory search dropdown (used directly in PO line-item rows)
  const [inventoryDropdownRowId, setInventoryDropdownRowId] = useState<
    string | null
  >(null);

  useEffect(() => {
    console.log("inventoryDropdownRowId =", inventoryDropdownRowId);
  }, [inventoryDropdownRowId]);

  // Excel import (line items)
  const excelImportInputRef = useRef<HTMLInputElement>(null);
  const [isImportingExcel, setIsImportingExcel] = useState(false);

  // Confirm Dialog States
  const [clearRowsConfirmOpen, setClearRowsConfirmOpen] = useState(false);
  const [removeColConfirmOpen, setRemoveColConfirmOpen] = useState(false);
  const [colToRemove, setColToRemove] = useState<string | null>(null);
  const [deleteRevisionConfirmOpen, setDeleteRevisionConfirmOpen] =
    useState(false);
  const [revisionToDelete, setRevisionToDelete] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // Dynamic EAV Custom Fields
  const {
    fields: vendorCustomFields,
    tableCustomColumns: vendorTableCustomCols,
  } = useDynamicCustomFields("vendor");
  const [vCustomFields, setVCustomFields] = useState<Record<string, any>>({});

  const poDefaultColumnIds = useMemo(() => {
    return [
      "sno",
      ...inventoryFields.map((f) => f.fieldName),
      "total",
      "delete",
    ];
  }, [inventoryFields]);

  const orderedPoColumnIds = useMemo(() => {
    const mergeOrder = (order: string[]) => {
      const current = order.filter((id) => poDefaultColumnIds.includes(id));
      const missing = poDefaultColumnIds.filter((id) => !current.includes(id));

      // Insert missing (new) columns at their default position instead of
      // appending them at the end (which would place them after "delete").
      const result = [...current];
      for (const id of missing) {
        const defaultIdx = poDefaultColumnIds.indexOf(id);
        // Find the nearest following column in the default order that already
        // exists in the result, and insert before it.
        let insertAt = -1;
        for (let i = defaultIdx + 1; i < poDefaultColumnIds.length; i++) {
          const pos = result.indexOf(poDefaultColumnIds[i]);
          if (pos !== -1) {
            insertAt = pos;
            break;
          }
        }
        if (insertAt === -1) {
          result.push(id);
        } else {
          result.splice(insertAt, 0, id);
        }
      }
      return result;
    };

    const merged =
      poColumnOrder.length === 0
        ? [...poDefaultColumnIds]
        : mergeOrder(poColumnOrder);

    // Always pin "sno" first, "total" before delete, and "delete" last, regardless of saved order.
    return [
      "sno",
      ...merged.filter((id) => id !== "sno" && id !== "delete" && id !== "total"),
      "total",
      "delete",
    ].filter((id) => poDefaultColumnIds.includes(id) || id === "sno" || id === "delete" || id === "total");
  }, [poColumnOrder, poDefaultColumnIds]);

  const inventoryFieldsMap = useMemo(
    () => new Map(inventoryFields.map((field) => [field.fieldName, field])),
    [inventoryFields],
  );

  const getCustomColumnName = (id: string) => id.replace(/^custom_/, "");

  const getPoColumnLabel = (id: string) => {
    switch (id) {
      case "sno":
        return "S.No.";
      case "description": {
        const nameField = inventoryFields.find(
          (f) =>
            f.label.toLowerCase().includes("name") ||
            f.label.toLowerCase().includes("desc"),
        );
        return nameField ? nameField.label : "Item Description";
      }
      case "qty":
        return "Qty";
      case "rate":
        return "Rate (₹)";
      case "discountPercent":
        return "DIS (%)";
      case "net":
        return "Net (₹)";
      case "total":
        return "Total (₹)";
      case "delete":
        return "";
      default: {
        const dynField = inventoryFieldsMap.get(id);
        if (dynField) return dynField.label;
        return getCustomColumnName(id);
      }
    }
  };

  const getPoColumnClassName = (id: string) => {
    switch (id) {
      case "sno":
        return "th-sno";
      case "description":
        return "th-desc";
      case "qty":
        return "th-qty";
      case "unit":
        return "th-unit";
      case "hsnCode":
        return "th-hsn";
      case "catNo":
        return "th-catno";
      case "rate":
        return "th-rate";
      case "discountPercent":
        return "th-dis";
      case "net":
        return "th-net";
      case "total":
        return "th-total";
      case "delete":
        return "th-del";
      default:
        return "";
    }
  };

  const getPoColumnWidth = (id: string) => {
    switch (id) {
      case "sno":
        return 50;
      case "description":
        return 240;
      case "qty":
        return 80;
      case "unit":
        return 80;
      case "hsnCode":
        return 100;
      case "catNo":
        return 100;
      case "type":
        return 100;
      case "category":
        return 120;
      case "vendor":
        return 120;
      case "stock":
        return 90;
      case "reorderLevel":
        return 90;
      case "status":
        return 90;
      case "rate":
        return 105;
      case "discountPercent":
        return 85;
      case "net":
        return 110;
      case "total":
        return 120;
      case "delete":
        return 45;
      default:
        return 130;
    }
  };

  const fullPoColumnCount = orderedPoColumnIds.length;

  const renderPoHeader = (id: string) => {
    const label = getPoColumnLabel(id);
    const className = getPoColumnClassName(id);
    const width = getPoColumnWidth(id);

    if (id === "sno" || id === "delete") {
      return (
        <th key={id} className={className} style={{ width, minWidth: width }}>
          {label}
        </th>
      );
    }

    if (id.startsWith("custom_")) {
      return (
        <SortableHeaderCell key={id} id={id} className={className} width={width}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "6px",
              width: "100%",
            }}
          >
            <span>{getCustomColumnName(id)}</span>
            <button
              type="button"
              onClick={() => handleRemoveCustomColumn(getCustomColumnName(id))}
              style={{
                color: "#ef4444",
                fontStyle: "normal",
                cursor: "pointer",
                border: "none",
                background: "none",
                fontSize: "12px",
                fontWeight: "bold",
              }}
              title={`Remove column ${getCustomColumnName(id)}`}
            >
              ✕
            </button>
          </div>
        </SortableHeaderCell>
      );
    }

    return (
      <SortableHeaderCell key={id} id={id} className={className} width={width}>
        {label}
      </SortableHeaderCell>
    );
  };

  const renderPoCell = (item: POItem, id: string, idx: number) => {
    if (id === "sno") {
      return (
        <td key={id} style={{ textAlign: "center", fontWeight: "bold" }}>
          {idx + 1}
        </td>
      );
    }

    if (inventoryFieldsMap.has(id)) {
      const field = inventoryFieldsMap.get(id);
      const val = item[id] || "";
      const isNumber = field?.type === "NUMBER";
      return (
        <td key={id} style={{ position: "relative", overflow: "visible" }}>
          <input
            type={isNumber ? "number" : "text"}
            value={val}
            onChange={(e) => {
              const typedVal = e.target.value;
              updatePoItemField(item.id, id, typedVal);
              setInventoryDropdownRowId(`${item.id}_${id}`);

              if (typedVal.trim()) {
                const matches = getInventoryMatches(typedVal);
                const exactMatch = matches.find(inv => {
                  const fieldVal = inv.values?.[id];
                  return String(fieldVal || "").trim().toLowerCase() === typedVal.trim().toLowerCase();
                });
                if (exactMatch) {
                  applyInventoryItemToRow(item.id, exactMatch);
                }
              }
            }}
            onFocus={() => setInventoryDropdownRowId(`${item.id}_${id}`)}
            onBlur={() => {
              const currentVal = item[id] || "";
              if (String(currentVal).trim()) {
                const matches = getInventoryMatches(String(currentVal));
                const exactMatch = matches.find(inv => {
                  const fieldVal = inv.values?.[id];
                  return String(fieldVal || "").trim().toLowerCase() === String(currentVal).trim().toLowerCase();
                });
                if (exactMatch) {
                  applyInventoryItemToRow(item.id, exactMatch);
                }
              }
              setTimeout(
                () =>
                  setInventoryDropdownRowId((prev) =>
                    prev === `${item.id}_${id}` ? null : prev,
                  ),
                150,
              );
            }}
            placeholder={field?.placeholder || field?.label || ""}
            autoComplete="off"
            style={isNumber ? undefined : (!String(val).trim() ? { borderColor: "#f59e0b" } : undefined)}
          />
          {inventoryDropdownRowId === `${item.id}_${id}` && (
            <div
              className="absolute left-0 top-full mt-1 w-72 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 z-50"
              onMouseDown={(e) => e.preventDefault()}
            >
              <div className="flex items-center gap-1.5 px-3 py-2 border-b bg-muted/30">
                <Package className="size-3.5 text-muted-foreground" />
                <span className="text-[11px] font-semibold text-muted-foreground">
                  INVENTORY MATCHES
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y">
                {getInventoryMatches(String(val)).length === 0 && (
                  <div className="p-3 text-center text-xs text-muted-foreground">
                    No matching inventory items.
                  </div>
                )}
                {getInventoryMatches(String(val)).map((inv) => {
                  const primaryField = inventoryFields[0];
                  const nameVal = inv.values?.[primaryField?.fieldName];
                  const displayName = nameVal || Object.values(inv.values || {})[0] || "Unnamed Item";

                  const subtitleParts = inventoryFields
                    .filter((f) => f.fieldName !== primaryField?.fieldName)
                    .map((f) => {
                      const val = inv.values?.[f.fieldName];
                      if (val === undefined || val === null || val === "") return null;
                      return `${f.label}: ${val}`;
                    })
                    .filter(Boolean);

                  const priceField = inventoryFields.find(
                    (f) =>
                      f.label.toLowerCase().includes("price") ||
                      f.label.toLowerCase().includes("rate"),
                  );
                  const priceVal = priceField
                    ? Number(inv.values?.[priceField.fieldName]) || 0
                    : 0;

                  return (
                    <button
                      type="button"
                      key={inv.id}
                      onClick={() => applyInventoryItemToRow(item.id, inv)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/40 text-left transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {displayName}
                        </div>
                        {subtitleParts.length > 0 && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {subtitleParts.join(" • ")}
                          </div>
                        )}
                      </div>
                      {priceVal > 0 && (
                        <div className="text-xs font-bold text-[#137333] shrink-0">
                          ₹{priceVal.toLocaleString("en-IN")}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </td>
      );
    }

    if (id === "qty") {
      return (
        <td key={id}>
          <input
            type="number"
            min={0.01}
            step="any"
            value={item.qty}
            onChange={(e) =>
              updatePoItemField(item.id, "qty", Number(e.target.value) || 0)
            }
            style={item.qty <= 0 ? { borderColor: "#f59e0b" } : undefined}
          />
        </td>
      );
    }

    if (id === "rate") {
      return (
        <td key={id}>
          <input
            type="number"
            value={item.rate === 0 ? "" : item.rate}
            onChange={(e) =>
              updatePoItemField(item.id, "rate", Number(e.target.value) || 0)
            }
            placeholder="0"
          />
        </td>
      );
    }

    if (id === "discountPercent") {
      return (
        <td key={id}>
          <input
            type="number"
            value={item.discountPercent === 0 ? "" : item.discountPercent}
            onChange={(e) =>
              updatePoItemField(item.id, "discountPercent", Number(e.target.value) || 0)
            }
            placeholder="0"
          />
        </td>
      );
    }

    if (id === "net") {
      return (
        <td key={id} className="td-net">
          ₹
          {(item.net || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </td>
      );
    }

    if (id === "total") {
      return (
        <td key={id} className="td-total">
          ₹
          {(item.total || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
          })}
        </td>
      );
    }

    if (id === "delete") {
      return (
        <td key={id} style={{ textAlign: "center" }}>
          <button
            type="button"
            className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md inline-flex items-center justify-center cursor-pointer"
            onClick={() => handleDeletePoRow(item.id)}
            title="Delete row"
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            <Trash2 className="size-4" />
          </button>
        </td>
      );
    }

    if (id.startsWith("custom_")) {
      const key = getCustomColumnName(id);
      return (
        <td key={id}>
          <input
            type="text"
            value={item[key] || ""}
            onChange={(e) => updatePoItemField(item.id, key, e.target.value)}
          />
        </td>
      );
    }

    return (
      <td key={id}>
        {item[id] ?? ""}
      </td>
    );
  };

  const sensors = useSensors(useSensor(PointerSensor));

  const isPoColumnDraggable = (id: string) => id !== "sno" && id !== "delete";

  const handlePoColumnDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    if (!isPoColumnDraggable(activeId) || !isPoColumnDraggable(overId)) return;

    const oldIndex = orderedPoColumnIds.indexOf(activeId);
    const newIndex = orderedPoColumnIds.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const nextOrder = arrayMove(orderedPoColumnIds, oldIndex, newIndex);
    setPoColumnOrder(nextOrder);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        localStoragePoColumnOrderKey,
        JSON.stringify(orderedPoColumnIds),
      );
    } catch {
      // ignore localStorage failures
    }
  }, [orderedPoColumnIds, localStoragePoColumnOrderKey]);

  // Vendor Form Fields
  const [vName, setVName] = useState("");
  const [vCategory, setVCategory] = useState("");
  const [vContact, setVContact] = useState("");
  const [vPhone, setVPhone] = useState("");
  const [vEmail, setVEmail] = useState("");
  const [vGst, setVGst] = useState("");
  const [vAddress, setVAddress] = useState("");
  const [vNotes, setVNotes] = useState("");

  // Vendor Form Errors
  const [vErrors, setVErrors] = useState<Record<string, string>>({});

  const validateVendorForm = (): boolean => {
    const errs: Record<string, string> = {};
    if (!vName.trim() || vName.trim().length < 2) {
      errs.name = "Vendor name must be at least 2 characters";
    }
    const email = (vEmail ?? "").trim();

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    }
    const phone = (vPhone ?? "").trim();

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      errs.phone = "Enter a valid 10-digit Indian mobile number";
    }

    const gstin = (vGst ?? "").trim().toUpperCase();

    if (gstin && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
      errs.gst = "Enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5)";
    }

    const cfErrs = validateCustomFields(vendorCustomFields, vCustomFields);
    const combinedErrs = { ...errs, ...cfErrs };
    setVErrors(combinedErrs);
    return Object.keys(combinedErrs).length === 0;
  };

  // PO Form Fields
  const [companyDetails, setCompanyDetails] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    gstin: "",
    iso: "",
    signatory: "",
    division: "",
  });
  const [poNumber, setPoNumber] = useState("");
  const [poDate, setPoDate] = useState(new Date().toISOString().split("T")[0]);
  const [poStatus, setPoStatus] = useState("Pending");
  const [paymentTerms, setPaymentTerms] = useState("30 days net");
  const [materialStatus, setMaterialStatus] = useState("Pending");
  const [referenceCode, setReferenceCode] = useState("");
  const [advance, setAdvance] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [cgstPercent, setCgstPercent] = useState(9);
  const [sgstPercent, setSgstPercent] = useState(9);
  const [igstPercent, setIgstPercent] = useState(0);
  const [terms, setTerms] = useState("");
  const [poItems, setPoItems] = useState<POItem[]>([]);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isDataEntryOpen && !selectedRevisionId) {
      const activeCompany = companies.find((c) => c.id === currentCompanyId);
      if (activeCompany) {
        setCompanyDetails({
          name: activeCompany.name || "",
          address: activeCompany.address || "",
          phone: activeCompany.phone || "",
          email: activeCompany.email || "",
          gstin: activeCompany.gst || "",
          iso: "",
          signatory: "",
          division: "",
        });
      }
    }
  }, [currentCompanyId, companies, isDataEntryOpen, selectedRevisionId]);

  // View PO preview (frontend-only)
  const [isPoPreviewOpen, setIsPoPreviewOpen] = useState(false);

  // PO Placed — send via WhatsApp or the configured SMTP service.
  const [isPoPlacedDialogOpen, setIsPoPlacedDialogOpen] = useState(false);
  const [placeSendWhatsapp, setPlaceSendWhatsapp] = useState(true);
  const [placeSendEmail, setPlaceSendEmail] = useState(false);
  const [placePhone, setPlacePhone] = useState("");

  // Filter vendors

  useEffect(() => {
    if (
      searchField === "products" ||
      productOnlySearch.trim()
    ) {
      loadAllVendorProducts();
    }
  }, [searchField, productOnlySearch, vendors]);

  const filteredVendors = useMemo(() => {
    let result = vendors;

    // 1. Apply Global Search (searches name, category, gstNumber, contactPerson)
    const globalQuery = globalSearch.trim().toLowerCase();
    if (globalQuery) {
      result = result.filter(
        (v) =>
          (v.name ?? "").toLowerCase().includes(globalQuery) ||
          (v.category ?? "").toLowerCase().includes(globalQuery) ||
          (v.gstNumber ?? "").toLowerCase().includes(globalQuery) ||
          (v.contactPerson ?? "").toLowerCase().includes(globalQuery),
      );
    }

    // 2. Apply Column-specific Search
    const columnQuery = fieldSearch.trim().toLowerCase();
    if (columnQuery && searchField !== "all") {
      if (searchField === "products") {
        const matchingVendorIds = new Set(
          allVendorProducts
            .filter(
              (a) =>
                (a.material?.name ?? "").toLowerCase().includes(columnQuery) ||
                (a.material?.materialCode ?? "").toLowerCase().includes(columnQuery) ||
                (a.material?.category ?? "").toLowerCase().includes(columnQuery) ||
                (a.vendorMaterialCode ?? "").toLowerCase().includes(columnQuery),
            )
            .map((a) => a.vendorId),
        );
        result = result.filter((v) => matchingVendorIds.has(v.id));
      } else {
        const fieldValue = (v: Vendor) => (v as any)[searchField] ?? "";
        result = result.filter((v) =>
          fieldValue(v).toString().toLowerCase().includes(columnQuery),
        );
      }
    }

    // 3. Product Search
    const productQuery = productOnlySearch.trim().toLowerCase();

    if (productQuery) {
      const matchingVendorIds = new Set(
        allVendorProducts
          .filter(
            (a) =>
              (a.material?.name ?? "")
                .toLowerCase()
                .includes(productQuery) ||

              (a.material?.materialCode ?? "")
                .toLowerCase()
                .includes(productQuery) ||

              (a.material?.category ?? "")
                .toLowerCase()
                .includes(productQuery) ||

              (a.vendorMaterialCode ?? "")
                .toLowerCase()
                .includes(productQuery)
          )
          .map((a) => a.vendorId)
      );

      result = result.filter((vendor) =>
        matchingVendorIds.has(vendor.id)
      );
    }
    return result;
  }, [vendors, globalSearch, fieldSearch, searchField, allVendorProducts, productOnlySearch]);

  // Filtered inventory for Vendor form "Products Supplied" tab
  const filteredInventoryForForm = useMemo(() => {
    if (!productSearch.trim()) return inventoryItems;
    const q = productSearch.toLowerCase();
    return inventoryItems.filter(
      (i) =>
        (i.material.name ?? "").toLowerCase().includes(q) ||
        (i.material.materialCode ?? "").toLowerCase().includes(q) ||
        (i.material.category ?? "").toLowerCase().includes(q),
    );
  }, [inventoryItems, productSearch]);

  // Inline inventory matches for a PO line-item row, based on its description text
  // Inline inventory matches for a PO line-item row, based on its description text
  const getInventoryMatches = (query: string): DynamicRecord[] => {
    const q = query.trim().toLowerCase();

    const pool = !q
      ? inventoryRecords
      : inventoryRecords.filter((rec) => {
          return Object.values(rec.values || {}).some((val) =>
            String(val || "").toLowerCase().includes(q)
          );
        });

    console.log("Search:", query);
    console.log("Pool:", pool);
    return pool.slice(0, 20);
  };

  const ALL_VENDOR_COLUMNS = useMemo(() => {
    const base = [
      { id: "name", label: "Vendor Name" },
      { id: "category", label: "Category" },
      { id: "contactPerson", label: "Contact Person" },
      { id: "phone", label: "Phone" },
      { id: "email", label: "Email" },
      { id: "gstNumber", label: "GSTIN" },
      { id: "products", label: "Products" },
      // { id: "revisions", label: "Revision History" },
      { id: "purchaseOrders", label: "Purchase Orders" },
      { id: "dataEntry", label: "Data Entry" },
    ];
    const cfCols = vendorCustomFields
      .filter((f) => f.isActive && f.showInTable)
      .map((f) => ({ id: `cf_${f.key}`, label: f.name }));
    return [...base, ...cfCols];
  }, [vendorCustomFields]);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = localStorage.getItem("vendors-table-column-visibility");
        return saved ? JSON.parse(saved) : {};
      } catch {
        return {};
      }
    },
  );

  useEffect(() => {
    setVisibleColumns((prev) => {
      const next = { ...prev };
      ALL_VENDOR_COLUMNS.forEach((col) => {
        if (next[col.id] === undefined) {
          next[col.id] = true;
        }
      });
      return next;
    });
  }, [ALL_VENDOR_COLUMNS]);

  useEffect(() => {
    localStorage.setItem(
      "vendors-table-column-visibility",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllColumns = (val: boolean) => {
    const next: Record<string, boolean> = {};
    ALL_VENDOR_COLUMNS.forEach((c) => {
      next[c.id] = val;
    });
    setVisibleColumns(next);
  };

  const loadAllVendorProducts = async () => {
    if (vendorProductsLoaded || vendors.length === 0) return;
    try {
      const results = await Promise.all(
        vendors.map((v) =>
          apiService.vendorProducts.list(v.id).catch(() => []),
        ),
      );
      setAllVendorProducts(results.flat());
      setVendorProductsLoaded(true);
    } catch {
      toast.error("Failed to load vendor products for search");
    }
  };
  // Count of products per vendor (from currently-loaded associations is per-vendor lazy;
  // for table display we keep a lightweight cache populated on demand)
  const [vendorProductCounts, setVendorProductCounts] = useState<
    Record<string, number>
  >({});

  // Products Supplied quick-view dialog
  const [productsQuickViewVendor, setProductsQuickViewVendor] =
    useState<Vendor | null>(null);
  const [productsQuickViewList, setProductsQuickViewList] = useState<
    VendorProductAssoc[]
  >([]);
  const [productsQuickViewLoading, setProductsQuickViewLoading] =
    useState(false);

  const openProductsQuickView = async (vendor: Vendor) => {
    setProductsQuickViewVendor(vendor);
    setProductsQuickViewList([]);
    setProductsQuickViewLoading(true);
    try {
      const assocs = await apiService.vendorProducts.list(vendor.id);
      setProductsQuickViewList(assocs);
      setVendorProductCounts((prev) => ({
        ...prev,
        [vendor.id]: assocs.length,
      }));
    } catch {
      toast.error("Failed to load products for this vendor");
    } finally {
      setProductsQuickViewLoading(false);
    }
  };

  // ── NEW: Purchase Orders (backend) quick-view dialog ──
  const [vendorPosViewVendor, setVendorPosViewVendor] =
    useState<Vendor | null>(null);
  const [vendorPosViewList, setVendorPosViewList] = useState<
    PurchaseOrderRecord[]
  >([]);
  const [vendorPosViewLoading, setVendorPosViewLoading] = useState(false);
  const [vendorPoCounts, setVendorPoCounts] = useState<
    Record<string, number>
  >({});

  const openVendorPurchaseOrders = async (vendor: Vendor) => {
    setVendorPosViewVendor(vendor);
    setVendorPosViewList([]);
    setVendorPosViewLoading(true);
    try {
      const list = await apiService.purchaseOrders.listByVendor(vendor.id);
      setVendorPosViewList(list);
      setVendorPoCounts((prev) => ({ ...prev, [vendor.id]: list.length }));
    } catch {
      toast.error("Failed to load purchase orders for this vendor");
    } finally {
      setVendorPosViewLoading(false);
    }
  };

  const viewPoFromRecord = (po: PurchaseOrderRecord) => {
    const localRev = revisions.find((r) => r.poNumber === po.poNo);
    if (localRev) {
      loadRevision(localRev);
    } else {
      setPoNumber(po.poNo);
      setPoDate(po.orderDate ? new Date(po.orderDate).toISOString().split("T")[0] : "");
      setPoStatus(po.status || "SENT");
      setPaymentTerms(po.paymentTerms || "");
      setMaterialStatus(po.shippingTerms || "");
      setAdvance(0);
      setRemarks(po.remarks || "");
      
      const subVal = po.subtotal ? Number(po.subtotal) : 0;
      const taxVal = po.tax ? Number(po.tax) : 0;
      if (subVal > 0 && taxVal > 0) {
        setCgstPercent(9);
        setSgstPercent(9);
        setIgstPercent(0);
      } else {
        setCgstPercent(0);
        setSgstPercent(0);
        setIgstPercent(0);
      }
      
      setTerms("");
      
      const mappedItems = (po.items || []).map((it, idx) => ({
        id: it.id || `item-${idx}`,
        description: it.material?.name || "Unknown Material",
        qty: it.quantity,
        unit: it.material?.unit || "Nos",
        hsnCode: it.material?.hsnCode || "",
        catNo: "",
        rate: Number(it.unitPrice),
        discountPercent: 0,
        net: it.quantity * Number(it.unitPrice),
        total: it.quantity * Number(it.unitPrice),
      }));
      setPoItems(mappedItems);
      setSelectedRevisionId("");
      setReferenceCode("");
      
      const activeCompany = companies.find((c) => c.id === currentCompanyId);
      setCompanyDetails({
        name: activeCompany?.name || "",
        address: activeCompany?.address || "",
        phone: activeCompany?.phone || "",
        email: activeCompany?.email || "",
        gstin: activeCompany?.gst || "",
        iso: "",
        signatory: "",
        division: "",
      });
      setCustomColumns([]);
    }
    setActivePoVendor(vendorPosViewVendor);
    setIsPoPreviewOpen(true);
  };

  // Column definitions for GenericTable
  const allTableColumns = useMemo<ColumnDef<Vendor>[]>(
    () => [
      {
        id: "name",
        accessorKey: "name",
        header: sortableHeader("Vendor Name"),
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        id: "category",
        accessorKey: "category",
        header: "Category",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "contactPerson",
        accessorKey: "contactPerson",
        header: "Contact Person",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "phone",
        accessorKey: "phone",
        header: "Phone",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "email",
        accessorKey: "email",
        header: "Email",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "gstNumber",
        accessorKey: "gstNumber",
        header: "GSTIN",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      {
        id: "products",
        header: "Products Supplied",
        cell: ({ row }) => {
          const vendor = row.original;
          const count = vendorProductCounts[vendor.id];
          return (
            <button
              onClick={() => openProductsQuickView(vendor)}
              className="bg-[#fff4e5] hover:bg-[#ffe9cc] text-[#b45309] border border-[#fcd9a8] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 inline-flex items-center gap-1"
            >
              <Package className="size-3" />
              {count !== undefined ? `${count} Products` : "View Products"}
            </button>
          );
        },
      },
      {
        id: "revisions",
        header: "Revision History",
        cell: ({ row }) => {
          const vendor = row.original;
          const count = revisions.filter(
            (r) => r.vendorId === vendor.id,
          ).length;
          return (
            <button
              onClick={() => setSelectedVendorForRevisions(vendor)}
              className="bg-[#f3f0ff] hover:bg-[#e8e3ff] text-[#5b33b5] border border-[#cbbff5] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150"
            >
              📋 Revisions ({count})
            </button>
          );
        },
      },
      {
        id: "purchaseOrders",
        header: "Purchase Orders",
        cell: ({ row }) => {
          const vendor = row.original;
          const count = vendorPoCounts[vendor.id];
          return (
            <button
              onClick={() => openVendorPurchaseOrders(vendor)}
              className="bg-[#e8f0fe] hover:bg-[#d5e4fd] text-[#1a56db] border border-[#b6cffb] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150 inline-flex items-center gap-1"
            >
              <FileText className="size-3" />
              {count !== undefined
                ? `${count} PO${count === 1 ? "" : "s"}`
                : "View POs"}
            </button>
          );
        },
      },
      {
        id: "dataEntry",
        header: "Data Entry",
        cell: ({ row }) => {
          const vendor = row.original;
          return (
            <button
              onClick={() => openNewDataEntry(vendor)}
              className="bg-[#e6f4ea] hover:bg-[#d2ebd9] text-[#137333] border border-[#a8d8b2] px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors duration-150"
            >
              ＋ Generate PO
            </button>
          );
        },
      },
    ],
    [revisions, vendorProductCounts, vendorPoCounts],
  );

  const activeColumns = useMemo<ColumnDef<Vendor>[]>(() => {
    const baseCols = allTableColumns.filter(
      (col) => visibleColumns[col.id || (col as any).accessorKey],
    );
    const cfCols = (vendorTableCustomCols as any[]).filter(
      (col) => visibleColumns[col.id],
    );
    return [...baseCols, ...cfCols] as ColumnDef<Vendor>[];
  }, [allTableColumns, visibleColumns, vendorTableCustomCols]);

  // Form operations
  const resetVendorForm = () => {
    setEditingVendor(null);
    setVName("");
    setVCategory("");
    setVContact("");
    setVPhone("");
    setVEmail("");
    setVGst("");
    setVAddress("");
    setVNotes("");
    setVCustomFields({});
    setVErrors({});
    setFormTab("details");
    setProductSearch("");
    setSelectedMaterialIds(new Set());
    setExistingVendorProducts([]);
    setIsFormOpen(false);
  };

  const openEditVendor = async (vendor: Vendor) => {
    setEditingVendor(vendor);
    setVName(vendor.name);
    setVCategory(vendor.category);
    setVContact(vendor.contactPerson);
    setVPhone(vendor.phone);
    setVEmail(vendor.email);
    setVGst(vendor.gstNumber);
    setVAddress(vendor.address);
    setVNotes(vendor.notes);
    setVCustomFields((vendor as any).customFields || {});
    setFormTab("details");
    setProductSearch("");
    setIsFormOpen(true);

    // Load existing vendor-product associations
    try {
      const assocs = await apiService.vendorProducts.list(vendor.id);
      setExistingVendorProducts(assocs);
      setSelectedMaterialIds(new Set(assocs.map((a) => a.materialId)));
      setVendorProductCounts((prev) => ({
        ...prev,
        [vendor.id]: assocs.length,
      }));
    } catch {
      setExistingVendorProducts([]);
      setSelectedMaterialIds(new Set());
    }
  };

  const toggleMaterialSelection = (materialId: string) => {
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) next.delete(materialId);
      else next.add(materialId);
      return next;
    });
  };

  const handleDetachExistingProduct = async (assoc: VendorProductAssoc) => {
    try {
      await apiService.vendorProducts.detach(assoc.id);
      setExistingVendorProducts((prev) =>
        prev.filter((a) => a.id !== assoc.id),
      );
      setSelectedMaterialIds((prev) => {
        const next = new Set(prev);
        next.delete(assoc.materialId);
        return next;
      });
      if (editingVendor) {
        setVendorProductCounts((prev) => ({
          ...prev,
          [editingVendor.id]: Math.max(0, (prev[editingVendor.id] || 1) - 1),
        }));
      }
      toast.success("Product detached from vendor");
    } catch {
      toast.error("Failed to detach product");
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateVendorForm()) {
      toast.error(
        "Please review highlighted fields and correct required details.",
      );
      return;
    }

    try {
      let vendorId = editingVendor?.id;
      if (editingVendor) {
        await apiService.vendors.update(editingVendor.id, {
          name: vName,
          category: vCategory,
          contactPerson: vContact,
          phone: vPhone,
          email: vEmail,
          gstNumber: vGst,
          address: vAddress,
          notes: vNotes,
        });
        toast.success("Vendor updated successfully");
      } else {
        const created = await apiService.vendors.create({
          name: vName,
          category: vCategory,
          contactPerson: vContact,
          phone: vPhone,
          email: vEmail,
          gstNumber: vGst,
          address: vAddress,
          notes: vNotes,
        });
        vendorId = created.id;
        toast.success("New vendor registered successfully");
      }

      if (vendorId && Object.keys(vCustomFields).length > 0) {
        await apiClient.post(`/custom-fields/values/vendor/${vendorId}`, {
          values: vCustomFields,
        });
      }

      // Attach newly-selected products (skip ones already attached)
      if (vendorId && selectedMaterialIds.size > 0) {
        const alreadyAttachedIds = new Set(
          existingVendorProducts.map((a) => a.materialId),
        );
        const toAttach = Array.from(selectedMaterialIds).filter(
          (id) => !alreadyAttachedIds.has(id),
        );
        if (toAttach.length > 0) {
          await apiService.vendorProducts.attach(vendorId, toAttach);
        }
        setVendorProductCounts((prev) => ({
          ...prev,
          [vendorId!]: selectedMaterialIds.size,
        }));
      }

      const list = await apiService.vendors.list();
      setVendors(list);
      resetVendorForm();
    } catch (err: any) {
      toast.error("Failed to save vendor");
    }
  };

  const handleDeleteVendor = (id: string) => {
    setVendorToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteVendor = async () => {
    if (!vendorToDelete) return;
    try {
      await apiService.vendors.delete(vendorToDelete);
      const list = await apiService.vendors.list();
      setVendors(list);

      const savedRev = localStorage.getItem("dvepl_po_revisions");
      if (savedRev) {
        const revList: PORevision[] = JSON.parse(savedRev);
        const toTrash = revList.filter((r) => r.vendorId === vendorToDelete);
        const remaining = revList.filter((r) => r.vendorId !== vendorToDelete);
        localStorage.setItem("dvepl_po_revisions", JSON.stringify(remaining));
        setRevisions(remaining);

        if (toTrash.length > 0) {
          const trashSaved = localStorage.getItem("dvepl_po_revisions_trash");
          const trashList: PORevision[] = trashSaved
            ? JSON.parse(trashSaved)
            : [];
          toTrash.forEach((r) => {
            (r as any).deletedAt = new Date().toISOString();
            trashList.unshift(r);
          });
          localStorage.setItem(
            "dvepl_po_revisions_trash",
            JSON.stringify(trashList),
          );
        }
      }
      toast.success("Vendor deleted successfully");
    } catch (err: any) {
      toast.error("Failed to delete vendor");
    } finally {
      setVendorToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Revisions details
  const vendorRevisions = useMemo(() => {
    if (!selectedVendorForRevisions) return [];
    return revisions
      .filter((r) => r.vendorId === selectedVendorForRevisions.id)
      .sort((a, b) => b.revisionNo - a.revisionNo);
  }, [revisions, selectedVendorForRevisions]);

  const revisionStats = useMemo(() => {
    const list = vendorRevisions;
    const totalSpent = list.reduce((sum, r) => sum + r.grandTotal, 0);
    const poCount = new Set(list.map((r) => r.poNumber)).size;
    return { poCount, totalSpent, revisionCount: list.length };
  }, [vendorRevisions]);

  // PO Calculations
  const totals = useMemo(() => {
    const subtotal = poItems.reduce((sum, item) => sum + item.total, 0);
    const cgstAmt = (subtotal * cgstPercent) / 100;
    const sgstAmt = (subtotal * sgstPercent) / 100;
    const igstAmt = (subtotal * igstPercent) / 100;
    const grandTotal = subtotal + cgstAmt + sgstAmt + igstAmt;
    const balance = grandTotal - advance;

    return { subtotal, cgstAmt, sgstAmt, igstAmt, grandTotal, balance };
  }, [poItems, cgstPercent, sgstPercent, igstPercent, advance]);

  // Line item helpers
  const handleAddPoRow = () => {
    const newItem: POItem = {
      id: `row-${Date.now()}`,
      description: "",
      qty: 1,
      rate: 0,
      discountPercent: 0,
      net: 0,
      total: 0,
      unit: "",
      hsnCode: "",
      catNo: ""
    };
    inventoryFields.forEach((f) => {
      newItem[f.fieldName] = "";
    });
    customColumns.forEach((c) => {
      newItem[c] = "";
    });
    setPoItems((prev) => [...prev, newItem]);
  };

  // Fills an existing PO line-item row in-place with the selected inventory item's details.
  const applyInventoryItemToRow = (rowId: string, invRecord: DynamicRecord) => {
    setPoItems((prev) =>
      prev.map((item) => {
        if (item.id !== rowId) return item;

        const updatedItem: POItem = {
          ...item,
          inventoryId: invRecord.id,
        };

        inventoryFields.forEach((f) => {
          updatedItem[f.fieldName] = invRecord.values?.[f.fieldName] ?? item[f.fieldName] ?? "";
        });

        const primaryField = inventoryFields[0];
        if (primaryField) {
          updatedItem.description = String(updatedItem[primaryField.fieldName] || "");
        }

        const qtyField = inventoryFields.find(
          (f) =>
            f.label.toLowerCase().includes("qty") ||
            f.label.toLowerCase().includes("quantity"),
        );
        const priceField = inventoryFields.find(
          (f) =>
            f.label.toLowerCase().includes("price") ||
            f.label.toLowerCase().includes("rate"),
        );
        const discountField = inventoryFields.find(
          (f) => f.label.toLowerCase().includes("discount"),
        );

        updatedItem.qty = qtyField ? (Number(updatedItem[qtyField.fieldName]) || 1) : (Number(item.qty) || 1);
        updatedItem.rate = priceField ? (Number(updatedItem[priceField.fieldName]) || 0) : (Number(item.rate) || 0);
        updatedItem.discountPercent = discountField ? (Number(updatedItem[discountField.fieldName]) || 0) : (Number(item.discountPercent) || 0);

        const qty = Number(updatedItem.qty) || 1;
        const rate = Number(updatedItem.rate) || 0;
        const disc = Number(updatedItem.discountPercent) || 0;
        const net = rate * (1 - disc / 100);

        updatedItem.net = net;
        updatedItem.total = qty * net;

        return updatedItem;
      }),
    );

    const primaryField = inventoryFields[0];
    const nameVal = primaryField ? invRecord.values?.[primaryField.fieldName] : "";
    toast.success(`Loaded "${nameVal || "Item"}" details from inventory`);
    setInventoryDropdownRowId(null);
  };

  // Excel import for PO line items
  const handleImportExcelClick = () => {
    excelImportInputRef.current?.click();
  };

  const getCellValue = (row: Record<string, any>, keys: string[]): string => {
    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      if (keys.includes(key.trim().toLowerCase())) {
        const v = row[key];
        return v === undefined || v === null ? "" : String(v).trim();
      }
    }
    return "";
  };

  const handleExcelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingExcel(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, {
          defval: "",
        });

        if (rows.length === 0) {
          toast.error("No data found in the selected file");
          return;
        }

        let matchedFromInventory = 0;
        const newItems: POItem[] = [];

        rows.forEach((row, idx) => {
          const newItem: POItem = {
            id: `row-${Date.now()}-${idx}`,
            description: "",
            qty: 1,
            rate: 0,
            discountPercent: 0,
            net: 0,
            total: 0,
            unit: "",
            hsnCode: "",
            catNo: ""
          };

          // Collect cell values of all columns present in this row
          const cellValues = Object.values(row).map(v => String(v || "").trim()).filter(Boolean);

          // Find if any cell value matches any field value in inventoryRecords
          let invMatch: DynamicRecord | undefined;
          if (cellValues.length > 0) {
            invMatch = inventoryRecords.find(rec => {
              return Object.values(rec.values || {}).some(val => {
                const valStr = String(val || "").trim().toLowerCase();
                if (!valStr) return false;
                return cellValues.some(cellVal => cellVal.toLowerCase() === valStr);
              });
            });
          }

          if (invMatch) {
            matchedFromInventory++;
          }

          // Populate the dynamic inventoryFields on the newItem
          inventoryFields.forEach((f) => {
            const cellVal = getCellValue(row, [
              f.label.trim().toLowerCase(),
              f.fieldName.trim().toLowerCase(),
            ]);

            if (cellVal !== "") {
              newItem[f.fieldName] = f.type === "NUMBER" ? (Number(cellVal) || 0) : cellVal;
            } else if (invMatch && invMatch.values?.[f.fieldName] !== undefined) {
              const invVal = invMatch.values[f.fieldName];
              newItem[f.fieldName] = f.type === "NUMBER" ? (Number(invVal) || 0) : String(invVal);
            } else {
              newItem[f.fieldName] = f.type === "NUMBER" ? 0 : "";
            }
          });

          // Sync description, qty, rate, net, total from the populated fields
          const nameField = inventoryFields.find(
            (f) =>
              f.label.toLowerCase().includes("name") ||
              f.label.toLowerCase().includes("desc"),
          );
          if (nameField) {
            newItem.description = String(newItem[nameField.fieldName] || "");
          } else {
            const firstField = inventoryFields[0];
            if (firstField) {
              newItem.description = String(newItem[firstField.fieldName] || "");
            }
          }

          const qtyField = inventoryFields.find(
            (f) =>
              f.label.toLowerCase().includes("qty") ||
              f.label.toLowerCase().includes("quantity"),
          );
          const priceField = inventoryFields.find(
            (f) =>
              f.label.toLowerCase().includes("price") ||
              f.label.toLowerCase().includes("rate") ||
              f.label.toLowerCase().includes("cost"),
          );

          newItem.qty = qtyField ? (Number(newItem[qtyField.fieldName]) || 1) : 1;
          newItem.rate = priceField ? (Number(newItem[priceField.fieldName]) || 0) : 0;
          newItem.net = newItem.rate;
          newItem.total = newItem.qty * newItem.net;

          const hasContent = inventoryFields.some(f => String(newItem[f.fieldName] || "").trim() !== "");
          if (hasContent) {
            newItems.push(newItem);
          }
        });

        if (newItems.length === 0) {
          toast.error(
            'No valid rows found in the selected Excel file.'
          );
          return;
        }

        setPoItems((prev) => [...prev, ...newItems]);
        toast.success(
          `Imported ${newItems.length} item(s) from Excel` +
          (matchedFromInventory > 0
            ? ` (${matchedFromInventory} matched to Inventory)`
            : "")
        );
      } catch (err) {
        console.error(err);
        toast.error(
          "Failed to read the Excel file. Please check the file format and try again."
        );
      } finally {
        setIsImportingExcel(false);
        if (excelImportInputRef.current) excelImportInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast.error("Failed to read the selected file.");
      setIsImportingExcel(false);
    };
    reader.readAsBinaryString(file);
  };

  const handleDownloadPoItemsTemplate = () => {
    const headers = inventoryFields.map((f) => f.label);
    const sampleRow = inventoryFields.map((f) => {
      if (f.type === "NUMBER") {
        if (f.label.toLowerCase().includes("qty") || f.label.toLowerCase().includes("quantity")) return 10;
        if (f.label.toLowerCase().includes("price") || f.label.toLowerCase().includes("rate")) return 100;
        return 123;
      }
      if (f.label.toLowerCase().includes("unit") || f.label.toLowerCase().includes("uom")) return "Nos";
      if (f.label.toLowerCase().includes("hsn")) return "8536";
      return `Sample ${f.label}`;
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, sampleRow]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PO Items");
    XLSX.writeFile(wb, "po_line_items_template.xlsx");
  };

  const handleDuplicateLastRow = () => {
    if (poItems.length === 0) {
      toast.error("No items to duplicate. Add a row first.");
      return;
    }
    const last = poItems[poItems.length - 1];
    const duplicated: POItem = {
      ...last,
      id: `row-${Date.now()}`,
    };
    setPoItems((prev) => [...prev, duplicated]);
    toast.success("Last row duplicated");
  };

  const handleClearAllRows = () => {
    setClearRowsConfirmOpen(true);
  };

  const updatePoItemField = (id: string, field: string, val: any) => {
    setPoItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: val };

        const primaryField = inventoryFields[0];
        if (primaryField && field === primaryField.fieldName) {
          updated.description = String(val || "");
        }

        const isQtyField = field === "qty" || inventoryFieldsMap.get(field)?.label.toLowerCase().includes("qty") || inventoryFieldsMap.get(field)?.label.toLowerCase().includes("quantity");
        const isPriceField = field === "rate" || inventoryFieldsMap.get(field)?.label.toLowerCase().includes("price") || inventoryFieldsMap.get(field)?.label.toLowerCase().includes("rate");
        const isDiscountField = field === "discountPercent" || inventoryFieldsMap.get(field)?.label.toLowerCase().includes("discount");

        if (isQtyField) {
          updated.qty = Number(val) || 0;
        }
        if (isPriceField) {
          updated.rate = Number(val) || 0;
        }
        if (isDiscountField) {
          updated.discountPercent = Number(val) || 0;
        }

        const qty = Number(updated.qty) || 0;
        const rate = Number(updated.rate) || 0;
        const disc = Number(updated.discountPercent) || 0;
        const net = rate * (1 - disc / 100);
        updated.net = net;
        updated.total = qty * net;

        return updated;
      }),
    );
  };

  const handleDeletePoRow = (id: string) => {
    setPoItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddCustomColumn = () => {
    if (!newColName.trim()) {
      toast.error("Column name is required");
      return;
    }
    const safeName = newColName.trim();
    if (customColumns.includes(safeName)) {
      toast.error("Column already exists");
      return;
    }
    setCustomColumns((prev) => [...prev, safeName]);
    setPoItems((prev) => prev.map((item) => ({ ...item, [safeName]: "" })));
    setNewColName("");
    setIsAddingCol(false);
    toast.success(`Column "${safeName}" added`);
  };

  const handleRemoveCustomColumn = (colName: string) => {
    setColToRemove(colName);
    setRemoveColConfirmOpen(true);
  };

  // Save revision
  const handleSavePoRevision = async () => {
    if (!activePoVendor) return;

    // PO header validations
    if (!poNumber.trim()) {
      toast.error("PO Number is required");
      return;
    }
    if (!poDate) {
      toast.error("PO Date is required");
      return;
    }

    // Line item validations
    if (poItems.length === 0) {
      toast.error("Add at least one line item before saving");
      return;
    }
    const invalidItems = poItems.filter(
      (item) =>
        !item.description.trim() ||
        !item.hsnCode.trim() ||
        !item.catNo.trim() ||
        item.qty <= 0 ||
        item.rate <= 0,
    );
    if (invalidItems.length > 0) {
      toast.error(
        `${invalidItems.length} line item(s) have missing details (description, HSN, CAT No.) or invalid qty/rate (must be > 0)`,
      );
      return;
    }

    // Financial validations
    if (advance < 0) {
      toast.error("Advance amount cannot be negative");
      return;
    }
    if (advance > totals.grandTotal && totals.grandTotal > 0) {
      toast.error("Advance cannot exceed the grand total");
      return;
    }

    // Get all revisions for this Vendor + PO
    const existingRevisions = revisions.filter(
      (r) => r.vendorId === activePoVendor.id && r.poNumber === poNumber,
    );

    // First revision starts from R0
    const nextRevisionNo =
      existingRevisions.length === 0
        ? 0
        : Math.max(...existingRevisions.map((r) => r.revisionNo)) + 1;

    const newRevision: PORevision = {
      id: `rev-${Date.now()}`,
      vendorId: activePoVendor.id,
      poNumber,
      poDate,
      poStatus,
      paymentTerms,
      materialStatus,
      advance,
      remarks,
      cgstPercent,
      sgstPercent,
      igstPercent,
      subtotal: totals.subtotal,
      cgstAmount: totals.cgstAmt,
      sgstAmount: totals.sgstAmt,
      igstAmount: totals.igstAmt,
      grandTotal: totals.grandTotal,
      termsAndConditions: terms,
      lineItems: poItems,
      companyDetails,
      createdAt: new Date().toISOString(),
      createdBy: useERPStore.getState().currentUserName || "Unknown User",
      revisionNo: nextRevisionNo,
      customColumns: [...customColumns],
      referenceCode,
    };

    try {

      // 1. Create Purchase Order in Backend
      await apiService.purchaseOrders.create({
        poNo: poNumber,
        vendorId: activePoVendor.id,
        orderDate: poDate,
        expectedDelivery: null, // ya jo date field hai
        paymentTerms,
        shippingTerms: "",
        remarks,

        items: poItems.map((item) => ({
          materialId: item.materialId,
          quantity: item.qty,
          unitPrice: item.rate,
        })),
      });

      // 2. Save Revision
      await apiService.revisions.create(newRevision);

      // 3. Refresh
      const list = await apiService.revisions.list();
      setRevisions(list);
      setSelectedRevisionId(newRevision.id);

      toast.success(`Revision R${newRevision.revisionNo} saved successfully`);

    } catch (err: any) {
      toast.error("Failed to save PO revision");
    }
  }

  // Load selected revision
  const loadRevision = (rev: PORevision) => {
    setPoNumber(rev.poNumber);
    setPoDate(rev.poDate);
    setPoStatus(rev.poStatus);
    setPaymentTerms(rev.paymentTerms);
    setMaterialStatus(rev.materialStatus);
    setAdvance(rev.advance);
    setRemarks(rev.remarks);
    setCgstPercent(rev.cgstPercent);
    setSgstPercent(rev.sgstPercent);
    setIgstPercent(rev.igstPercent);
    setTerms(rev.termsAndConditions);
    setPoItems(rev.lineItems);
    setCompanyDetails(rev.companyDetails);
    setSelectedRevisionId(rev.id);
    setCustomColumns(rev.customColumns || []);
    setReferenceCode(rev.referenceCode || "");
    toast.success(`Loaded PO details from revision v${rev.revisionNo}`);
  };

  const openNewDataEntry = (vendor: Vendor) => {
    setActivePoVendor(vendor);
    setPoNumber(
      `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    );
    setPoDate(new Date().toISOString().split("T")[0]);
    setPoStatus("Pending");
    setPaymentTerms("30 days net");
    setMaterialStatus("Pending");
    setReferenceCode("");
    setAdvance(0);
    setRemarks("");
    setCgstPercent(9);
    setSgstPercent(9);
    setIgstPercent(0);
    setTerms("");
    setPoItems([]);
    const activeCompany = companies.find((c) => c.id === currentCompanyId);
    setCompanyDetails({
      name: activeCompany?.name || "",
      address: activeCompany?.address || "",
      phone: activeCompany?.phone || "",
      email: activeCompany?.email || "",
      gstin: activeCompany?.gst || "",
      iso: "",
      signatory: "",
      division: "",
    });
    setSelectedRevisionId(null);
    setIsDataEntryOpen(true);
  };

  const deleteRevision = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRevisionToDelete(id);
    setDeleteRevisionConfirmOpen(true);
  };

  // Builds the printable PO HTML document from current (dynamic) form state.
  // Shared by the PDF export and the on-screen "View PO" preview.
  const buildPoDocumentHtml = (): string => {
    if (!activePoVendor) return "";

    const currentRevision = revisions.find((r) => r.id === selectedRevisionId);
    const revisionNoStr = currentRevision ? `R${currentRevision.revisionNo}` : "R0";

    const printColumns = orderedPoColumnIds.filter((id) => id !== "delete");
    const headersHtml = printColumns
      .map((id) => {
        const label = getPoColumnLabel(id);
        return `<th>${label}</th>`;
      })
      .join("");

    const itemsHtml = poItems
      .map((item, idx) => {
        const tdsHtml = printColumns
          .map((id) => {
            if (id === "sno") {
              return `<td style="text-align: center;">${idx + 1}</td>`;
            }
            const field = inventoryFieldsMap.get(id);
            const val = item[id];
            const isPrice =
              id === "net" ||
              id === "total" ||
              id === "rate" ||
              (field?.label.toLowerCase().includes("price") && typeof val === "number");
            
            const isNumber =
              field?.type === "NUMBER" ||
              id === "qty" ||
              id === "rate" ||
              id === "discountPercent" ||
              id === "net" ||
              id === "total";

            const displayVal = isPrice
              ? `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
              : val !== undefined && val !== null
              ? String(val)
              : "—";

            return `<td style="${isNumber ? "text-align: right;" : ""}">${displayVal}</td>`;
          })
          .join("");
        return `<tr>${tdsHtml}</tr>`;
      })
      .join("");

    const colSpan = printColumns.length;

    return `
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 0; color: #1f2937; line-height: 1.3; font-size: 11px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 10px; }
              .company-name { font-size: 18px; font-weight: 800; color: #1e3a8a; text-transform: uppercase; margin: 0 0 4px 0; }
              .company-address { font-size: 10.5px; color: #4b5563; margin: 0 0 2px 0; max-width: 380px; }
              .po-title { font-size: 22px; font-weight: 900; color: #111827; margin: 0 0 6px 0; text-align: right; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
              .meta-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #2563eb; margin: 0 0 4px 0; letter-spacing: 0.5px; }
              .meta-body { font-size: 11px; margin: 0; color: #1f2937; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 10.5px; }
              th { background-color: #f3f4f6; color: #374151; text-transform: uppercase; font-size: 9px; font-weight: 700; border: 1px solid #e5e7eb; padding: 6px 4px; text-align: left; }
              td { border: 1px solid #e5e7eb; padding: 6px 4px; }
              .totals-box { margin-top: 15px; float: right; width: 280px; font-size: 11px; }
              .totals-row { display: flex; justify-content: space-between; padding: 4px 0; color: #4b5563; }
              .grand-total { font-weight: 800; border-top: 1.5px double #111827; padding-top: 6px; font-size: 13px; color: #111827; }
              .terms-box { float: left; width: calc(100% - 310px); margin-top: 15px; font-size: 10px; color: #4b5563; }
              .sig-section { margin-top: 70px; display: flex; justify-content: space-between; clear: both; page-break-inside: avoid; }
              .sig-box { border-top: 1px solid #111827; padding-top: 6px; text-align: center; width: 180px; font-size: 11px; }
              .sig-title { font-weight: 700; color: #111827; margin: 0; }
              .sig-desc { font-size: 9px; color: #4b5563; margin: 1px 0 0 0; }
              @media print {
                @page { size: A4; margin: 0; }
                html, body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
                body { margin: 0; padding: 10mm; }
                * { box-shadow: none !important; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div>
                <h2 class="company-name">${companyDetails.name}</h2>
                <p class="company-address">${companyDetails.address}</p>
                <p class="company-address">Phone: ${companyDetails.phone} | Email: ${companyDetails.email}</p>
                <p class="company-address">GSTIN: ${companyDetails.gstin} | ${companyDetails.iso}</p>
                <p class="company-address">Dept: ${companyDetails.division}</p>
              </div>
              <div style="text-align: right;">
                <h1 class="po-title">PURCHASE ORDER</h1>
                <p style="margin: 0; font-size: 12px;"><strong>PO Number:</strong> ${poNumber}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Date:</strong> ${poDate}</p>
                <p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Revision:</strong> ${revisionNoStr}</p>
                ${referenceCode ? `<p style="margin: 2px 0 0 0; font-size: 12px;"><strong>Reference Code:</strong> ${referenceCode}</p>` : ""}
              </div>
            </div>

            <div class="meta-grid">
              <div>
                <h3 class="meta-title">Order Placed To (Vendor):</h3>
                <div class="meta-body">
                  <p style="margin: 0 0 2px 0; font-weight: bold; font-size: 12px;">${activePoVendor.name}</p>
                  <p style="margin: 0 0 2px 0;">Category: ${activePoVendor.category}</p>
                  <p style="margin: 0 0 2px 0;">Phone: ${activePoVendor.phone} | Email: ${activePoVendor.email}</p>
                  <p style="margin: 0 0 2px 0;">GSTIN: ${activePoVendor.gstNumber}</p>
                </div>
              </div>
              <div>
                <h3 class="meta-title">Delivery & Shipping Terms:</h3>
                <div class="meta-body">
                  <p style="margin: 0 0 2px 0;"><strong>Material Status:</strong> ${materialStatus}</p>
                  <p style="margin: 0 0 2px 0;"><strong>Payment Terms:</strong> ${paymentTerms}</p>
                  <p style="margin: 0 0 2px 0;"><strong>Remarks:</strong> ${remarks || "None"}</p>
                </div>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  ${headersHtml}
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
                ${poItems.length === 0 ? `<tr><td colspan="${colSpan}" style="text-align: center; padding: 15px; color: #6b7280;">No items added to this purchase order.</td></tr>` : ""}
              </tbody>
            </table>

            <div class="terms-box">
              <h4 style="margin: 0 0 2px 0; color: #1f2937; font-size: 11px; text-transform: uppercase;">Terms & Conditions:</h4>
              <p style="margin: 0; white-space: pre-wrap; font-size: 9.5px; line-height: 1.2;">${terms}</p>
            </div>

            <div class="totals-box">
              <div class="totals-row"><span>Subtotal:</span> <span>₹${totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>CGST (${cgstPercent}%):</span> <span>₹${totals.cgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>SGST (${sgstPercent}%):</span> <span>₹${totals.sgstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>IGST (${igstPercent}%):</span> <span>₹${totals.igstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row grand-total"><span>Grand Total:</span> <span>₹${totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row"><span>Advance Paid:</span> <span>₹${advance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
              <div class="totals-row" style="font-weight: 700; color: #111827; border-top: 1px solid #e5e7eb; padding-top: 4px;"><span>Balance Due:</span> <span>₹${totals.balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></div>
            </div>

            <div class="sig-section">
              <div class="sig-box" style="border: none; text-align: left;">
                <p class="sig-desc">Prepared By: DVEPL Team</p>
              </div>
              <div class="sig-box">
                <p class="sig-title">${companyDetails.signatory}</p>
                <p class="sig-desc">Authorized Signatory</p>
              </div>
            </div>
          </body>
        </html>
      `;
  };

  const generatePoCanvas = (): HTMLCanvasElement | null => {
    if (!activePoVendor) return null;

    const currentRevision = revisions.find((r) => r.id === selectedRevisionId);
    const revisionNoStr = currentRevision ? `R${currentRevision.revisionNo}` : "R0";

    const canvas = document.createElement('canvas');
    canvas.width = 1000;
    const dynamicHeight = 520 + (poItems.length * 32) + 260;
    canvas.height = Math.max(800, dynamicHeight);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1e3a8a'; ctx.font = 'bold 22px sans-serif'; ctx.fillText(companyDetails.name, 40, 60);
    ctx.fillStyle = '#4b5563'; ctx.font = '13px sans-serif';
    ctx.fillText(companyDetails.address, 40, 85);
    ctx.fillText(`Phone: ${companyDetails.phone} | Email: ${companyDetails.email}`, 40, 105);
    ctx.fillText(`GSTIN: ${companyDetails.gstin} | ${companyDetails.iso}`, 40, 125);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 28px sans-serif'; ctx.fillText('PURCHASE ORDER', 620, 60);
    ctx.font = '14px sans-serif';
    ctx.fillText(`PO Number: ${poNumber}`, 620, 85);
    ctx.fillText(`Date: ${poDate}`, 620, 105);
    ctx.fillText(`Revision: ${revisionNoStr}`, 620, 125);
    if (referenceCode) {
      ctx.fillText(`Ref Code: ${referenceCode}`, 620, 142);
    }
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(40, 150); ctx.lineTo(960, 150); ctx.stroke();
    ctx.fillStyle = '#2563eb'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('ORDER PLACED TO (VENDOR):', 40, 180); ctx.fillText('DELIVERY & SHIPPING TERMS:', 500, 180);
    ctx.fillStyle = '#111827'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(activePoVendor.name, 40, 205);
    ctx.font = '13px sans-serif'; ctx.fillText(`Category: ${activePoVendor.category}`, 40, 225); ctx.fillText(`Phone: ${activePoVendor.phone} | Email: ${activePoVendor.email}`, 40, 245); ctx.fillText(`GSTIN: ${activePoVendor.gstNumber}`, 40, 265);
    ctx.fillText(`Material Status: ${materialStatus}`, 500, 205); ctx.fillText(`Payment Terms: ${paymentTerms}`, 500, 225); ctx.fillText(`Remarks: ${remarks || 'None'}`, 500, 245);

    const printColumns = orderedPoColumnIds.filter((id) => id !== "delete");
    const colWidths: Record<string, number> = {
      sno: 50,
      qty: 60,
      rate: 80,
      discountPercent: 60,
      net: 90,
      total: 100,
    };
    
    const fixedWidthSum = printColumns.reduce((sum, colId) => sum + (colWidths[colId] || 0), 0);
    const dynamicColsCount = printColumns.filter((colId) => !colWidths[colId]).length;
    const defaultColWidth = dynamicColsCount > 0 ? (920 - fixedWidthSum) / dynamicColsCount : 100;
    
    let currentX = 40;
    const colPositions = printColumns.map((colId) => {
      const w = colWidths[colId] || defaultColWidth;
      const x = currentX;
      currentX += w;
      return { id: colId, x, w };
    });

    let y = 300; ctx.fillStyle = '#f3f4f6'; ctx.fillRect(40, y, 920, 32); ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 1; ctx.strokeRect(40, y, 920, 32);
    
    ctx.fillStyle = '#374151'; ctx.font = 'bold 11px sans-serif';
    colPositions.forEach((col) => {
      const label = getPoColumnLabel(col.id);
      const isRight = col.id === "rate" || col.id === "total" || col.id === "net" || inventoryFieldsMap.get(col.id)?.label.toLowerCase().includes("price");
      if (isRight) {
        ctx.textAlign = 'right';
        ctx.fillText(label, col.x + col.w - 10, y + 20);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(label, col.x + 10, y + 20);
      }
    });
    ctx.textAlign = 'left';

    ctx.fillStyle = '#1f2937'; ctx.font = '13px sans-serif';
    poItems.forEach((item, idx) => {
      y += 32;
      ctx.strokeRect(40, y, 920, 32);
      colPositions.forEach((col) => {
        const val = item[col.id];
        const field = inventoryFieldsMap.get(col.id);
        const isPrice = col.id === "net" || col.id === "total" || (field?.label.toLowerCase().includes("price") && typeof val === "number");
        const displayVal = col.id === "sno"
          ? String(idx + 1)
          : isPrice
            ? `₹${Number(val || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
            : val !== undefined && val !== null ? String(val) : "—";
            
        const isRight = col.id === "rate" || col.id === "total" || col.id === "net" || field?.label.toLowerCase().includes("price");
        
        if (isRight) {
          ctx.textAlign = 'right';
          if (col.id === "total") {
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#1e4620';
          }
          ctx.fillText(displayVal, col.x + col.w - 10, y + 20);
          ctx.font = '13px sans-serif';
          ctx.fillStyle = '#1f2937';
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(displayVal, col.x + 10, y + 20);
        }
      });
      ctx.textAlign = 'left';
    });

    y += 50; const rightX = 640; ctx.font = '13px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Subtotal:', rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`CGST (${cgstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`SGST (${sgstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 24; ctx.fillStyle = '#4b5563'; ctx.fillText(`IGST (${igstPercent}%):`, rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${totals.igstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 12; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(rightX, y); ctx.lineTo(960, y); ctx.stroke();
    y += 20; ctx.fillStyle = '#111827'; ctx.font = 'bold 14px sans-serif'; ctx.fillText('Grand Total:', rightX, y); ctx.fillStyle = '#1e4620'; ctx.fillText(`₹${totals.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 24; ctx.font = '13px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Advance Paid:', rightX, y); ctx.fillStyle = '#111827'; ctx.fillText(`₹${advance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    y += 24; ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.fillText('Balance Due:', rightX, y); ctx.fillStyle = '#1e4620'; ctx.fillText(`₹${totals.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 860, y);
    ctx.fillStyle = '#1f2937'; ctx.font = 'bold 12px sans-serif'; ctx.fillText('TERMS & CONDITIONS:', 40, y - 100); ctx.fillStyle = '#4b5563'; ctx.font = '11px sans-serif'; const termLines = terms.split('\n'); let termY = y - 80; termLines.forEach(line => { ctx.fillText(line, 40, termY); termY += 16; });
    y += 80; ctx.strokeStyle = '#111827'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(680, y); ctx.lineTo(920, y); ctx.stroke();
    y += 20; ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(companyDetails.signatory, 700, y); ctx.font = '11px sans-serif'; ctx.fillStyle = '#4b5563'; ctx.fillText('Authorized Signatory', 700, y + 16);

    return canvas;
  };

  const triggerExport = (format: string) => {
    if (!activePoVendor) return;

    if (format === "pdf") {
      const html = buildPoDocumentHtml();
      if (!html) {
        toast.error("Select a vendor first.");
        return;
      }

      // Use an offscreen iframe to print the exact same HTML as the preview
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.width = "0px";
      iframe.style.height = "0px";
      iframe.style.border = "none";
      iframe.style.left = "-9999px";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
      if (!iframeDoc) {
        toast.error("Unable to create print context.");
        document.body.removeChild(iframe);
        return;
      }

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      // Wait for content to render, then trigger print
      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          toast.error("Print failed. Please try again.");
        }
        // Clean up after a delay so print dialog can finish
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 600);
    } else {
      const canvas = generatePoCanvas();
      if (!canvas) {
        toast.error("Unable to create canvas context.");
        return;
      }
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute(
        "href",
        canvas.toDataURL(format === "png" ? "image/png" : "image/jpeg", 0.95),
      );
      downloadAnchor.setAttribute("download", `${poNumber}.${format}`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  const openPoPreview = () => {
    if (!activePoVendor) {
      toast.error("No vendor context found.");
      return;
    }
    if (poItems.length === 0) {
      toast.error("Add at least one line item to preview the PO.");
      return;
    }
    setIsPoPreviewOpen(true);
  };

  const buildPoMessageText = (): string => {
    const itemsLine =
      poItems.length === 1 ? "1 item" : poItems.length + " items";
    const lines = [
      "PURCHASE ORDER",
      "PO Number: " + poNumber,
      "Date: " + poDate,
      "Vendor: " + (activePoVendor?.name || ""),
      "Items: " + itemsLine,
      "Grand Total: Rs. " +
      totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      "Payment Terms: " + paymentTerms,
      "Material Status: " + materialStatus,
    ];
    if (remarks) lines.push("Remarks: " + remarks);
    lines.push("");
    lines.push("Please confirm receipt of this Purchase Order.");
    lines.push("");
    lines.push("- " + companyDetails.name);
    return lines.join("\n");
  };

  const openPoPlacedDialog = () => {
    if (!activePoVendor) {
      toast.error("No vendor context found.");
      return;
    }
    if (poItems.length === 0) {
      toast.error("Add at least one line item before placing the PO.");
      return;
    }
    setPlacePhone(activePoVendor.phone || "");
    setPlaceSendWhatsapp(true);
    setPlaceSendEmail(false);
    setIsPoPlacedDialogOpen(true);
  };

  const handleConfirmPoPlaced = async () => {
    if (!activePoVendor) {
      toast.error("No vendor context found.");
      return;
    }

    if (!placeSendWhatsapp && !placeSendEmail) {
      toast.error("Select at least one channel (WhatsApp or Email).");
      return;
    }
    if (placeSendWhatsapp && !placePhone.trim()) {
      toast.error("Enter a WhatsApp number to send the PO.");
      return;
    }
    if (placeSendEmail && !activePoVendor?.email?.trim()) {
      toast.error("Add an email address to the vendor before sending the PO.");
      return;
    }

    // Generate the PDF PO for user to print/save
    triggerExport("pdf");

    const message = buildPoMessageText();
    const sentChannels: string[] = [];

    if (placeSendWhatsapp) {
      const cleanPhone = placePhone.replace(/[^\d]/g, "");
      window.open(
        "https://wa.me/" + cleanPhone + "?text=" + encodeURIComponent(message),
        "_blank",
      );
      sentChannels.push("WhatsApp");
    }

    if (placeSendEmail) {
      const emailToast = toast.loading("Sending PO email to vendor...");
      const canvas = generatePoCanvas();
      if (!canvas) {
        toast.error("Unable to generate PO document for email attachment.", { id: emailToast });
        return;
      }
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [canvas.width, canvas.height]
      });
      pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
      const base64Pdf = pdf.output("datauristring").split(",")[1];
      const subject = `Purchase Order ${poNumber} from ${companyDetails.name}`;
      const emailHtml = `
        <p>Dear Vendor,</p>
        <p>Please find attached our Purchase Order <strong>${poNumber}</strong> dated ${poDate}.</p>
        <p><strong>Summary of Terms:</strong></p>
        <ul>
          <li><strong>Material Status:</strong> ${materialStatus}</li>
          <li><strong>Payment Terms:</strong> ${paymentTerms}</li>
        </ul>
        <p>Best regards,<br>${companyDetails.name}</p>
      `;

      try {
        const res = await securityApi.settings.sendPoEmail({
          vendorId: activePoVendor.id,
          subject,
          html: emailHtml,
          pdfBase64: base64Pdf,
          poNumber
        });

        if (res?.success) {
          sentChannels.push("Email");
          toast.success("PO email sent to vendor successfully!", { id: emailToast });
        } else {
          toast.error(res?.message || "Failed to send PO email.", { id: emailToast });
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || err?.message || "Error occurred while sending PO email.", { id: emailToast });
      }
    }

    if (sentChannels.length === 0) {
      return;
    }

    setPoStatus("Placed");
    toast.success(
      "PO marked as Placed - PDF generated and sent via " +
      sentChannels.join(" & "),
    );
    setIsPoPlacedDialogOpen(false);
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* ── Page Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            🏭
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              {vendors.length} registered vendors
            </p>
          </div>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2 bg-primary text-white font-semibold"
        >
          + Add Vendor
        </Button>
      </div>

      {/* ── Add/Edit Vendor Form Section ── */}
      {isFormOpen && (
        <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-4 w-full animate-in fade-in-50 duration-200">
          <div className="border-b pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                {editingVendor ? "Edit Vendor" : "Add New Vendor"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Enter vendor company details, GST, contact info, and supplied
                products
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={resetVendorForm}
            >
              <X className="size-4" />
            </Button>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 border-b">
            <button
              type="button"
              onClick={() => setFormTab("details")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors ${formTab === "details" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Vendor Details
            </button>
            <button
              type="button"
              onClick={() => setFormTab("products")}
              className={`px-4 py-2 text-xs font-semibold border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${formTab === "products" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Package className="size-3.5" />
              Products Supplied
              {selectedMaterialIds.size > 0 && (
                <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                  {selectedMaterialIds.size}
                </span>
              )}
            </button>
          </div>

          <form onSubmit={handleSaveVendor} className="w-full">
            {formTab === "details" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">
                    Vendor / Company Name *
                  </Label>
                  <Input
                    value={vName}
                    onChange={(e) => {
                      setVName(e.target.value);
                      if (vErrors.name) setVErrors((p) => ({ ...p, name: "" }));
                    }}
                    placeholder="e.g. Acme Pvt. Ltd."
                    className={
                      vErrors.name
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {vErrors.name && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {vErrors.name}
                    </p>
                  )}
                </div>
                {vendorCustomFields.some((f) => f.afterField === "name") && (
                  <div className="sm:col-span-2">
                    <DynamicFormRenderer
                      fields={vendorCustomFields}
                      values={vCustomFields}
                      onChange={(key, val) => {
                        setVCustomFields((prev) => ({ ...prev, [key]: val }));
                        if (vErrors[key])
                          setVErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      errors={vErrors}
                      afterFieldPosition="name"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Category</Label>
                  <Input
                    value={vCategory}
                    onChange={(e) => setVCategory(e.target.value)}
                    placeholder="e.g. Electrical, Mechanical"
                  />
                </div>
                {vendorCustomFields.some(
                  (f) => f.afterField === "category",
                ) && (
                    <div className="sm:col-span-2">
                      <DynamicFormRenderer
                        fields={vendorCustomFields}
                        values={vCustomFields}
                        onChange={(key, val) => {
                          setVCustomFields((prev) => ({ ...prev, [key]: val }));
                          if (vErrors[key])
                            setVErrors((prev) => ({ ...prev, [key]: "" }));
                        }}
                        errors={vErrors}
                        afterFieldPosition="category"
                      />
                    </div>
                  )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">
                    Contact Person
                  </Label>
                  <Input
                    value={vContact}
                    onChange={(e) => setVContact(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                  />
                </div>
                {vendorCustomFields.some(
                  (f) => f.afterField === "contactPerson",
                ) && (
                    <div className="sm:col-span-2">
                      <DynamicFormRenderer
                        fields={vendorCustomFields}
                        values={vCustomFields}
                        onChange={(key, val) => {
                          setVCustomFields((prev) => ({ ...prev, [key]: val }));
                          if (vErrors[key])
                            setVErrors((prev) => ({ ...prev, [key]: "" }));
                        }}
                        errors={vErrors}
                        afterFieldPosition="contactPerson"
                      />
                    </div>
                  )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    value={vPhone}
                    onChange={(e) => {
                      const digits = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setVPhone(digits);
                      if (vErrors.phone)
                        setVErrors((p) => ({ ...p, phone: "" }));
                    }}
                    placeholder="9876543210"
                    maxLength={10}
                    inputMode="numeric"
                    className={
                      vErrors.phone
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {vErrors.phone && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {vErrors.phone}
                    </p>
                  )}
                </div>
                {vendorCustomFields.some((f) => f.afterField === "phone") && (
                  <div className="sm:col-span-2">
                    <DynamicFormRenderer
                      fields={vendorCustomFields}
                      values={vCustomFields}
                      onChange={(key, val) => {
                        setVCustomFields((prev) => ({ ...prev, [key]: val }));
                        if (vErrors[key])
                          setVErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      errors={vErrors}
                      afterFieldPosition="phone"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs font-semibold">Email</Label>
                  <Input
                    type="text"
                    value={vEmail}
                    onChange={(e) => {
                      setVEmail(e.target.value);
                      if (vErrors.email)
                        setVErrors((p) => ({ ...p, email: "" }));
                    }}
                    placeholder="vendor@company.com"
                    className={
                      vErrors.email
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {vErrors.email && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {vErrors.email}
                    </p>
                  )}
                </div>
                {vendorCustomFields.some((f) => f.afterField === "email") && (
                  <div className="sm:col-span-2">
                    <DynamicFormRenderer
                      fields={vendorCustomFields}
                      values={vCustomFields}
                      onChange={(key, val) => {
                        setVCustomFields((prev) => ({ ...prev, [key]: val }));
                        if (vErrors[key])
                          setVErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      errors={vErrors}
                      afterFieldPosition="email"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">GST Number</Label>
                  <Input
                    value={vGst}
                    onChange={(e) => {
                      setVGst(e.target.value.toUpperCase());
                      if (vErrors.gst) setVErrors((p) => ({ ...p, gst: "" }));
                    }}
                    placeholder="22AAAAA0000A1Z5"
                    maxLength={15}
                    className={
                      vErrors.gst
                        ? "border-destructive focus-visible:ring-destructive"
                        : ""
                    }
                  />
                  {vErrors.gst && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" />
                      {vErrors.gst}
                    </p>
                  )}
                </div>
                {vendorCustomFields.some(
                  (f) => f.afterField === "gstNumber",
                ) && (
                    <div className="sm:col-span-2">
                      <DynamicFormRenderer
                        fields={vendorCustomFields}
                        values={vCustomFields}
                        onChange={(key, val) => {
                          setVCustomFields((prev) => ({ ...prev, [key]: val }));
                          if (vErrors[key])
                            setVErrors((prev) => ({ ...prev, [key]: "" }));
                        }}
                        errors={vErrors}
                        afterFieldPosition="gstNumber"
                      />
                    </div>
                  )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Address</Label>
                  <Input
                    value={vAddress}
                    onChange={(e) => setVAddress(e.target.value)}
                    placeholder="Full address"
                  />
                </div>
                {vendorCustomFields.some((f) => f.afterField === "address") && (
                  <div className="sm:col-span-2">
                    <DynamicFormRenderer
                      fields={vendorCustomFields}
                      values={vCustomFields}
                      onChange={(key, val) => {
                        setVCustomFields((prev) => ({ ...prev, [key]: val }));
                        if (vErrors[key])
                          setVErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      errors={vErrors}
                      afterFieldPosition="address"
                    />
                  </div>
                )}

                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold">Notes</Label>
                  <Textarea
                    value={vNotes}
                    onChange={(e) => setVNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
                {vendorCustomFields.some((f) => f.afterField === "notes") && (
                  <div className="sm:col-span-2">
                    <DynamicFormRenderer
                      fields={vendorCustomFields}
                      values={vCustomFields}
                      onChange={(key, val) => {
                        setVCustomFields((prev) => ({ ...prev, [key]: val }));
                        if (vErrors[key])
                          setVErrors((prev) => ({ ...prev, [key]: "" }));
                      }}
                      errors={vErrors}
                      afterFieldPosition="notes"
                    />
                  </div>
                )}

                {/* Dynamic EAV Custom Fields without specific afterField position or assigned to end */}
                {vendorCustomFields.some(
                  (f) => !f.afterField || f.afterField === "end",
                ) && (
                    <div className="sm:col-span-2">
                      <DynamicFormRenderer
                        fields={vendorCustomFields.filter(
                          (f) => !f.afterField || f.afterField === "end",
                        )}
                        values={vCustomFields}
                        onChange={(key, val) => {
                          setVCustomFields((prev) => ({ ...prev, [key]: val }));
                          if (vErrors[key])
                            setVErrors((prev) => ({ ...prev, [key]: "" }));
                        }}
                        errors={vErrors}
                      />
                    </div>
                  )}
              </div>
            )}

            {formTab === "products" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border rounded-xl px-3 bg-background shadow-xs focus-within:ring-1 focus-within:ring-primary">
                  <Search className="size-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products by name, code, or category..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
                  />
                </div>

                {selectedMaterialIds.size > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {inventoryItems
                      .filter((i) => selectedMaterialIds.has(i.materialId))
                      .map((i) => {
                        const existing = existingVendorProducts.find(
                          (a) => a.materialId === i.materialId,
                        );
                        return (
                          <span
                            key={i.materialId}
                            className="inline-flex items-center gap-1.5 bg-[#f3f0ff] text-[#5b33b5] border border-[#cbbff5] px-2 py-1 rounded-md text-xs font-medium"
                          >
                            {i.material.name}
                            <button
                              type="button"
                              onClick={() =>
                                existing
                                  ? handleDetachExistingProduct(existing)
                                  : toggleMaterialSelection(i.materialId)
                              }
                              className="hover:text-red-600"
                            >
                              <X className="size-3" />
                            </button>
                          </span>
                        );
                      })}
                  </div>
                )}

                <div className="border rounded-xl max-h-72 overflow-y-auto divide-y">
                  {inventoryLoading && (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Loading products…
                    </div>
                  )}
                  {!inventoryLoading &&
                    filteredInventoryForForm.length === 0 && (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No products found in inventory.
                      </div>
                    )}
                  {!inventoryLoading &&
                    filteredInventoryForForm.map((item) => {
                      const isSelected = selectedMaterialIds.has(
                        item.materialId,
                      );
                      return (
                        <label
                          key={item.id}
                          className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 cursor-pointer transition-colors"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              toggleMaterialSelection(item.materialId)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground truncate">
                                {item.material.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.material.materialCode}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.material.category || "Uncategorized"} •{" "}
                              {item.material.unit} • Stock: {item.quantity} • ₹
                              {Number(item.unitPrice).toLocaleString("en-IN")}
                            </div>
                          </div>
                        </label>
                      );
                    })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t pt-4 mt-4">
              <Button type="button" variant="outline" onClick={resetVendorForm}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Save Vendor
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search Bar & Column Visibility ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bars Container */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* 1. Global Search Bar */}
          <div className="flex items-center w-full sm:w-72 h-10 bg-card border border-primary/50 rounded-sm shadow-xs hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 overflow-hidden">
            <Search className="size-4 text-muted-foreground ml-4 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search all fields..."
              className="flex-1 h-full bg-transparent pr-4 text-sm placeholder:text-muted-foreground focus:outline-none border-none ring-0 outline-none"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
            />
          </div>

          {/* 2. Column-specific Search Bar */}
          <div className="flex items-center w-full sm:w-[360px] h-10 bg-card border border-primary/50 rounded-sm shadow-xs hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 overflow-hidden">
            <Select
              value={searchField}
              onValueChange={(val) => {
                setSearchField(val as any);
                setFieldSearch("");
              }}
            >
              <SelectTrigger className="border-none shadow-none focus:ring-0 focus:ring-offset-0 w-[125px] h-full pl-4 pr-1 text-xs font-semibold text-muted-foreground bg-transparent hover:text-foreground cursor-pointer transition-colors shrink-0">
                <SelectValue placeholder="Search in" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select Column</SelectItem>
                <SelectItem value="name">Vendor Name</SelectItem>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="contactPerson">Contact Person</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="gstNumber">GSTIN</SelectItem>
                <SelectItem value="products">Products Supplied</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-5 bg-border shrink-0" />

            <input
              type="text"
              className="flex-1 h-full bg-transparent px-3 text-sm placeholder:text-muted-foreground focus:outline-none border-none ring-0 outline-none"
              disabled={searchField === "all"}
              placeholder={
                searchField === "all"
                  ? "Select a column to filter..."
                  : `Search by ${searchField === "gstNumber"
                    ? "GSTIN"
                    : searchField === "contactPerson"
                      ? "contact person"
                      : searchField
                  }...`
              }
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center w-full sm:w-80 h-10 bg-card border border-primary/50 rounded-sm shadow-xs hover:border-primary/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-200 overflow-hidden">
            <Package className="size-4 text-muted-foreground ml-4 mr-2 shrink-0" />

            <input
              type="text"
              placeholder="Search Products..."
              className="flex-1 h-full bg-transparent pr-4 text-sm placeholder:text-muted-foreground focus:outline-none border-none ring-0 outline-none"
              value={productOnlySearch}
              onChange={(e) => setProductOnlySearch(e.target.value)}
            />

            {productOnlySearch && (
              <button
                type="button"
                onClick={() => setProductOnlySearch("")}
                className="mr-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

        </div>

        {/* Actions Container */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchAllData()}
            className="gap-2 font-medium h-10 rounded-lg px-4"
            title="Refresh Vendors"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 font-medium h-10 rounded-lg px-4"
                >
                  <SlidersHorizontal className="size-4" />
                  Customize Columns
                </Button>
              }
            />
            <PopoverContent align="end" className="w-56 p-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold text-foreground">
                    Toggle Columns
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const allSelected = ALL_VENDOR_COLUMNS.every(
                          (c) => visibleColumns[c.id],
                        );
                        toggleAllColumns(!allSelected);
                      }}
                      className="h-6 px-1.5 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                    >
                      <Checkbox
                        checked={ALL_VENDOR_COLUMNS.every(
                          (c) => visibleColumns[c.id],
                        )}
                        className="pointer-events-none size-3.5"
                      />
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAllColumns(false)}
                      className="h-6 px-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {ALL_VENDOR_COLUMNS.map((col) => {
                    const isChecked = !!visibleColumns[col.id];
                    return (
                      <label
                        key={col.id}
                        className="flex items-center gap-2.5 px-1 py-1 rounded hover:bg-muted/50 text-xs font-medium cursor-pointer transition-colors"
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleColumn(col.id)}
                        />
                        <span>{col.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* ── Vendor Table ── */}
      <GenericTable
        columns={activeColumns}
        data={filteredVendors}
        onView={(row) => setOverviewVendor(row)}
        onEdit={openEditVendor}
        onDelete={(row) => handleDeleteVendor(row.id)}
        showColumnVisibility={false}
        storageKey="vendors"
      />

      {/* ── OVERVIEW MODAL ── */}
      <Dialog
        open={!!overviewVendor}
        onOpenChange={(open) => !open && setOverviewVendor(null)}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-primary">
              <Building2 className="size-5" />
              Vendor Overview
            </DialogTitle>
          </DialogHeader>

          {overviewVendor && (
            <div className="space-y-4 pt-2 text-sm">
              <div className="bg-muted/40 p-4 rounded-xl space-y-1">
                <h3 className="text-base font-bold text-foreground">
                  {overviewVendor.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Category: {overviewVendor.category || "—"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Contact Person
                  </span>
                  <p className="font-semibold">
                    {overviewVendor.contactPerson || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Phone
                  </span>
                  <p className="font-semibold">{overviewVendor.phone || "—"}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    Email
                  </span>
                  <p className="font-semibold break-all">
                    {overviewVendor.email || "—"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    GSTIN
                  </span>
                  <p className="font-semibold">
                    {overviewVendor.gstNumber || "—"}
                  </p>
                </div>
              </div>

              <div className="space-y-1 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Address
                </span>
                <p className="text-sm">{overviewVendor.address || "—"}</p>
              </div>

              <div className="space-y-1 border-t pt-3">
                <span className="text-xs font-medium text-muted-foreground">
                  Notes
                </span>
                <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                  {overviewVendor.notes || "—"}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── VIEW PO PREVIEW (frontend-only) ── */}
      <Dialog open={isPoPreviewOpen} onOpenChange={setIsPoPreviewOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              <Eye className="size-5" />
              PO Preview — {poNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-white">
            {isPoPreviewOpen && (
              <iframe
                title="po-preview"
                srcDoc={buildPoDocumentHtml()}
                className="w-full h-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PO PLACED — send via WhatsApp/Email ── */}
      <Dialog
        open={isPoPlacedDialogOpen}
        onOpenChange={setIsPoPlacedDialogOpen}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              📨 Place PO — Send to Vendor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={placeSendWhatsapp}
                  onCheckedChange={(v) => setPlaceSendWhatsapp(!!v)}
                />
                Send via WhatsApp
              </label>
              {placeSendWhatsapp && (
                <Input
                  placeholder="Vendor WhatsApp number (with country code)"
                  value={placePhone}
                  onChange={(e) => setPlacePhone(e.target.value)}
                  className="ml-6 h-9 text-xs"
                />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={placeSendEmail}
                  onCheckedChange={(v) => setPlaceSendEmail(!!v)}
                />
                Send via Email
              </label>
              {placeSendEmail && (
                <Input
                  value={activePoVendor?.email || "No email address saved for this vendor"}
                  readOnly
                  className="ml-6 h-9 text-xs bg-muted"
                />
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              This will generate the PDF purchase order for you to save or print.
              When Email is selected, the PDF is sent to the email address saved
              on the vendor profile.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPoPlacedDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-primary text-white"
                onClick={handleConfirmPoPlaced}
              >
                Send PO
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── PRODUCTS SUPPLIED QUICK VIEW ── */}
      <Dialog
        open={!!productsQuickViewVendor}
        onOpenChange={(open) => {
          if (!open) setProductsQuickViewVendor(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              <Package className="size-5" />
              Products Supplied
            </DialogTitle>
          </DialogHeader>
          {productsQuickViewVendor && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-muted/30">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {productsQuickViewVendor.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {productsQuickViewVendor.category} • GSTIN:{" "}
                    {productsQuickViewVendor.gstNumber || "—"}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#b45309] bg-[#fff4e5] border border-[#fcd9a8] px-2.5 py-1 rounded-md">
                  {productsQuickViewList.length} product
                  {productsQuickViewList.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="border rounded-xl max-h-96 overflow-y-auto divide-y">
                {productsQuickViewLoading && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Loading products...
                  </div>
                )}
                {!productsQuickViewLoading &&
                  productsQuickViewList.length === 0 && (
                    <div className="p-6 flex flex-col items-center gap-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        This vendor has no products linked from Inventory yet.
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 h-8 text-xs cursor-pointer"
                        onClick={() => {
                          const vendor = productsQuickViewVendor;
                          setProductsQuickViewVendor(null);
                          if (vendor) {
                            openEditVendor(vendor);
                            setFormTab("products");
                          }
                        }}
                      >
                        <Package className="size-3.5" /> Attach Products from
                        Inventory
                      </Button>
                    </div>
                  )}
                {!productsQuickViewLoading &&
                  productsQuickViewList.map((assoc) => (
                    <div
                      key={assoc.id}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-foreground truncate">
                            {assoc.material.name}
                          </span>
                          {assoc.isPreferred && (
                            <span className="text-[10px] font-semibold text-[#137333] bg-[#e6f4ea] border border-[#b7e1c1] px-1.5 py-0.5 rounded">
                              PREFERRED
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          Code:{" "}
                          {assoc.vendorMaterialCode ||
                            assoc.material.materialCode}{" "}
                          • Category: {assoc.material.category || "—"} • HSN:{" "}
                          {assoc.material.hsnCode || "—"} • Unit:{" "}
                          {assoc.material.unit || "—"}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-[#137333]">
                          {(() => {
                            const invItem = inventoryItems.find(
                              (i) => i.materialId === assoc.materialId,
                            );
                            const rate = invItem
                              ? Number(invItem.unitPrice)
                              : null;
                            return rate != null && !isNaN(rate)
                              ? `₹${rate.toLocaleString("en-IN")}`
                              : "—";
                          })()}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Item Rate
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── PURCHASE ORDERS VIEW MODAL (NEW) ── */}
      <Dialog
        open={!!vendorPosViewVendor}
        onOpenChange={(open) => {
          if (!open) setVendorPosViewVendor(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-primary">
              <FileText className="size-5" />
              Purchase Orders
            </DialogTitle>
          </DialogHeader>
          {vendorPosViewVendor && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-muted/30">
                <div>
                  <div className="text-sm font-semibold text-foreground">
                    {vendorPosViewVendor.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {vendorPosViewVendor.category} • GSTIN:{" "}
                    {vendorPosViewVendor.gstNumber || "—"}
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#1a56db] bg-[#e8f0fe] border border-[#b6cffb] px-2.5 py-1 rounded-md">
                  {vendorPosViewList.length} PO
                  {vendorPosViewList.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="border rounded-xl max-h-[28rem] overflow-y-auto divide-y">
                {vendorPosViewLoading && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Loading purchase orders...
                  </div>
                )}

                {!vendorPosViewLoading && vendorPosViewList.length === 0 && (
                  <div className="p-6 flex flex-col items-center gap-2 text-center">
                    <span className="text-xs text-muted-foreground">
                      No purchase orders found for this vendor yet.
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-xs cursor-pointer"
                      onClick={() => {
                        const vendor = vendorPosViewVendor;
                        setVendorPosViewVendor(null);
                        if (vendor) openNewDataEntry(vendor);
                      }}
                    >
                      <Plus className="size-3.5" /> Generate PO
                    </Button>
                  </div>
                )}

                {!vendorPosViewLoading &&
                  vendorPosViewList.map((po) => (
                    <div key={po.id} className="px-3 py-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold text-foreground truncate">
                              {po.poNo}
                            </span>
                            {po.status && (
                              <span className="text-[10px] font-semibold text-[#5b33b5] bg-[#f3f0ff] border border-[#cbbff5] px-1.5 py-0.5 rounded">
                                {po.status}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            Date:{" "}
                            {po.orderDate
                              ? new Date(po.orderDate).toLocaleDateString(
                                "en-IN",
                              )
                              : "—"}{" "}
                            • Items: {po.items?.length ?? 0} • Payment:{" "}
                            {po.paymentTerms || "—"}
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <div>
                            <div className="text-sm font-bold text-[#137333]">
                              {po.total != null
                                ? `₹${Number(po.total).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}`
                                : "—"}
                            </div>
                            <div className="text-[10px] text-muted-foreground leading-none">
                              Grand Total
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-primary hover:text-primary hover:bg-primary/10 px-2 py-0.5 mt-1 flex items-center gap-1 cursor-pointer"
                            onClick={() => viewPoFromRecord(po)}
                          >
                            <Eye className="size-3.5" /> View Details
                          </Button>
                        </div>
                      </div>

                      {po.items && po.items.length > 0 && (
                        <div className="mt-2 rounded-md bg-muted/30 divide-y">
                          {po.items.map((it, idx) => (
                            <div
                              key={it.id || idx}
                              className="flex items-center justify-between px-2 py-1.5 text-xs"
                            >
                              <span className="truncate">
                                {it.material?.name || it.materialId}
                              </span>
                              <span className="text-muted-foreground shrink-0">
                                {it.quantity} {it.material?.unit || ""} × ₹
                                {Number(it.unitPrice).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── REVISIONS PANEL MODAL ── */}
      {selectedVendorForRevisions && (
        <div
          className="rev-panel-overlay"
          onClick={() => setSelectedVendorForRevisions(null)}
        >
          <div className="rev-panel" onClick={(e) => e.stopPropagation()}>
            <div className="rev-panel-header">
              <h3>📋 Revision History</h3>
              <button
                className="de-close-btn"
                onClick={() => setSelectedVendorForRevisions(null)}
              >
                ✕
              </button>
            </div>

            {/* Vendor info */}
            <div className="rev-vinfo">
              <div className="rev-vinfo-name">
                {selectedVendorForRevisions.name}
              </div>
              <div className="rev-vinfo-sub">
                {selectedVendorForRevisions.category} &bull; GSTIN:{" "}
                {selectedVendorForRevisions.gstNumber}
              </div>
            </div>

            {/* Summary */}
            <div className="rev-summary">
              <div className="rev-sum-card">
                <div className="rev-sum-label">Total POs</div>
                <div className="rev-sum-val">{revisionStats.poCount}</div>
              </div>
              <div className="rev-sum-card">
                <div className="rev-sum-label">Revisions</div>
                <div
                  className="rev-sum-val"
                  style={{ color: "var(--primary, #3b82f6)" }}
                >
                  {revisionStats.revisionCount}
                </div>
              </div>
            </div>

            {/* Revision list */}
            <div className="rev-panel-body">
              {vendorRevisions.map((rev) => (
                <div key={rev.id} className="rev-row">
                  <div className="rev-badge">
                    <span className="rev-badge-lbl">REV</span>
                    <span className="rev-badge-val">{rev.revisionNo}</span>
                  </div>
                  <div className="rev-info">
                    <div className="rev-label-row">
                      <span className="rev-name">{rev.poNumber}</span>
                      {rev.revisionNo === vendorRevisions[0].revisionNo ? (
                        <span className="rev-latest-badge">LATEST</span>
                      ) : (
                        <span className="rev-saved-badge">SAVED REVISION</span>
                      )}
                    </div>
                    <div className="rev-meta">
                      <span>Date: {rev.poDate}</span>
                      <span>Items: {rev.lineItems.length}</span>
                      <span>Status: {rev.poStatus}</span>
                    </div>
                    <div className="rev-meta">
                      <span>Created By: {rev.createdBy || "Unknown User"}</span>
                      <span>
                        Created On:{" "}
                        {rev.createdAt
                          ? new Date(rev.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          : "—"}
                      </span>
                    </div>
                    <div className="rev-amount">
                      ₹
                      {rev.grandTotal.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="rev-actions">
                    <button
                      className="btn-rev-load"
                      onClick={() => {
                        loadRevision(rev);
                        setActivePoVendor(selectedVendorForRevisions);
                        setIsDataEntryOpen(true);
                        setSelectedVendorForRevisions(null);
                      }}
                    >
                      Load
                    </button>
                    <button
                      className="btn-rev-del"
                      onClick={(e) => deleteRevision(rev.id, e)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              {vendorRevisions.length === 0 && (
                <div className="rev-empty">
                  <div className="rev-empty-icon">📂</div>
                  <span>
                    No revisions found. Create a PO data entry revision first.
                  </span>
                </div>
              )}
            </div>

            <div className="rev-panel-footer">
              <Button
                variant="outline"
                onClick={() => setSelectedVendorForRevisions(null)}
              >
                Close
              </Button>
              <button
                className="bg-primary text-white font-semibold hover:bg-primary/95 px-4 py-2 rounded-lg text-xs"
                onClick={() => {
                  openNewDataEntry(selectedVendorForRevisions);
                  setSelectedVendorForRevisions(null);
                }}
              >
                + Generate PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DATA ENTRY MODAL ── */}
      {isDataEntryOpen && activePoVendor && (
        <div
          className="de-overlay"
          style={deMaximized ? { padding: 0 } : undefined}
        >
          <div
            className={`de-modal ${deMaximized ? "rounded-none" : ""}`}
            style={
              deMaximized
                ? {
                  width: "100vw",
                  height: "100vh",
                  maxWidth: "100vw",
                  maxHeight: "100vh",
                }
                : undefined
            }
          >
            {/* Restore bar if maximized */}
            {deMaximized && (
              <div className="de-restore-bar">
                <span>
                  ⛶ Table Maximized —{" "}
                  <strong id="de-restore-vendor-name">
                    {activePoVendor.name}
                  </strong>
                </span>
                <button
                  className="de-restore-btn"
                  onClick={() => setDeMaximized(false)}
                >
                  ✕ Restore
                </button>
              </div>
            )}

            {/* de-header */}
            <div className="de-header">
              <div className="de-header-left">
                <div className="de-header-icon">📋</div>
                <div>
                  <div className="de-header-title">
                    Data Entry — Purchase Order
                  </div>
                  <div className="de-header-sub">
                    Vendor:{" "}
                    <strong className="de-vendor-accent">
                      {activePoVendor.name}
                    </strong>
                  </div>
                </div>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span className="de-status-pill">Draft</span>
                <button
                  className="de-close-btn"
                  onClick={() => setIsDataEntryOpen(false)}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* de-steps */}
            <div className="de-steps">
              <div className="de-step done">
                <span className="de-step-dot done-dot">✓</span>
                <span>Vendor Saved</span>
              </div>
              <div className="de-step-line done-line"></div>
              <div className="de-step active">
                <span className="de-step-dot active-dot">2</span>
                <span>Data Entry</span>
              </div>
              <div className="de-step-line"></div>
              <div className="de-step inactive">
                <span className="de-step-dot inactive-dot">3</span>
                <span>Export</span>
              </div>
            </div>

            {/* de-revision-bar */}
            <div className="de-revision-bar">
              <span className="de-rev-label">📁 REVISIONS:</span>
              <div className="de-rev-pills">
                {revisions
                  .filter(
                    (r) =>
                      r.vendorId === activePoVendor.id &&
                      r.poNumber === poNumber,
                  )
                  .map((rev) => (
                    <span
                      key={rev.id}
                      onClick={() => loadRevision(rev)}
                      className={`de-rev-pill ${selectedRevisionId === rev.id ? "active" : ""}`}
                    >
                      R{rev.revisionNo}
                    </span>
                  ))}
                {revisions.filter(
                  (r) =>
                    r.vendorId === activePoVendor.id && r.poNumber === poNumber,
                ).length === 0 && <span className="de-rev-pill">R0</span>}
              </div>
              <button
                className="btn-view-all"
                style={{ marginLeft: "auto" }}
                onClick={() => {
                  setSelectedVendorForRevisions(activePoVendor);
                  setIsDataEntryOpen(false);
                }}
              >
                📄 View All
              </button>
            </div>

            {/* Form body */}
            <div className="flex-1 overflow-y-auto">
              {/* de-company-section */}
              <div className="de-company-section">
                <div className="de-company-section-title">
                  🏢 OUR COMPANY DETAILS (FOR PO HEADER)
                </div>
                <div className="de-company-grid">
                  <div className="de-po-field">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={companyDetails.name}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          name: e.target.value,
                        })
                      }
                      placeholder="e.g. D.V. Electromatic Pvt. Ltd."
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Company Address</label>
                    <input
                      type="text"
                      value={companyDetails.address}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          address: e.target.value,
                        })
                      }
                      placeholder="F-003, Industrial Growth Centre…"
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Company Phone</label>
                    <input
                      type="text"
                      value={companyDetails.phone}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          phone: e.target.value,
                        })
                      }
                      placeholder="+91 92572-17609"
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Company Email</label>
                    <input
                      type="text"
                      value={companyDetails.email}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          email: e.target.value,
                        })
                      }
                      placeholder="office@dvepl.com"
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Company GSTIN</label>
                    <input
                      type="text"
                      value={companyDetails.gstin}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          gstin: e.target.value,
                        })
                      }
                      placeholder="03AABCD4308A1ZL"
                    />
                  </div>
                  <div className="de-po-field">
                    <label>ISO / Certification</label>
                    <input
                      type="text"
                      value={companyDetails.iso}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          iso: e.target.value,
                        })
                      }
                      placeholder="AN ISO 9001:2008 CERTIFIED CO."
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Authorized Signatory</label>
                    <input
                      type="text"
                      value={companyDetails.signatory}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          signatory: e.target.value,
                        })
                      }
                      placeholder="Name of signatory"
                    />
                  </div>
                  <div className="de-po-field">
                    <label>Division / Dept</label>
                    <input
                      type="text"
                      value={companyDetails.division}
                      onChange={(e) =>
                        setCompanyDetails({
                          ...companyDetails,
                          division: e.target.value,
                        })
                      }
                      placeholder="Industrial Division"
                    />
                  </div>
                </div>
              </div>

              {/* de-po-header */}
              <div className="de-po-header">
                <div className="de-po-field">
                  <label>Order Place To</label>
                  <input
                    type="text"
                    value={activePoVendor.name}
                    disabled
                    style={{
                      background: "#f1f5f9",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                </div>
                <div className="de-po-field">
                  <label>PO Number *</label>
                  <input
                    type="text"
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="e.g. PO-2025-001"
                    style={
                      !poNumber.trim() ? { borderColor: "#f59e0b" } : undefined
                    }
                  />
                  {!poNumber.trim() && (
                    <span
                      style={{
                        color: "#f59e0b",
                        fontSize: "11px",
                        marginTop: "2px",
                      }}
                    >
                      PO Number is required
                    </span>
                  )}
                </div>
                <div className="de-po-field">
                  <label>PO Date *</label>
                  <input
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    style={!poDate ? { borderColor: "#f59e0b" } : undefined}
                  />
                  {!poDate && (
                    <span
                      style={{
                        color: "#f59e0b",
                        fontSize: "11px",
                        marginTop: "2px",
                      }}
                    >
                      PO Date is required
                    </span>
                  )}
                </div>
                <div className="de-po-field">
                  <label>Reference Code</label>
                  <input
                    type="text"
                    value={referenceCode}
                    onChange={(e) => setReferenceCode(e.target.value)}
                    placeholder="e.g. REF-2026-001"
                  />
                </div>
                <div className="de-po-field">
                  <label>PO Status</label>
                  <select
                    value={poStatus}
                    onChange={(e) => setPoStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="Partially Received">
                      Partially Received
                    </option>
                    <option value="Received">Received</option>
                  </select>
                </div>
                <div className="de-po-field">
                  <label>Payment Terms</label>
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g. 30 days net / 50% Advance"
                  />
                </div>
                <div className="de-po-field">
                  <label>Material Status</label>
                  <select
                    value={materialStatus}
                    onChange={(e) => setMaterialStatus(e.target.value)}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Ordered">Ordered</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Received">Received</option>
                    <option value="Ready for Dispatch">
                      Ready for Dispatch
                    </option>
                  </select>
                </div>
                <div className="de-po-field">
                  <label>Advance (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={advance}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setAdvance(val);
                    }}
                    placeholder="0.00"
                    style={
                      advance > totals.grandTotal && totals.grandTotal > 0
                        ? { borderColor: "#ef4444" }
                        : undefined
                    }
                  />
                  {advance > totals.grandTotal && totals.grandTotal > 0 && (
                    <span
                      style={{
                        color: "#ef4444",
                        fontSize: "11px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        marginTop: "2px",
                      }}
                    >
                      ⚠ Advance exceeds grand total
                    </span>
                  )}
                </div>
                <div className="de-po-field">
                  <label>Remarks</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Any remarks…"
                  />
                </div>
              </div>

              {/* de-tax-section */}
              <div className="de-tax-section">
                <span className="de-tax-label">📊 TAX:</span>
                <div className="de-tax-field">
                  <label>CGST %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={cgstPercent}
                    onChange={(e) =>
                      setCgstPercent(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      )
                    }
                  />
                </div>
                <div className="de-tax-field">
                  <label>SGST %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={sgstPercent}
                    onChange={(e) =>
                      setSgstPercent(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      )
                    }
                  />
                </div>
                <div className="de-tax-field">
                  <label>IGST %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={igstPercent}
                    onChange={(e) =>
                      setIgstPercent(
                        Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                      )
                    }
                  />
                </div>
                <div className="de-fin-sep"></div>
                <div className="de-fin-item">
                  <span>Subtotal:</span>{" "}
                  <strong>
                    ₹
                    {totals.subtotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div className="de-fin-sep"></div>
                <div className="de-fin-item">
                  <span>CGST:</span>{" "}
                  <strong>
                    ₹
                    {totals.cgstAmt.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div className="de-fin-item">
                  <span>SGST:</span>{" "}
                  <strong>
                    ₹
                    {totals.sgstAmt.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div className="de-fin-item">
                  <span>IGST:</span>{" "}
                  <strong>
                    ₹
                    {totals.igstAmt.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
                <div className="de-fin-sep"></div>
                <div className="de-fin-item">
                  <span>Grand Total:</span>{" "}
                  <strong style={{ color: "#1e4620", fontSize: "15px" }}>
                    ₹
                    {totals.grandTotal.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>

              {/* de-terms-section */}
              <div className="de-terms-section">
                <div className="de-terms-title">
                  📜 TERMS &amp; CONDITIONS (SHOWN ON PO)
                </div>
                <textarea
                  className="de-terms-textarea"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  placeholder="Terms..."
                ></textarea>
              </div>

              {/* de-toolbar */}
              <div className="de-toolbar">
                <span className="de-toolbar-label">LINE ITEMS</span>
                <button className="de-tbtn" onClick={handleAddPoRow}>
                  ➕ Add Row
                </button>
                <button
                  className="de-tbtn"
                  onClick={handleImportExcelClick}
                  disabled={isImportingExcel}
                >
                  {isImportingExcel ? "⏳ Importing..." : "📥 Import Excel"}
                </button>
                <button
                  className="de-tbtn"
                  onClick={handleDownloadPoItemsTemplate}
                  title="Download an Excel template for bulk item import"
                >
                  📄 Template
                </button>
                <input
                  ref={excelImportInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={handleExcelFileChange}
                />
                <button className="de-tbtn" onClick={handleDuplicateLastRow}>
                  📋 Duplicate Last
                </button>


                <div className="de-tbtn-sep"></div>
                <button
                  className="de-tbtn de-tbtn-danger"
                  onClick={handleClearAllRows}
                >
                  🗑️ Clear All
                </button>
                <div style={{ flex: 1 }}></div>
                <span className="de-row-count">{poItems.length} items</span>
                <div className="de-tbtn-sep"></div>
                <button
                  className="de-tbtn de-maximize-btn"
                  onClick={() => setDeMaximized(!deMaximized)}
                >
                  ⛶ Maximize
                </button>
              </div>

              {/* de-table-wrap */}
              <div className="de-table-wrap">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handlePoColumnDragEnd}
                >
                  <SortableContext
                    items={orderedPoColumnIds}
                    strategy={horizontalListSortingStrategy}
                  >
                    <table className="de-table">
                      <thead>
                        <tr>
                          {orderedPoColumnIds.map((id) => renderPoHeader(id))}
                        </tr>
                      </thead>

                      <tbody>
                        {poItems.map((item, idx) => (
                          <tr key={item.id}>
                            {orderedPoColumnIds.map((id) =>
                              renderPoCell(item, id, idx),
                            )}
                          </tr>
                        ))}
                        {poItems.length === 0 && (
                          <tr>
                            <td
                              colSpan={orderedPoColumnIds.length}
                              style={{
                                padding: "24px",
                                textAlign: "center",
                                color: "#9ca3af",
                                fontSize: "14px",
                              }}
                            >
                              No items added yet. Click "Add Item" or search/type in the description to start.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="de-tfoot-row">
                          <td colSpan={orderedPoColumnIds.length} className="p-3 text-right">
                            <div className="flex items-center justify-end gap-6 text-sm font-bold text-foreground">
                              <span>
                                Total items:{" "}
                                <span id="de-total-items" className="text-primary">{poItems.length}</span>
                              </span>
                              <span>
                                Grand Total (excl. tax):{" "}
                                <span id="de-grand-total" className="text-[#137333]">
                                  ₹{totals.subtotal.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </SortableContext>
                </DndContext>
              </div>
            </div>

            {/* de-finance-bar */}
            <div className="de-finance-bar">
              <div className="de-fin-item">
                <span>Total Amount:</span>{" "}
                <strong id="de-total-amt">
                  ₹
                  {totals.grandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="de-fin-sep"></div>
              <div className="de-fin-item">
                <span>Advance:</span>{" "}
                <strong id="de-adv-display" className="de-fin-adv">
                  ₹
                  {advance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
              <div className="de-fin-sep"></div>
              <div className="de-fin-item">
                <span>Balance:</span>{" "}
                <strong id="de-bal-display" className="de-fin-bal">
                  ₹
                  {totals.balance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </strong>
              </div>
            </div>

            {/* de-footer */}
            <div className="de-footer">
              <div className="de-export-section">
                <div className="de-export-label">EXPORT AS:</div>
                <div className="de-export-btns">
                  <button
                    className="de-exp-btn"
                    onClick={() => triggerExport("pdf")}
                  >
                    <span className="de-exp-icon">📕</span>
                    <span className="de-exp-name">PDF</span>
                    <span className="de-exp-ext">.pdf</span>
                  </button>
                  <button
                    className="de-exp-btn"
                    onClick={() => triggerExport("png")}
                  >
                    <span className="de-exp-icon">🖼️</span>
                    <span className="de-exp-name">PNG</span>
                    <span className="de-exp-ext">.png</span>
                  </button>
                  <button
                    className="de-exp-btn"
                    onClick={() => triggerExport("jpeg")}
                  >
                    <span className="de-exp-icon">📷</span>
                    <span className="de-exp-name">JPEG</span>
                    <span className="de-exp-ext">.jpeg</span>
                  </button>
                </div>
              </div>
              <div className="de-footer-actions">
                <button
                  className="de-tbtn"
                  style={{ padding: "10px 18px", fontSize: "13.5px" }}
                  onClick={() => toast.success("Skipped")}
                >
                  ⏭️ Skip
                </button>
                <button
                  className="de-tbtn"
                  style={{ padding: "10px 18px", fontSize: "13.5px" }}
                  onClick={() => setIsDataEntryOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="de-tbtn"
                  style={{ padding: "10px 18px", fontSize: "13.5px" }}
                  onClick={openPoPreview}
                >
                  👁️ View PO
                </button>
                <button className="btn-save-rev" onClick={handleSavePoRevision}>
                  ✅ PO Ready
                </button>
                <button
                  className="btn-export-pdf"
                  style={{ background: "#0f766e" }}
                  onClick={openPoPlacedDialog}
                >
                  📨 PO Placed
                </button>
                <button
                  className="btn-export-pdf"
                  onClick={() => triggerExport("pdf")}
                >
                  📘 Export PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Move Vendor to Recycle Bin?"
        description="This vendor will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin."
        confirmText="Move to Bin"
        onConfirm={confirmDeleteVendor}
      />

      <ConfirmDialog
        open={clearRowsConfirmOpen}
        onOpenChange={setClearRowsConfirmOpen}
        title="Clear All Line Items?"
        description="All line items in this PO draft will be removed. This only affects the current draft and can be re-added before saving."
        confirmText="Clear All"
        variant="warning"
        onConfirm={() => {
          setPoItems([]);
        }}
      />

      <ConfirmDialog
        open={removeColConfirmOpen}
        onOpenChange={setRemoveColConfirmOpen}
        title="Remove Column?"
        description={`The column "${colToRemove}" will be removed from this PO draft. Column data in unsaved rows will be lost.`}
        confirmText="Remove Column"
        variant="warning"
        onConfirm={() => {
          if (!colToRemove) return;
          setCustomColumns((prev) => prev.filter((c) => c !== colToRemove));
          setPoItems((prev) =>
            prev.map((item) => {
              const updated = { ...item };
              delete updated[colToRemove];
              return updated;
            }),
          );
          toast.success(`Column "${colToRemove}" removed`);
          setColToRemove(null);
        }}
      />

      <ConfirmDialog
        open={deleteRevisionConfirmOpen}
        onOpenChange={setDeleteRevisionConfirmOpen}
        title="Delete PO Revision?"
        description="This saved PO revision will be removed. Only the revision record is deleted — the vendor remains in the system."
        confirmText="Delete Revision"
        onConfirm={async () => {
          if (!revisionToDelete) return;
          try {
            await apiService.revisions.delete(revisionToDelete);
            const list = await apiService.revisions.list();
            setRevisions(list);
            if (selectedRevisionId === revisionToDelete) {
              setSelectedRevisionId(null);
            }
            toast.success("Revision deleted successfully.");
          } catch (err: any) {
            toast.error("Failed to delete revision.");
          } finally {
            setRevisionToDelete(null);
          }
        }}
      />
    </div>
  );
}

export default VendorsPage;
