import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { Plus, Search, Calendar, Info, Layers, Paperclip } from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import { hrmsApi } from "@/services/modules";
import { canPerformPageAction } from "@/utils/pagePermissions";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import { Attendance } from "@/types/employee";

const attendanceSchema = z.object({
  employeeId: z.string().min(1, "Select an employee"),
  date: z.string().min(2, "Select a date"),
  status: z.string().default("PRESENT"),
  remarks: z.string().optional().nullable(),
});

const defaultFormValues = {
  employeeId: "",
  date: new Date().toISOString().split("T")[0],
  status: "PRESENT",
  remarks: "On time",
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ABSENT: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  HALF_DAY: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  ON_LEAVE: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  HOLIDAY: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
};

const getStatusBadge = (status: string) => {
  const s = String(status).toUpperCase();
  const colorClass =
    STATUS_COLORS[s] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${colorClass}`}
    >
      {status}
    </span>
  );
};

const IGNORED_KEYS = new Set([
  "id",
  "companyId",
  "deletedAt",
  "company",
  "userPermissions",
  "updatedAt",
  "contacts",
]);

const formatFieldLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\sId$/, "");

const asInputValue = (value: unknown) => (value == null ? "" : String(value));

const toDateInputValue = (iso?: string | null) =>
  iso ? new Date(iso).toISOString().split("T")[0] : "";

const toDateTimeLocal = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

export function AttendancePage() {
  const globalStore = useERPStore();
  const currentUser = globalStore.users?.find(
    (u: any) => u.id === globalStore.currentUserId,
  ) as any;
  const moduleKey = "attendance";
  const canCreate = canPerformPageAction(
    currentUser?.actionPermissions,
    moduleKey,
    "create",
  );
  const canEdit = canPerformPageAction(
    currentUser?.actionPermissions,
    moduleKey,
    "edit",
  );
  const canDelete = canPerformPageAction(
    currentUser?.actionPermissions,
    moduleKey,
    "delete",
  );

  const [records, setRecords] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formValues, setFormValues] =
    useState<Record<string, unknown>>(defaultFormValues);
  const [editingRecord, setEditingRecord] = useState<Attendance | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Attendance | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Attendance | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      const [attData, empData] = await Promise.all([
        hrmsApi.attendance.list(),
        hrmsApi.employees.list(),
      ]);
      setRecords(attData);
      setEmployees(empData);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to load attendance.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const optionLabels = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((item: any) => {
      map[item.id] =
        `${item.firstName ?? ""} ${item.lastName ?? ""}`.trim() ||
        (item.name ?? item.title ?? item.code ?? item.id);
    });
    return map;
  }, [employees]);

  const getStatusBadgeIfStatus = (record: Attendance) =>
    "status" in record ? getStatusBadge(String((record as any).status)) : null;

  const renderDisplayValue = (
    key: string,
    value: unknown,
    record?: Attendance,
  ): React.ReactNode => {
    if (value === null || value === undefined || value === "") return "—";

    if (typeof value === "string" && key.endsWith("Id") && record) {
      const relationKey = key.slice(0, -2);
      const relationObj = (record as any)[relationKey];
      if (relationObj && typeof relationObj === "object") {
        const label = relationObj.firstName
          ? `${relationObj.firstName} ${relationObj.lastName ?? ""}`.trim()
          : (relationObj.name ??
            relationObj.title ??
            relationObj.code ??
            relationObj.id);
        if (label) return String(label);
      }
      const label = optionLabels[value];
      if (label) return label;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "—";
      if (typeof value[0] === "object" && value[0] !== null) {
        return (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {value.map((item: any, i) => {
              const label =
                item.name ?? item.title ?? item.fileName ?? item.code ?? `Item #${i + 1}`;
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-muted border hover:bg-muted/80 transition-all px-2.5 py-1 text-xs font-semibold text-foreground"
                >
                  <Paperclip className="size-3 text-muted-foreground" />
                  {label}
                </span>
              );
            })}
          </div>
        );
      }
      return value.join(", ");
    }

    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      if (obj.firstName) return `${obj.firstName} ${obj.lastName ?? ""}`.trim();
      const label = obj.name ?? obj.title ?? obj.code ?? obj.id;
      return label ? String(label) : "—";
    }

    if (
      typeof value === "string" &&
      key === "status" &&
      STATUS_COLORS[value.toUpperCase()]
    ) {
      return getStatusBadge(value);
    }

    if (
      typeof value === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
    ) {
      return new Date(value).toLocaleString();
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return String(value);
  };

  const groupRecordFields = (record: Attendance) => {
    const core: Array<{ key: string; value: any }> = [];
    const dates: Array<{ key: string; value: any }> = [];
    const relations: Array<{ key: string; value: any }> = [];

    Object.entries(record as any)
      .filter(([key]) => !IGNORED_KEYS.has(key))
      .forEach(([key, value]) => {
        if (key === "status" || key === "name" || key === "title") return;
        if (key.endsWith("Id")) {
          const relationKey = key.slice(0, -2);
          if ((record as any)[relationKey] !== undefined) return;
        }
        if (Array.isArray(value) || (typeof value === "object" && value !== null)) {
          relations.push({ key, value });
        } else if (
          (typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) ||
          key.toLowerCase().includes("date")
        ) {
          dates.push({ key, value });
        } else {
          core.push({ key, value });
        }
      });

    return { core, dates, relations };
  };

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) =>
      Object.values(record).some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [records, search]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormValues(defaultFormValues);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (record: Attendance) => {
    setEditingRecord(record);
    setFormValues({
      ...defaultFormValues,
      ...record,
      date: toDateInputValue((record as any).date),
      checkIn: toDateTimeLocal((record as any).checkIn),
      checkOut: toDateTimeLocal((record as any).checkOut),
    });
    setErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = attendanceSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "form");
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      if (editingRecord) {
        if (hrmsApi.attendance.update) {
          await hrmsApi.attendance.update(
            editingRecord.id,
            result.data as Record<string, unknown>,
          );
        }
      } else {
        await hrmsApi.attendance.create(
          result.data as Record<string, unknown>,
        );
      }
      await loadRecords();
      setIsFormOpen(false);
      toast.success("Attendance Log saved successfully.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to save attendance log.",
      );
    }
  };

  const setField = (name: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const columns = useMemo(
    () =>
      [
        { accessorKey: "date", header: sortableHeader("Date") },
        {
          accessorKey: "employeeId",
          header: "Employee Code",
          cell: ({ getValue, row }: any) => {
            const id = getValue() as string;
            const empObj = (row.original as any).employee;
            if (empObj?.employeeCode) return empObj.employeeCode;
            const emp = employees?.find((e: any) => e.id === id);
            if (emp?.employeeCode) return emp.employeeCode;
            return id;
          },
        },
        {
          accessorKey: "checkIn",
          header: "Check In",
          cell: ({ getValue }: any) =>
            getValue()
              ? new Date(getValue() as string).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
        },
        {
          accessorKey: "checkOut",
          header: "Check Out",
          cell: ({ getValue }: any) =>
            getValue()
              ? new Date(getValue() as string).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—",
        },
        {
          accessorKey: "status",
          header: "Attendance Status",
          cell: ({ getValue }: any) => {
            const val = getValue() as string;
            return (
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  val === "PRESENT"
                    ? "bg-success/15 text-success"
                    : val === "ON_LEAVE"
                      ? "bg-warning/15 text-warning"
                      : "bg-destructive/15 text-destructive"
                }`}
              >
                {val}
              </span>
            );
          },
        },
        { accessorKey: "remarks", header: "Remarks" },
      ] as ColumnDef<Attendance>[],
    [employees],
  );

  const viewingGroups = useMemo(
    () => (viewingRecord ? groupRecordFields(viewingRecord) : null),
    [viewingRecord],
  );

  const cards = useMemo(
    () => [
      { label: "Total Attendance Logs", value: records.length },
      {
        label: "Present Today",
        value: records.filter((a) => a.status === "PRESENT").length,
      },
    ],
    [records],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span>
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">Attendance Logs</span>
        </span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage attendance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> Add Attendance Log
            </Button>
          )}
        </div>
      </div>

      {cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-200">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                {card.label}
              </p>
              <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search attendance..."
          className="pl-9"
        />
      </div>

      <GenericTable<Attendance>
        columns={columns}
        data={filteredRecords}
        onView={setViewingRecord}
        onEdit={canEdit && hrmsApi.attendance.update ? openEdit : undefined}
        onDelete={
          !canDelete
            ? undefined
            : (record) => {
                setRecordToDelete(record);
                setDeleteConfirmOpen(true);
              }
        }
        isLoading={isLoading}
        freezeActions
        storageKey="attendances"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {editingRecord ? "Update Entry" : "New Entry"}
            </p>

            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {editingRecord ? "Edit Attendance Log" : "Add Attendance Log"}
            </DialogTitle>

            <DialogDescription className="text-xs text-muted-foreground">
              Complete the details below to update the system logs.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={submitForm}
            className="flex-1 flex flex-col justify-between overflow-y-auto"
          >
            <div className="p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="employeeId"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Select Employee <span className="text-destructive"> *</span>
                </Label>
                <Select
                  value={asInputValue(formValues.employeeId)}
                  onValueChange={(value) => setField("employeeId", value)}
                >
                  <SelectTrigger
                    id="employeeId"
                    className="w-full bg-card hover:bg-card/85 transition-colors border-border/80 focus:ring-1 focus:ring-primary"
                  >
                    <SelectValue placeholder="Select Employee">
                      {optionLabels[String(formValues.employeeId ?? "")] ??
                        undefined}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((option: any) => (
                      <SelectItem key={option.id} value={option.id}>
                        {`${option.firstName ?? ""} ${option.lastName ?? ""}`
                          .trim() ||
                          option.name ||
                          option.title ||
                          option.code ||
                          option.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.employeeId && (
                  <p className="text-xs text-destructive font-medium mt-0.5">
                    {errors.employeeId}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="date"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Attendance Date <span className="text-destructive"> *</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={asInputValue(formValues.date)}
                  onChange={(event) => setField("date", event.target.value)}
                  className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                />
                {errors.date && (
                  <p className="text-xs text-destructive font-medium mt-0.5">
                    {errors.date}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="checkIn"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Check In Time
                </Label>
                <Input
                  id="checkIn"
                  type="datetime-local"
                  value={asInputValue(formValues.checkIn)}
                  onChange={(event) => setField("checkIn", event.target.value)}
                  className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="checkOut"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Check Out Time
                </Label>
                <Input
                  id="checkOut"
                  type="datetime-local"
                  value={asInputValue(formValues.checkOut)}
                  onChange={(event) => setField("checkOut", event.target.value)}
                  className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="status"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Attendance Status
                </Label>
                <Select
                  value={asInputValue(formValues.status)}
                  onValueChange={(value) => setField("status", value)}
                >
                  <SelectTrigger
                    id="status"
                    className="w-full bg-card hover:bg-card/85 transition-colors border-border/80 focus:ring-1 focus:ring-primary"
                  >
                    <SelectValue placeholder="Select Attendance Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PRESENT">Present</SelectItem>
                    <SelectItem value="ABSENT">Absent</SelectItem>
                    <SelectItem value="HALF_DAY">Half Day</SelectItem>
                    <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                    <SelectItem value="HOLIDAY">Holiday</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="remarks"
                  className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                >
                  Remarks / Exceptions
                </Label>
                <Input
                  id="remarks"
                  type="text"
                  placeholder="On time, Late arrival, etc."
                  value={asInputValue(formValues.remarks)}
                  onChange={(event) => setField("remarks", event.target.value)}
                  className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
            </div>
            <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-end gap-3 sticky bottom-0 bg-background">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsFormOpen(false)}
                className="hover:bg-muted/80"
              >
                Cancel
              </Button>
              <Button type="submit" className="shadow-xs hover:opacity-90">
                {editingRecord ? "Save changes" : "Create Attendance Log"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingRecord)}
        onOpenChange={(open) => !open && setViewingRecord(null)}
      >
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          {viewingRecord && (
            <>
              <DialogHeader className="px-6 pt-6">
                <DialogTitle>Attendance Log Overview</DialogTitle>
                <DialogDescription>
                  View complete attendance log details.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6">
                {viewingGroups && (
                  <div className="space-y-6 py-4">
                    {getStatusBadgeIfStatus(viewingRecord)}

                    {viewingGroups.core.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                          <Info className="size-3.5" /> Details
                        </h3>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          {viewingGroups.core.map(({ key, value }) => (
                            <React.Fragment key={key}>
                              <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">
                                {formatFieldLabel(key)}
                              </dt>
                              <dd className="break-words text-foreground font-medium">
                                {renderDisplayValue(
                                  key,
                                  value,
                                  viewingRecord,
                                )}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </section>
                    )}

                    {viewingGroups.dates.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                          <Calendar className="size-3.5" /> Dates
                        </h3>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                          {viewingGroups.dates.map(({ key, value }) => (
                            <React.Fragment key={key}>
                              <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">
                                {formatFieldLabel(key)}
                              </dt>
                              <dd className="break-words text-foreground font-medium">
                                {renderDisplayValue(
                                  key,
                                  value,
                                  viewingRecord,
                                )}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </section>
                    )}

                    {viewingGroups.relations.length > 0 && (
                      <section className="space-y-2">
                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                          <Layers className="size-3.5" /> Related records
                        </h3>
                        <dl className="grid grid-cols-1 gap-y-3 text-sm">
                          {viewingGroups.relations.map(({ key, value }) => (
                            <React.Fragment key={key}>
                              <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">
                                {formatFieldLabel(key)}
                              </dt>
                              <dd className="break-words text-foreground font-medium">
                                {renderDisplayValue(
                                  key,
                                  value,
                                  viewingRecord,
                                )}
                              </dd>
                            </React.Fragment>
                          ))}
                        </dl>
                      </section>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Move Attendance Log to Recycle Bin?"
        description="This attendance log will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin."
        confirmText="Move to Bin"
        onConfirm={async () => {
          if (!recordToDelete) return;
          setIsLoading(true);
          try {
            if (hrmsApi.attendance.remove) {
              await hrmsApi.attendance.remove(recordToDelete.id);
              await loadRecords();
            }
            toast.success("Attendance Log deleted successfully.");
          } catch (error: any) {
            toast.error(
              error.response?.data?.message ?? "Unable to delete attendance log.",
            );
          } finally {
            setIsLoading(false);
            setRecordToDelete(null);
          }
        }}
      />
    </div>
  );
}

export default AttendancePage;
