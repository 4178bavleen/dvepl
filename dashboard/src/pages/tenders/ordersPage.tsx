import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  XCircle,
  Users,
  UserPlus,
  ExternalLink,
  Eye,
} from "lucide-react";

import {
  GenericTable,
  sortableHeader,
} from "@/components/tables/genericTable";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Checkbox } from "@/components/ui/checkbox";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { apiClient } from "@/services/axios";
import { toast } from "react-hot-toast";
import { useERPStore } from "@/store/erpStore";
import {
  SalesOrderAssignModal,
  SalesOrderAssignment,
} from "./components/SalesOrderAssignModal";

// ============================================================
// API RESPONSE SHAPE
// ============================================================

interface RawQuoteTenderOrder {
  name: string;
  email_id: string;
  mobile: string;
  firm_name: string;
  tender_no: string;
  department_name: string;
  name_of_work: string;
  remarked_at: string;
  file_name: string | null;
  t_id: number;
  section_name: string;
  division_name: string;
  subdivision: string;
  tenderID: string;
  remark: string;
  reference_code: string;
  state_name: string | null;
  city_name: string | null;
}

// ============================================================
// TABLE ROW SHAPE
// ============================================================

interface QuoteTenderOrder extends RawQuoteTenderOrder {
  id: string;
  dveplCode?: string;
  drawingAttached: boolean;
  drawings?: Array<{
    id: string;
    drawingNo: string;
    title: string;
    fileName: string;
    fileUrl: string;
  }>;
  poStatus?: string;
  poNumber?: string;
  assignments?: SalesOrderAssignment[];
}

// ============================================================
// AVAILABLE COLUMNS
// ============================================================

const ALL_COLUMN_KEYS = [
  { id: "tenderNo", label: "TENDER NO" },
  { id: "nameOfWork", label: "NAME OF WORK" },
  { id: "firmName", label: "FIRM NAME" },
  { id: "assignedUsers", label: "ASSIGNED TO" },
  { id: "contactPerson", label: "Name" },
  { id: "mobile", label: "MOBILE" },
  { id: "email", label: "EMAIL" },
  { id: "departmentName", label: "DEPARTMENT" },
  { id: "sectionName", label: "SECTION" },
  { id: "divisionName", label: "DIVISION" },
  { id: "subdivision", label: "SUB DIVISION" },
  { id: "stateCity", label: "STATE / CITY" },
  { id: "tenderID", label: "TENDER ID" },
  { id: "referenceCode", label: "REFERENCE CODE" },
  { id: "poStatus", label: "PO STATUS" },
  { id: "remark", label: "REMARK" },
  { id: "remarkedAt", label: "REMARKED AT" },
  { id: "drawingAttached", label: "DRAWING" },
  { id: "fileName", label: "FILE" },
] as const;

type ColumnKey = (typeof ALL_COLUMN_KEYS)[number]["id"];

const EMPTY_ARRAY: QuoteTenderOrder[] = [];

// ============================================================
// GENERIC TABLE TYPE WORKAROUND
// ============================================================

const TenderTable = GenericTable as unknown as React.ComponentType<{
  columns: ColumnDef<QuoteTenderOrder>[];
  data: QuoteTenderOrder[];
  onView?: (row: QuoteTenderOrder) => void;
  onEdit?: (row: QuoteTenderOrder) => void;
  onDelete?: (row: QuoteTenderOrder) => void;
  isLoading?: boolean;
  showColumnVisibility?: boolean;
  storageKey?: string;
}>;

// ============================================================
// DETAIL ITEM COMPONENT
// ============================================================

function DetailItem({
  label,
  value,
  className = "",
  multiline = false,
}: {
  label: string;
  value: string | number | null | undefined;
  className?: string;
  multiline?: boolean;
}) {
  const displayValue =
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
      ? String(value)
      : "—";

  return (
    <div
      className={`rounded-xl border bg-card px-4 py-3 min-w-0 ${className}`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>

      <p
        className={`mt-1.5 text-sm font-semibold text-foreground break-words ${
          multiline ? "leading-6 whitespace-pre-wrap" : ""
        }`}
      >
        {displayValue}
      </p>
    </div>
  );
}

// ============================================================
// SECTION TITLE COMPONENT
// ============================================================

function DetailSectionTitle({
  title,
  color = "bg-primary",
}: {
  title: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`h-7 w-1 rounded-full ${color}`} />

      <h3 className="text-sm font-bold uppercase tracking-wide">
        {title}
      </h3>
    </div>
  );
}

// ============================================================
// PARSERS
// ============================================================

