import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Search,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  XCircle,
  Users,
} from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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

// Shape returned by GET /admin/quotetender/read
// response.data = { success, message, data: { status, data: RawQuoteTenderOrder[] } }
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

// Row shape used in the table — adds `id` (required by GenericTable<{ id: string }>)
interface QuoteTenderOrder extends RawQuoteTenderOrder {
  id: string; // derived from t_id
}

const ALL_COLUMN_KEYS = [
  { id: "tenderNo", label: "TENDER NO" },
  { id: "nameOfWork", label: "NAME OF WORK" },
  { id: "firmName", label: "FIRM NAME" },
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
  { id: "remark", label: "REMARK" },
  { id: "remarkedAt", label: "REMARKED AT" },
  { id: "fileName", label: "FILE" },
] as const;

type ColumnKey = (typeof ALL_COLUMN_KEYS)[number]["id"];

const EMPTY_ARRAY: QuoteTenderOrder[] = [];

// Workaround: GenericTable's exported type is locked to `{ id: string }`
// (likely from a React.memo/forwardRef wrapper in genericTable.tsx that
// erases its generic <T>). Re-typing it here as a generic component
// restores correct inference for QuoteTenderOrder without touching that file.
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

export function OrdersPage() {
  const [quoteTenders, setQuoteTenders] = useState<QuoteTenderOrder[]>(EMPTY_ARRAY);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRemark, setFilterRemark] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("date-newest");
  const [viewingTender, setViewingTender] = useState<QuoteTenderOrder | null>(null);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    () => {
      try {
        const saved = localStorage.getItem("quote-tender-table-column-visibility");
        if (saved) return JSON.parse(saved);
      } catch {
        // fall back to defaults below
      }
      const initial: Record<string, boolean> = {};
      ALL_COLUMN_KEYS.forEach((col) => {
        initial[col.id] = true;
      });
      return initial;
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "quote-tender-table-column-visibility",
      JSON.stringify(visibleColumns),
    );
  }, [visibleColumns]);

  // Load Quote Tender Orders from the API
  const loadQuoteTenders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get("/quotetender/read");
      if (response.data?.success) {
        const rawRows: RawQuoteTenderOrder[] = response.data?.data?.data ?? [];
        // GenericTable requires each row to have a string `id`.
        // The API gives us `t_id` (a number) instead, so we derive `id` from it.
        const rows: QuoteTenderOrder[] = rawRows.map((r) => ({
          ...r,
          id: String(r.t_id),
        }));
        setQuoteTenders(rows);
      } else {
        toast.error(
          response.data?.message ?? "Unable to load quote tender orders.",
        );
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to load quote tender orders.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuoteTenders();
  }, [loadQuoteTenders]);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const setAllColumns = (val: boolean) => {
    const updated: Record<string, boolean> = {};
    ALL_COLUMN_KEYS.forEach((col) => {
      updated[col.id] = val;
    });
    setVisibleColumns(updated);
  };

  const remarkOptions = useMemo(() => {
    const set = new Set<string>();
    quoteTenders.forEach((t) => {
      if (t.remark) set.add(t.remark);
    });
    return Array.from(set);
  }, [quoteTenders]);

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
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(q)),
      );
    }

    if (filterRemark) {
      list = list.filter(
        (item) =>
          (item.remark || "").toLowerCase() === filterRemark.toLowerCase(),
      );
    }

    if (sortBy === "date-newest") {
      list.sort(
        (a, b) =>
          new Date(b.remarked_at).getTime() - new Date(a.remarked_at).getTime(),
      );
    } else if (sortBy === "date-oldest") {
      list.sort(
        (a, b) =>
          new Date(a.remarked_at).getTime() - new Date(b.remarked_at).getTime(),
      );
    } else if (sortBy === "firm-asc") {
      list.sort((a, b) => (a.firm_name || "").localeCompare(b.firm_name || ""));
    }

    return list;
  }, [quoteTenders, search, filterRemark, sortBy]);

  // Stats
  const totalTenders = quoteTenders.length;
  const acceptedCount = useMemo(
    () =>
      quoteTenders.filter((t) => (t.remark || "").toLowerCase() === "accepted")
        .length,
    [quoteTenders],
  );
  const rejectedCount = useMemo(
    () =>
      quoteTenders.filter((t) => (t.remark || "").toLowerCase() === "rejected")
        .length,
    [quoteTenders],
  );
  const uniqueFirms = useMemo(
    () => new Set(quoteTenders.map((t) => t.firm_name)).size,
    [quoteTenders],
  );

  const tableColumns = useMemo<ColumnDef<QuoteTenderOrder>[]>(() => {
    const allDefs: Record<string, ColumnDef<QuoteTenderOrder>> = {
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
          const val = (getValue() as string) || "—";
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
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      contactPerson: {
        accessorKey: "name",
        header: "Name",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      mobile: {
        accessorKey: "mobile",
        header: "MOBILE",
        cell: ({ getValue }) => (getValue() as string) || "—",
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
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      sectionName: {
        accessorKey: "section_name",
        header: "SECTION",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      divisionName: {
        accessorKey: "division_name",
        header: "DIVISION",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      subdivision: {
        accessorKey: "subdivision",
        header: "SUB DIVISION",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      stateCity: {
        id: "stateCity",
        header: "STATE / CITY",
        cell: ({ row }) => {
          const item = row.original;
          const parts = [item.city_name, item.state_name].filter(Boolean);
          return parts.length > 0 ? parts.join(", ") : "—";
        },
      },
      tenderID: {
        accessorKey: "tenderID",
        header: "TENDER ID",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      referenceCode: {
        accessorKey: "reference_code",
        header: "REFERENCE CODE",
        cell: ({ getValue }) => (getValue() as string) || "—",
      },
      remark: {
        accessorKey: "remark",
        header: "REMARK",
        cell: ({ getValue }) => {
          const val = String(getValue() || "—");
          const badge: Record<string, string> = {
            accepted: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
            rejected: "bg-rose-500/15 text-rose-500 border-rose-500/20",
            pending: "bg-amber-500/15 text-amber-500 border-amber-500/20",
          };
          return (
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                badge[val.toLowerCase()] || "bg-muted text-muted-foreground"
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
          return val ? new Date(val).toLocaleString("en-IN") : "—";
        },
      },
      fileName: {
        accessorKey: "file_name",
        header: "FILE",
        cell: ({ getValue }) => {
          const val = getValue() as string | null;
          if (!val || val === "null") return "—";
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
  }, [visibleColumns]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Orders
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => void loadQuoteTenders()}
          className="gap-2"
        >
          <RefreshCw className="size-4" /> Refresh
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-blue-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-blue-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Tenders
            </p>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300">
              <FileText className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{totalTenders}</p>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-emerald-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-emerald-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Accepted
            </p>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{acceptedCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-rose-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-rose-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Rejected
            </p>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform duration-300">
              <XCircle className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{rejectedCount}</p>
        </div>

        <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-amber-500/[0.02] p-5 shadow-xs hover:shadow-md transition-all duration-300 hover:border-amber-500/30 group">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Firms
            </p>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform duration-300">
              <Users className="size-5" />
            </div>
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">{uniqueFirms}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] border border-input rounded-md px-3 bg-background focus-within:ring-1 focus-within:ring-primary">
          <Search className="size-4 text-muted-foreground" />
          <Input
            placeholder="Search tender no, firm, work, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 border-none shadow-none focus-visible:ring-0 px-0"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5 h-8" />
              }
            >
              <SlidersHorizontal className="size-3.5" /> Fields
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64 p-3 space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs">Show / Hide Columns</span>
                <div className="flex gap-2 text-[11px]">
                  <button
                    type="button"
                    className="text-primary hover:underline font-semibold"
                    onClick={() => setAllColumns(true)}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className="text-muted-foreground hover:underline font-semibold"
                    onClick={() => setAllColumns(false)}
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
                      checked={visibleColumns[col.id] ?? true}
                      onCheckedChange={() => toggleColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">REMARK:</span>
            <Select
              value={filterRemark}
              onValueChange={(val) => setFilterRemark(val ?? "")}
            >
              <SelectTrigger className="h-8 w-[130px]">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {remarkOptions.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-muted-foreground">SORT:</span>
            <Select
              value={sortBy}
              onValueChange={(val) => setSortBy(val ?? "date-newest")}
            >
              <SelectTrigger className="h-8 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-newest">Date Newest</SelectItem>
                <SelectItem value="date-oldest">Date Oldest</SelectItem>
                <SelectItem value="firm-asc">Firm A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <TenderTable
        columns={tableColumns}
        data={processedTenders}
        onView={setViewingTender}
        isLoading={isLoading}
        showColumnVisibility={false}
        storageKey="quote-tender-orders"
      />

      {/* View Details Drawer */}
      <Sheet
        open={Boolean(viewingTender)}
        onOpenChange={(open) => !open && setViewingTender(null)}
      >
        <SheetContent side="right" className="max-w-lg p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Tender Details</SheetTitle>
          </SheetHeader>

          {viewingTender && (
            <div className="space-y-6 py-4">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-lg font-bold text-foreground">
                  {viewingTender.tender_no}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary uppercase">
                  {viewingTender.remark}
                </span>
              </div>

              <section className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Name of Work
                </h4>
                <p className="text-sm font-medium text-foreground">
                  {viewingTender.name_of_work || "—"}
                </p>
              </section>

              <section className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Contact
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Name:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Firm:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.firm_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mobile:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.mobile || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.email_id || "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Jurisdiction
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Department:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.department_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Section:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.section_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Division:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.division_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sub Division:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.subdivision || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">State:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.state_name || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">City:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.city_name || "—"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2 border-t pt-3">
                <h4 className="text-xs font-bold uppercase text-muted-foreground">
                  Tender Reference
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Tender ID:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.tenderID || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reference Code:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.reference_code || "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remarked At:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.remarked_at
                        ? new Date(viewingTender.remarked_at).toLocaleString(
                            "en-IN",
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">File:</span>{" "}
                    <p className="font-semibold text-foreground">
                      {viewingTender.file_name && viewingTender.file_name !== "null"
                        ? viewingTender.file_name
                        : "—"}
                    </p>
                  </div>
                </div>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default OrdersPage;