function parseSalesOrderRemarks(remarks: string) {
  const fields = {
    workName: "",
    department: "",
    section: "",
    division: "",
    subDivision: "",
    location: "",
    tenderId: "",
    referenceCode: "",
    fileName: "",
  };
  if (!remarks) return fields;

  const lines = remarks.split("\n");
  lines.forEach((line) => {
    const parts = line.split(":");
    if (parts.length >= 2) {
      const key = parts[0].trim().toLowerCase();
      const val = parts.slice(1).join(":").trim();
      if (key === "work") fields.workName = val;
      else if (key === "department") fields.department = val;
      else if (key === "section") fields.section = val;
      else if (key === "division") fields.division = val;
      else if (key === "sub division") fields.subDivision = val;
      else if (key === "location") fields.location = val;
      else if (key === "tender id") fields.tenderId = val;
      else if (key === "reference code") fields.referenceCode = val;
      else if (key === "file name") fields.fileName = val;
    }
  });
  return fields;
}

function parseContactDetails(contactDetails: string) {
  const parts = (contactDetails || "").split("|").map(p => p.trim());
  return {
    name: parts[0] || "",
    mobile: parts[1] || "",
    email: parts[2] || "",
  };
}

// ============================================================
// PAGE
// ============================================================

export function OrdersPage() {
  const store = useERPStore();

  const currentUser = useMemo(() => {
    return store.users.find((user) => user.id === store.currentUserId) as any;
  }, [store.users, store.currentUserId]);

  const currentUserId = store.currentUserId || currentUser?.id || null;

  const isAdmin = Boolean(
    currentUser?.role?.toLowerCase?.().includes("admin") ||
    currentUser?.name?.toLowerCase?.().includes("admin")
  );

  const isOrderAssignedToCurrentUser = useCallback(
    (order: QuoteTenderOrder | null | undefined) => {
      if (!order || !currentUserId) return false;
      return (order.assignments || []).some(
        (assignment) => assignment.userId === currentUserId
      );
    },
    [currentUserId]
  );

  const navigate = useNavigate();
  const [quoteTenders, setQuoteTenders] =
    useState<QuoteTenderOrder[]>(EMPTY_ARRAY);

  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [filterRemark, setFilterRemark] = useState<string>("");

  const [sortBy, setSortBy] = useState<string>("date-newest");

  // Selected tender for centered overview dialog
  const [viewingTender, setViewingTender] =
    useState<QuoteTenderOrder | null>(null);

  // Selected tender for user assignment modal
  const [assigningTender, setAssigningTender] =
    useState<QuoteTenderOrder | null>(null);

  const [isSyncing, setIsSyncing] = useState(false);

  // ============================================================
  // COLUMN VISIBILITY
  // ============================================================

  const [visibleColumns, setVisibleColumns] = useState<
    Record<string, boolean>
  >(() => {
    try {
      const saved = localStorage.getItem(
        "quote-tender-table-column-visibility"
      );

      if (saved) {
        const parsed = JSON.parse(saved);
        ALL_COLUMN_KEYS.forEach((col) => {
          if (parsed[col.id] === undefined) {
            parsed[col.id] = true;
          }
        });
        return parsed;
      }
    } catch {
      // Fall back to defaults
    }

    const initial: Record<string, boolean> = {};

    ALL_COLUMN_KEYS.forEach((col) => {
      initial[col.id] = true;
    });

    return initial;
  });

  useEffect(() => {
    localStorage.setItem(
      "quote-tender-table-column-visibility",
      JSON.stringify(visibleColumns)
    );
  }, [visibleColumns]);

  // ============================================================
  // LOAD DATA
  // ============================================================

  const loadQuoteTenders = useCallback(async () => {
    setIsLoading(true);

    try {
      // 1. Fetch backend purchase orders
      let backendPOs: any[] = [];
      try {
        const poRes = await apiClient.get("/purchase-order/read");
        if (poRes.data?.success) {
          backendPOs = poRes.data.data ?? [];
        }
      } catch (err) {
        console.error("Error loading purchase orders:", err);
      }

      // 2. Fetch PO revisions from backend database
      let dbRevisions: any[] = [];
      try {
        const revRes = await apiClient.get("/purchase-order/revisions/list");
        if (revRes.data?.success) {
          dbRevisions = revRes.data.data ?? [];
        }
      } catch (err) {
        console.error("Error loading revisions:", err);
      }

      const response = await apiClient.get("/order/read?page=1&limit=100");

      if (response.data?.success) {
        const rawSalesOrders = response.data?.data ?? [];

        const rows: QuoteTenderOrder[] = rawSalesOrders.map((order: any) => {
          const remarksFields = parseSalesOrderRemarks(order.remarks || "");
          const contactFields = parseContactDetails(order.contactDetails || "");
          const refCode = remarksFields.referenceCode || "";

          // Resolve PO Status
          const matchedRev = dbRevisions.find(
            (rev) => rev.referenceCode && String(rev.referenceCode).trim() === String(refCode).trim()
          );
          const matchedPO = backendPOs.find(
            (po) => po.referenceCode && String(po.referenceCode).trim() === String(refCode).trim()
          );

          let poStatus = "No PO";
          let poNumber = "";

          if (matchedRev) {
            poStatus = matchedRev.poStatus;
            poNumber = matchedRev.poNumber;
          } else if (matchedPO) {
            poStatus = matchedPO.status; // e.g. DRAFT, APPROVED, SENT, etc.
            poNumber = matchedPO.poNo;

            // Map backend status to human-readable/friendly
            if (poStatus === "DRAFT") poStatus = "Draft";
            else if (poStatus === "APPROVED") poStatus = "Approved";
            else if (poStatus === "SENT") poStatus = "Sent";
            else if (poStatus === "PARTIAL_RECEIVED") poStatus = "Partially Received";
            else if (poStatus === "COMPLETED") poStatus = "Received";
            else if (poStatus === "CANCELLED") poStatus = "Cancelled";
          }

          return {
            id: order.id,
            dveplCode: order.dveplCode || "",
            t_id: order.dveplCode ? parseInt(order.dveplCode.replace(/\D/g, ""), 10) || 0 : 0,
            tender_no: order.caNo || "",
            name_of_work: remarksFields.workName || "",
            firm_name: order.partyName || "",
            name: contactFields.name || "",
            mobile: contactFields.mobile || "",
            email_id: contactFields.email || "",
            department_name: remarksFields.department || "",
            section_name: remarksFields.section || "",
            division_name: remarksFields.division || "",
            subdivision: remarksFields.subDivision || "",
            state_name: remarksFields.location || "",
            city_name: null,
            tenderID: remarksFields.tenderId || "",
            reference_code: refCode,
            poStatus,
            poNumber,
            remark: order.status || "",
            remarked_at: order.createdAt || "",
            drawingAttached: order.engineeringProjects?.some((proj: any) => proj.drawings?.length > 0) || false,
            drawings: order.engineeringProjects?.flatMap((proj: any) => proj.drawings || []) || [],
            file_name: remarksFields.fileName || null,
            assignments: order.assignments || [],
          };
        });

        setQuoteTenders(rows);
        setViewingTender((prev) => {
          if (!prev) return null;
          const updated = rows.find((r) => r.id === prev.id);
          return updated || prev;
        });
        setAssigningTender((prev) => {
          if (!prev) return null;
          const updated = rows.find((r) => r.id === prev.id);
          return updated || prev;
        });
      } else {
        toast.error(
          response.data?.message ??
            "Unable to load orders."
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          "Unable to load orders."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuoteTenders();
  }, [loadQuoteTenders]);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    const syncToast = toast.loading("Syncing orders from portal...");
    try {
      const response = await apiClient.get("/quotetender/read");
      if (response.data?.success) {
        const syncedCount = response.data?.syncedCount ?? 0;
        toast.success(`Successfully synced ${syncedCount} new orders!`, {
          id: syncToast,
        });
        // Reload list
        await loadQuoteTenders();
      } else {
        toast.error(
          response.data?.message ?? "Unable to sync orders.",
          { id: syncToast }
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Failed to sync orders from portal.",
        { id: syncToast }
      );
    } finally {
      setIsSyncing(false);
    }
  }, [loadQuoteTenders]);

  // ============================================================
  // COLUMN CONTROLS
  // ============================================================

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const setAllColumns = (val: boolean) => {
    const updated: Record<string, boolean> = {};

    ALL_COLUMN_KEYS.forEach((col) => {
      updated[col.id] = val;
    });

    setVisibleColumns(updated);
  };

  // ============================================================
  // REMARK FILTER OPTIONS
  // ============================================================

  const remarkOptions = useMemo(() => {
    const set = new Set<string>();

    quoteTenders.forEach((t) => {
      if (t.remark) {
        set.add(t.remark);
      }
    });

    return Array.from(set);
  }, [quoteTenders]);

  // ============================================================
  // SEARCH / FILTER / SORT
  // ============================================================

  const processedTenders = useMemo(() => {
    let list = [...quoteTenders];

    const q = search.trim().toLowerCase();

    if (q) {
      list = list.filter((item) =>
        [
          item.name,
          item.email_id,
          item.mobile,
          item.firm_name,
          item.tender_no,
          item.department_name,
          item.name_of_work,
          item.section_name,
          item.division_name,
          item.subdivision,
          item.tenderID,
          item.reference_code,
          item.remark,
          item.state_name,
          item.city_name,
          item.poStatus,
          item.poNumber,
        ]
          .filter(Boolean)
          .some((val) =>
            String(val).toLowerCase().includes(q)
          )
      );
    }

    if (filterRemark) {
      list = list.filter(
        (item) =>
          (item.remark || "").toLowerCase() ===
          filterRemark.toLowerCase()
      );
    }

    if (sortBy === "date-newest") {
      list.sort(
        (a, b) =>
          new Date(b.remarked_at).getTime() -
          new Date(a.remarked_at).getTime()
      );
    } else if (sortBy === "date-oldest") {
      list.sort(
        (a, b) =>
          new Date(a.remarked_at).getTime() -
          new Date(b.remarked_at).getTime()
      );
    } else if (sortBy === "firm-asc") {
      list.sort((a, b) =>
        (a.firm_name || "").localeCompare(
          b.firm_name || ""
        )
      );
    }

    return list;
  }, [quoteTenders, search, filterRemark, sortBy]);

  // ============================================================
  // STATISTICS
  // ============================================================

  const totalTenders = quoteTenders.length;

  const acceptedCount = useMemo(
    () =>
      quoteTenders.filter(
        (t) =>
          (t.remark || "").toLowerCase() === "accepted"
      ).length,
    [quoteTenders]
  );

  const rejectedCount = useMemo(
    () =>
      quoteTenders.filter(
        (t) =>
          (t.remark || "").toLowerCase() === "rejected"
      ).length,
    [quoteTenders]
  );

  const uniqueFirms = useMemo(
    () =>
      new Set(
        quoteTenders.map((t) => t.firm_name)
      ).size,
    [quoteTenders]
  );

  // ============================================================
  // TABLE COLUMNS
  // ============================================================

  const tableColumns =
    useMemo<ColumnDef<QuoteTenderOrder>[]>(() => {
      const allDefs: Record<
        string,
        ColumnDef<QuoteTenderOrder>
      > = {
        tenderNo: {
          accessorKey: "tender_no",
          header: sortableHeader("TENDER NO"),
          cell: ({ getValue }) => (
            <span className="font-semibold text-foreground">
              {(getValue() as string) || "—"}
            </span>
          ),
        },

        nameOfWork: {
          accessorKey: "name_of_work",
          header: "NAME OF WORK",
          cell: ({ getValue }) => {
            const val =
              (getValue() as string) || "—";

            return (
              <span
                className="line-clamp-2 max-w-[260px] inline-block"
                title={val}
              >
                {val}
              </span>
            );
          },
        },

        firmName: {
          accessorKey: "firm_name",
          header: sortableHeader("FIRM NAME"),
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        assignedUsers: {
          id: "assignedUsers",
          header: "ASSIGNED TO",
          cell: ({ row }) => {
            const item = row.original;
            const assignments = item.assignments || [];

            return (
              <div className="flex items-center gap-1.5 min-w-[140px]">
                {assignments.length > 0 ? (
                  <div
                    className="flex items-center -space-x-1.5 overflow-hidden max-w-[120px]"
                    title={assignments.map((a) => a.user?.name || a.userId).join(", ")}
                  >
                    {assignments.slice(0, 2).map((a, idx) => (
                      <span
                        key={a.id || a.userId || idx}
                        className="inline-flex items-center justify-center size-6 rounded-full bg-primary/10 border-2 border-background text-[10px] font-bold text-primary shrink-0 uppercase"
                      >
                        {(a.user?.name || "U").charAt(0)}
                      </span>
                    ))}
                    {assignments.length > 2 && (
                      <span className="inline-flex items-center justify-center size-6 rounded-full bg-muted border-2 border-background text-[9px] font-bold text-muted-foreground shrink-0">
                        +{assignments.length - 2}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-[11px] font-medium text-muted-foreground italic">
                    Unassigned
                  </span>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!isAdmin}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isAdmin) return;
                    setAssigningTender(item);
                  }}
                  className="size-7 rounded-md hover:bg-primary/10 hover:text-primary transition-colors ml-auto shrink-0"
                  title={isAdmin ? "Assign Users" : "Only administrators can manage assignments"}
                >
                  <Users className="size-3.5" />
                </Button>
              </div>
            );
          },
        },

        contactPerson: {
          accessorKey: "name",
          header: "Name",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        mobile: {
          accessorKey: "mobile",
          header: "MOBILE",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        email: {
          accessorKey: "email_id",
          header: "EMAIL",
          cell: ({ getValue }) => (
            <span className="truncate max-w-[180px] inline-block">
              {(getValue() as string) || "—"}
            </span>
          ),
        },

        departmentName: {
          accessorKey: "department_name",
          header: "DEPARTMENT",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        sectionName: {
          accessorKey: "section_name",
          header: "SECTION",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        divisionName: {
          accessorKey: "division_name",
          header: "DIVISION",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        subdivision: {
          accessorKey: "subdivision",
          header: "SUB DIVISION",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        stateCity: {
          id: "stateCity",
          header: "STATE / CITY",
          cell: ({ row }) => {
            const item = row.original;

            const parts = [
              item.city_name,
              item.state_name,
            ].filter(Boolean);

            return parts.length > 0
              ? parts.join(", ")
              : "—";
          },
        },

        tenderID: {
          accessorKey: "tenderID",
          header: "TENDER ID",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        referenceCode: {
          accessorKey: "reference_code",
          header: "REFERENCE CODE",
          cell: ({ getValue }) =>
            (getValue() as string) || "—",
        },

        poStatus: {
          accessorKey: "poStatus",
          header: "PO STATUS",
          cell: ({ row }) => {
            const val = String(row.original.poStatus || "No PO");
            const poNo = row.original.poNumber;
            const refCode = row.original.reference_code;

            const badge: Record<string, string> = {
              ready: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
              "needs revision": "bg-rose-500/15 text-rose-500 border-rose-500/20",
              placed: "bg-blue-500/15 text-blue-500 border-blue-500/20",
              ordered: "bg-indigo-500/15 text-indigo-500 border-indigo-500/20",
              pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
              "no po": "bg-muted text-muted-foreground border-muted-foreground/20",
            };

            return (
              <div className="flex flex-col gap-1 items-start">
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                    badge[val.toLowerCase()] || "bg-muted text-muted-foreground"
                  }`}
                >
                  {val}
                </span>
                {poNo && (
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {poNo}
                  </span>
                )}
                {refCode && (
                  <button
                    onClick={() => {
                      const mode = val === "No PO" ? "generate" : "view";
                      navigate(`/purchase/vendors?ref=${encodeURIComponent(refCode)}&mode=${mode}`);
                    }}
                    className="text-[10px] text-primary hover:underline font-semibold mt-0.5 flex items-center gap-0.5"
                  >
                    {val === "No PO" ? "＋ Generate PO" : "📂 View/Edit PO"}
                  </button>
                )}
              </div>
            );
          },
        },

        remark: {
          accessorKey: "remark",
          header: "REMARK",

          cell: ({ getValue }) => {
            const val = String(
              getValue() || "—"
            );

            const badge: Record<string, string> = {
              accepted:
                "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",

              rejected:
                "bg-rose-500/15 text-rose-500 border-rose-500/20",

              pending:
                "bg-amber-500/15 text-amber-500 border-amber-500/20",
            };

            return (
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                  badge[val.toLowerCase()] ||
                  "bg-muted text-muted-foreground"
                }`}
              >
                {val}
              </span>
            );
          },
        },

        remarkedAt: {
          accessorKey: "remarked_at",
          header: sortableHeader("REMARKED AT"),

          cell: ({ getValue }) => {
            const val = getValue() as string;

            return val
              ? new Date(val).toLocaleString("en-IN")
              : "—";
          },
        },

        drawingAttached: {
          id: "drawingAttached",
          header: "DRAWING",
          cell: ({ row }) => {
            const drawings = row.original.drawings || [];
            if (drawings.length === 0) {
              return (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground bg-muted/30 px-2.5 py-1 rounded border border-muted/20">
                  <XCircle className="size-3.5" />
                  No
                </span>
              );
            }

            return (
              <Popover>
                <PopoverTrigger
                  render={
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-[11px] font-bold text-emerald-600 border-emerald-200 hover:border-emerald-300 bg-emerald-50 hover:bg-emerald-100 transition-all duration-150 px-2.5 rounded"
                    >
                      <CheckCircle2 className="size-3.5" />
                      {drawings.length} {drawings.length === 1 ? "Drawing" : "Drawings"}
                    </Button>
                  }
                />
                <PopoverContent align="center" className="w-80 p-4 space-y-3 z-50">
                  <div className="border-b pb-2">
                    <h4 className="font-semibold text-sm text-foreground">
                      Attached Drawings ({drawings.length})
                    </h4>
                  </div>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {drawings.map((dwg) => {
                      const backendUrl = apiClient.defaults.baseURL?.replace("/admin", "") || "";
                      const fullUrl = dwg.fileUrl.startsWith("http") ? dwg.fileUrl : `${backendUrl}${dwg.fileUrl}`;
                      return (
                        <div
                          key={dwg.id}
                          className="flex items-center justify-between gap-2 p-2 border rounded-md hover:bg-muted/30 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate" title={dwg.drawingNo}>
                              {dwg.drawingNo}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate" title={dwg.title || dwg.fileName}>
                              {dwg.title || dwg.fileName || "Untitled Drawing"}
                            </p>
                          </div>
                          {dwg.fileUrl && (
                            <a
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center size-7 rounded-md border bg-background hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                              title="Open Drawing"
                            >
                              <Eye className="size-3.5" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          },
        },

        fileName: {
          accessorKey: "file_name",
          header: "FILE",

          cell: ({ getValue }) => {
            const val =
              getValue() as string | null;

            if (!val || val === "null") {
              return "—";
            }

            return (
              <span
                className="truncate max-w-[160px] inline-flex items-center gap-1"
                title={val}
              >
                <FileText className="size-3.5 text-muted-foreground shrink-0" />
                {val}
              </span>
            );
          },
        },
      };

      return (Object.keys(allDefs) as ColumnKey[])
        .filter((key) => visibleColumns[key])
        .map((key) => allDefs[key]);
    }, [visibleColumns, isAdmin]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">

      {/* ========================================================
          HEADER
          ======================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orders
          </h1>
        </div>

        <Button
          variant="outline"
          onClick={() =>
            void loadQuoteTenders()
          }
          className="gap-2"
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {/* ========================================================
          METRIC CARDS
          ======================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {/* Total */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-blue-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-blue-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tenders
            </p>

            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <FileText className="size-5" />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight">
            {totalTenders}
          </p>
        </div>

        {/* Accepted */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accepted
            </p>

            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight">
            {acceptedCount}
          </p>
        </div>

        {/* Rejected */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-rose-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-rose-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejected
            </p>

            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
              <XCircle className="size-5" />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight">
            {rejectedCount}
          </p>
        </div>

        {/* Firms */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-amber-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-amber-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Firms
            </p>

            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Users className="size-5" />
            </div>
          </div>

          <p className="mt-3 text-3xl font-bold tracking-tight">
            {uniqueFirms}
          </p>
        </div>
      </div>

      {/* ========================================================
          TOOLBAR
          ======================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3">

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] border border-input rounded-md px-3 bg-background focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-muted-foreground" />

          <Input
            placeholder="Search tender no, firm, work, department..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">

          {/* Sync Portal Orders */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-1.5 h-8 border-primary/30 hover:border-primary/60 text-primary hover:bg-primary/5 transition-all duration-200"
          >
            <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing..." : "Sync Portal Orders"}
          </Button>

          {/* Fields */}
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8"
                />
              }
            >
              <SlidersHorizontal className="size-3.5" />
              Fields
            </PopoverTrigger>

            <PopoverContent
              align="end"
              className="w-64 p-3 space-y-3"
            >
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs">
                  Show / Hide Columns
                </span>

                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    className="text-primary hover:underline font-semibold"
                    onClick={() =>
                      setAllColumns(true)
                    }
                  >
                    All
                  </button>

                  <button
                    type="button"
                    className="text-muted-foreground hover:underline font-semibold"
                    onClick={() =>
                      setAllColumns(false)
                    }
                  >
                    None
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                {ALL_COLUMN_KEYS.map((col) => (
                  <label
                    key={col.id}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={
                        visibleColumns[col.id] ??
                        true
                      }
                      onCheckedChange={() =>
                        toggleColumn(col.id)
                      }
                    />

                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Remark Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">
              REMARK:
            </span>

            <Select
              value={filterRemark}
              onValueChange={(val) =>
                setFilterRemark(val ?? "")
              }
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="">
                  All
                </SelectItem>

                {remarkOptions.map((r) => (
                  <SelectItem
                    key={r}
                    value={r}
                  >
                    {r.charAt(0).toUpperCase() +
                      r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">
              SORT:
            </span>

            <Select
              value={sortBy}
              onValueChange={(val) =>
                setSortBy(
                  val ?? "date-newest"
                )
              }
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="date-newest">
                  Date Newest
                </SelectItem>

                <SelectItem value="date-oldest">
                  Date Oldest
                </SelectItem>

                <SelectItem value="firm-asc">
                  Firm A-Z
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN TABLE
          ======================================================== */}

      <TenderTable
        columns={tableColumns}
        data={processedTenders}
        onView={setViewingTender}
        isLoading={isLoading}
        showColumnVisibility={false}
        storageKey="quote-tender-orders"
      />

      {/* ========================================================
          CENTERED OVERVIEW DIALOG
          ======================================================== */}

      <Dialog
        open={Boolean(viewingTender)}
        onOpenChange={(open) => {
          if (!open) {
            setViewingTender(null);
          }
        }}
      >
        <DialogContent
          className="
            w-[calc(100%-2rem)]
            sm:max-w-3xl
            lg:max-w-5xl
            max-h-[90vh]
            overflow-hidden
            p-0
            gap-0
          "
        >
          {viewingTender && (
            <>
              {/* ==================================================
                  DIALOG HEADER
                  ================================================== */}

              <DialogHeader className="px-6 py-5 border-b bg-muted/20">
                <div className="flex items-start justify-between gap-4 pr-8">

                  <div className="min-w-0">
                    <DialogTitle className="text-xl font-bold">
                      Tender Overview
                    </DialogTitle>

                    <DialogDescription className="mt-1">
                      Complete information for tender{" "}
                      <span className="font-semibold text-foreground">
                        {viewingTender.tender_no ||
                          "—"}
                      </span>
                    </DialogDescription>
                  </div>

                  {/* Status */}
                  <span
                    className="
                      shrink-0
                      text-xs
                      font-bold
                      px-3
                      py-1.5
                      rounded-full
                      border
                      bg-primary/10
                      text-primary
                      uppercase
                    "
                  >
                    {viewingTender.remark || "—"}
                  </span>
                </div>
              </DialogHeader>

              {/* ==================================================
                  SCROLLABLE CONTENT
                  ================================================== */}

              <div className="overflow-y-auto max-h-[calc(90vh-110px)] px-6 py-6">

                <div className="space-y-7">

                  {/* ==================================================
                      BASIC INFORMATION
                      ================================================== */}

                  <section>
                    <DetailSectionTitle
                      title="Basic Information"
                      color="bg-primary"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                      <DetailItem
                        label="Tender Number"
                        value={
                          viewingTender.tender_no
                        }
                      />

                      <DetailItem
                        label="Tender ID"
                        value={
                          viewingTender.tenderID
                        }
                      />

                      <DetailItem
                        label="Reference Code"
                        value={
                          viewingTender.reference_code
                        }
                      />

                      <DetailItem
                        label="Remark"
                        value={
                          viewingTender.remark
                        }
                      />

                      <DetailItem
                        label="Name of Work"
                        value={
                          viewingTender.name_of_work
                        }
                        multiline
                        className="md:col-span-2"
                      />
                    </div>
                  </section>

                  {/* ==================================================
                      ASSIGNED USERS
                      ================================================== */}

                  <section className="border-t pt-7">
                    <div className="flex items-center justify-between mb-4">
                      <DetailSectionTitle
                        title="Assigned Users"
                        color="bg-purple-500"
                      />

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!isAdmin}
                        onClick={() => {
                          if (!isAdmin) return;
                          setAssigningTender(viewingTender);
                        }}
                        title={isAdmin ? "Manage Assignments" : "Only administrators can manage assignments"}
                        className="gap-1.5 h-8 text-xs font-semibold border-purple-500/30 text-purple-600 dark:text-purple-400 hover:bg-purple-500/10"
                      >
                        <Users className="size-3.5" />
                        Manage Assignments
                      </Button>
                    </div>

                    <div className="rounded-xl border bg-card p-4">
                      {viewingTender.assignments && viewingTender.assignments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {viewingTender.assignments.map((assignment, idx) => (
                            <div
                              key={assignment.id || assignment.userId || idx}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-muted/20 text-xs font-semibold"
                            >
                              <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px] uppercase">
                                {(assignment.user?.name || "U").charAt(0)}
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {assignment.user?.name || "User ID: " + assignment.userId}
                                </p>
                                {assignment.user?.email && (
                                  <p className="text-[10px] text-muted-foreground">
                                    {assignment.user.email}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-muted-foreground p-2">
                          <span>No users are currently assigned to this order.</span>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={!isAdmin}
                            onClick={() => {
                              if (!isAdmin) return;
                              setAssigningTender(viewingTender);
                            }}
                            title={isAdmin ? "Assign Users" : "Only administrators can manage assignments"}
                            className="h-7 text-xs font-semibold"
                          >
                            + Assign Now
                          </Button>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* ==================================================
                      WORK ACCESS
                      ================================================== */}
                  <section className="border-t pt-7">
                    <DetailSectionTitle
                      title="Work Access"
                      color={
                        isOrderAssignedToCurrentUser(viewingTender)
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }
                    />

                    <div
                      className={`rounded-xl border p-4 ${
                        isOrderAssignedToCurrentUser(viewingTender)
                          ? "border-emerald-500/20 bg-emerald-500/5"
                          : "border-amber-500/20 bg-amber-500/5"
                      }`}
                    >
                      <p className="text-sm font-semibold">
                        {isOrderAssignedToCurrentUser(viewingTender)
                          ? "This order is assigned to you."
                          : "This is a view-only order for you."}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {isOrderAssignedToCurrentUser(viewingTender)
                          ? "You can perform order-specific work actions for this order."
                          : "Order-specific work actions should only be available on orders assigned to you."}
                      </p>
                    </div>
                  </section>

                  {/* ==================================================
                      CONTACT
                      ================================================== */}

                  <section className="border-t pt-7">
                    <DetailSectionTitle
                      title="Contact Information"
                      color="bg-blue-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <DetailItem
                        label="Contact Person"
                        value={
                          viewingTender.name
                        }
                      />

                      <DetailItem
                        label="Firm Name"
                        value={
                          viewingTender.firm_name
                        }
                      />

                      <DetailItem
                        label="Mobile"
                        value={
                          viewingTender.mobile
                        }
                      />

                      <DetailItem
                        label="Email"
                        value={
                          viewingTender.email_id
                        }
                      />
                    </div>
                  </section>

                  {/* ==================================================
                      JURISDICTION
                      ================================================== */}

                  <section className="border-t pt-7">
                    <DetailSectionTitle
                      title="Jurisdiction"
                      color="bg-emerald-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                      <DetailItem
                        label="Department"
                        value={
                          viewingTender.department_name
                        }
                      />

                      <DetailItem
                        label="Section"
                        value={
                          viewingTender.section_name
                        }
                      />

                      <DetailItem
                        label="Division"
                        value={
                          viewingTender.division_name
                        }
                      />

                      <DetailItem
                        label="Sub Division"
                        value={
                          viewingTender.subdivision
                        }
                      />

                      <DetailItem
                        label="State"
                        value={
                          viewingTender.state_name
                        }
                      />

                      <DetailItem
                        label="City"
                        value={
                          viewingTender.city_name
                        }
                      />
                    </div>
                  </section>

                  {/* ==================================================
                      TENDER REFERENCE
                      ================================================== */}

                  <section className="border-t pt-7">
                    <DetailSectionTitle
                      title="Tender Reference"
                      color="bg-amber-500"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <DetailItem
                        label="Tender ID"
                        value={
                          viewingTender.tenderID
                        }
                      />

                      <DetailItem
                        label="Reference Code"
                        value={
                          viewingTender.reference_code
                        }
                      />

                      <DetailItem
                        label="Remarked At"
                        value={
                          viewingTender.remarked_at
                            ? new Date(
                                viewingTender.remarked_at
                              ).toLocaleString(
                                "en-IN"
                              )
                            : null
                        }
                      />

                      <DetailItem
                        label="File"
                        value={
                          viewingTender.file_name &&
                          viewingTender.file_name !==
                            "null"
                            ? viewingTender.file_name
                            : null
                        }
                      />

                      <DetailItem
                        label="Internal Record ID"
                        value={
                          viewingTender.id
                        }
                      />

                      <DetailItem
                        label="Database Tender ID"
                        value={
                          viewingTender.t_id
                        }
                      />
                    </div>
                  </section>

                  {/* ==================================================
                      COMPLETE RECORD
                      ================================================== */}

                  <section className="border-t pt-7">

                    <div className="rounded-xl border bg-muted/20 p-5">

                      <div className="flex items-center gap-3 mb-5">

                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <FileText className="size-5" />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold">
                            Record Information
                          </h3>

                          <p className="text-xs text-muted-foreground mt-0.5">
                            Information associated with
                            this tender record.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                        <div className="rounded-lg bg-background border p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                            Record ID
                          </p>

                          <p className="mt-1 text-sm font-semibold break-all">
                            {viewingTender.id ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-background border p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                            Tender ID
                          </p>

                          <p className="mt-1 text-sm font-semibold break-all">
                            {viewingTender.tenderID ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-background border p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-semibold capitalize">
                            {viewingTender.remark ||
                              "—"}
                          </p>
                        </div>

                        <div className="rounded-lg bg-background border p-3">
                          <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                            File
                          </p>

                          <p className="mt-1 text-sm font-semibold truncate">
                            {viewingTender.file_name &&
                            viewingTender.file_name !==
                              "null"
                              ? viewingTender.file_name
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </section>

                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ========================================================
          ASSIGN USERS MODAL
          ======================================================== */}
      <SalesOrderAssignModal
        open={Boolean(assigningTender)}
        onOpenChange={(open) => {
          if (!open) {
            setAssigningTender(null);
          }
        }}
        order={assigningTender}
        onSuccess={() => void loadQuoteTenders()}
      />
    </div>
  );
}

export default OrdersPage;