import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  Loader2,
  Plane,
  Plus,
  Search,
  UserX,
  Users,
} from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { hrmsApi } from "@/services/modules";
import { apiClient } from "@/services/axios";
import { useERPStore } from "@/store/erpStore";
import { canPerformPageAction } from "@/utils/pagePermissions";
import { toast } from "react-hot-toast";

type AttendanceStatus =
  | "PRESENT"
  | "LATE"
  | "ABSENT"
  | "ON_LEAVE"
  | "HALF_DAY"
  | "HOLIDAY";

interface AttendanceRow {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  shiftName: string;
  checkInLabel: string;
  checkOutLabel: string;
  hoursLabel: string;
  status: AttendanceStatus;
}

const STATUS_META: Record<
  AttendanceStatus,
  { label: string; chip: string; dot: string }
> = {
  PRESENT: {
    label: "Present",
    chip: "bg-success/15 text-success",
    dot: "bg-success",
  },
  LATE: {
    label: "Late",
    chip: "bg-warning/15 text-warning",
    dot: "bg-warning",
  },
  ABSENT: {
    label: "Absent",
    chip: "bg-destructive/15 text-destructive",
    dot: "bg-destructive",
  },
  ON_LEAVE: {
    label: "On Leave",
    chip: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  HALF_DAY: {
    label: "Half Day",
    chip: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
  },
  HOLIDAY: {
    label: "Holiday",
    chip: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
    dot: "bg-cyan-500",
  },
};

const STATUS_OPTIONS = (Object.keys(STATUS_META) as AttendanceStatus[]).map(
  (s) => ({ value: s, label: STATUS_META[s].label }),
);

const LATE_GRACE_MINUTES = 15;
const DEFAULT_SHIFT_START = "09:00";

const toMinutes = (time?: string | null) => {
  if (!time) return null;
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const toTimeLabel = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const toHoursLabel = (checkIn?: string | null, checkOut?: string | null) => {
  if (!checkIn || !checkOut) return "—";
  const ms = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  if (ms <= 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

const deriveStatus = (att: any, shiftStart: number): AttendanceStatus => {
  switch (att.status) {
    case "ABSENT":
      return "ABSENT";
    case "ON_LEAVE":
      return "ON_LEAVE";
    case "HOLIDAY":
      return "HOLIDAY";
    case "HALF_DAY":
      return "HALF_DAY";
    case "PRESENT":
    default:
      if (att.checkIn) {
        const d = new Date(att.checkIn);
        const minutes = d.getHours() * 60 + d.getMinutes();
        if (minutes > shiftStart + LATE_GRACE_MINUTES) return "LATE";
      }
      return "PRESENT";
  }
};

const todayISO = () => {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
};

interface MarkEntry {
  status: string;
  checkIn: string;
  checkOut: string;
}

const dateWithTime = (baseDate: string, time?: string | null, addDays = 0) => {
  if (!time) return "";
  const [h, m] = String(time).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const d = new Date(`${baseDate}T00:00:00`);
  d.setDate(d.getDate() + addDays);
  d.setHours(h, m, 0, 0);
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getFullYear()}-${mo}-${day}T${hh}:${mm}`;
};

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  const meta = STATUS_META[status] ?? STATUS_META.PRESENT;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${meta.chip}`}
    >
      <span className={`size-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
};

export function AttendancePage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [dateFilter, setDateFilter] = useState(todayISO);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markDate, setMarkDate] = useState(todayISO);
  const [markSearch, setMarkSearch] = useState("");
  const [markings, setMarkings] = useState<Record<string, MarkEntry>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const globalStore = useERPStore();
  const currentUser = globalStore.users?.find(
    (u: any) => u.id === globalStore.currentUserId,
  ) as any;
  const canCreate = canPerformPageAction(
    currentUser?.actionPermissions,
    "attendance",
    "create",
  );

  const shiftById = useMemo(() => {
    const map = new Map<string, any>();
    assignments.forEach((a: any) => {
      if (a?.employeeId && a?.shift) map.set(a.employeeId, a.shift);
    });
    return map;
  }, [assignments]);

  const markedOnDate = useMemo(() => {
    const map = new Map<string, any>();
    (attendances ?? []).forEach((att: any) => {
      if (String(att.date).slice(0, 10) === markDate) {
        map.set(att.employeeId, att);
      }
    });
    return map;
  }, [attendances, markDate]);

  const dialogEmployees = useMemo(() => {
    const q = markSearch.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((emp) => {
      const name = [emp.firstName, emp.lastName].filter(Boolean).join(" ");
      return `${name} ${emp.employeeCode ?? ""}`.toLowerCase().includes(q);
    });
  }, [employees, markSearch]);

  const prefillMarkings = (date: string) => {
    const initial: Record<string, MarkEntry> = {};
    employees.forEach((emp) => {
      const shift = shiftById.get(emp.id);
      const start = toMinutes(shift?.startTime);
      const end = toMinutes(shift?.endTime);
      const checkIn = shift?.startTime ? dateWithTime(date, shift.startTime) : "";
      const checkOut =
        shift?.endTime && start != null && end != null && end < start
          ? dateWithTime(date, shift.endTime, 1)
          : shift?.endTime
            ? dateWithTime(date, shift.endTime)
            : "";
      initial[emp.id] = { status: "PRESENT", checkIn, checkOut };
    });
    setMarkings(initial);
  };

  const openMarkDialog = () => {
    prefillMarkings(markDate);
    setMarkSearch("");
    setMarkDialogOpen(true);
  };

  const handleMarkDateChange = (date: string) => {
    setMarkDate(date);
    prefillMarkings(date);
  };

  const setMarkField = (
    employeeId: string,
    name: keyof MarkEntry,
    value: string,
  ) => {
    setMarkings((current) => ({
      ...current,
      [employeeId]: {
        ...(current[employeeId] ?? { status: "PRESENT", checkIn: "", checkOut: "" }),
        [name]: value,
      },
    }));
  };

  const markAllPresent = () => {
    setMarkings((current) => {
      const next = { ...current };
      employees.forEach((emp) => {
        next[emp.id] = {
          ...(next[emp.id] ?? { status: "PRESENT", checkIn: "", checkOut: "" }),
          status: "PRESENT",
        };
      });
      return next;
    });
  };

  const submitMarkings = async () => {
    const toSave = dialogEmployees.filter((emp) => !markedOnDate.has(emp.id));
    if (toSave.length === 0) {
      toast.error("All employees already have attendance for this date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await Promise.all(
        toSave.map((emp) => {
          const m =
            markings[emp.id] ?? { status: "PRESENT", checkIn: "", checkOut: "" };
          return hrmsApi.attendance.create({
            employeeId: emp.id,
            date: markDate,
            status: m.status,
            checkIn: m.checkIn || null,
            checkOut: m.checkOut || null,
            remarks: null,
          });
        }),
      );
      const count = toSave.length;
      toast.success(
        `${count} attendance record${count === 1 ? "" : "s"} saved.`,
      );
      setMarkDialogOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Unable to save attendance records.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [atts, emps, shiftsData, shiftAssignments] = await Promise.all([
        hrmsApi.attendance.list(),
        hrmsApi.employees.list().catch(() => []),
        hrmsApi.shifts.list().catch(() => []),
        apiClient
          .get("/employee-shift/read/")
          .then((res) => res.data?.data ?? [])
          .catch(() => []),
      ]);
      setAttendances(Array.isArray(atts) ? atts : []);
      setEmployees(Array.isArray(emps) ? emps : []);
      setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      setAssignments(Array.isArray(shiftAssignments) ? shiftAssignments : []);
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ??
          "Unable to load attendance records.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const employeeById = useMemo(() => {
    const map = new Map<string, any>();
    employees.forEach((e) => map.set(e.id, e));
    return map;
  }, [employees]);

  const shiftNameById = useMemo(() => {
    const map = new Map<string, string>();
    assignments.forEach((a: any) => {
      if (a?.employeeId && a?.shift?.name) map.set(a.employeeId, a.shift.name);
    });
    return map;
  }, [assignments]);

  const rows = useMemo<AttendanceRow[]>(() => {
    const shiftStartByEmployee = new Map<string, number>();
    assignments.forEach((a: any) => {
      if (!a?.employeeId || !a?.shift?.startTime) return;
      const mins = toMinutes(a.shift.startTime);
      if (mins != null) shiftStartByEmployee.set(a.employeeId, mins);
    });
    const defaultStart = toMinutes(DEFAULT_SHIFT_START) ?? 9 * 60;

    return (attendances ?? []).map((att: any) => {
      const emp = employeeById.get(att.employeeId) ?? att.employee ?? {};
      const shiftStart = shiftStartByEmployee.get(att.employeeId) ?? defaultStart;

      return {
        id: att.id,
        date: att.date,
        employeeId: att.employeeId,
        employeeName:
          [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
          "Unknown employee",
        employeeCode: emp.employeeCode ?? "—",
        departmentName: emp.department?.name ?? "—",
        shiftName: shiftNameById.get(att.employeeId) ?? "—",
        checkInLabel: toTimeLabel(att.checkIn),
        checkOutLabel: toTimeLabel(att.checkOut),
        hoursLabel: toHoursLabel(att.checkIn, att.checkOut),
        status: deriveStatus(att, shiftStart),
      };
    });
  }, [attendances, assignments, employeeById, shiftNameById]);

  const matchesBaseFilters = useCallback(
    (row: AttendanceRow) => {
      if (dateFilter && row.date) {
        if (String(row.date).slice(0, 10) !== dateFilter) return false;
      }
      if (departmentFilter !== "all" && row.departmentName !== departmentFilter)
        return false;
      if (shiftFilter !== "all" && row.shiftName !== shiftFilter) return false;
      return true;
    },
    [dateFilter, departmentFilter, shiftFilter],
  );

  const statsRows = useMemo(
    () => rows.filter(matchesBaseFilters),
    [rows, matchesBaseFilters],
  );

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return statsRows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (q) {
        const haystack = `${row.employeeName} ${row.employeeCode}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [statsRows, statusFilter, search]);

  const stats = useMemo(
    () => ({
      total: employees.length,
      present: statsRows.filter((r) => r.status === "PRESENT").length,
      late: statsRows.filter((r) => r.status === "LATE").length,
      absent: statsRows.filter((r) => r.status === "ABSENT").length,
      onLeave: statsRows.filter((r) => r.status === "ON_LEAVE").length,
    }),
    [employees.length, statsRows],
  );

  const departmentOptions = useMemo(() => {
    const names = employees
      .map((e) => e.department?.name)
      .filter((n) => Boolean(n) && n !== "—") as string[];
    return Array.from(new Set(names));
  }, [employees]);

  const shiftOptions = useMemo(() => {
    const names = shifts.map((s) => s.name).filter(Boolean) as string[];
    return Array.from(new Set(names));
  }, [shifts]);

  const exportCSV = () => {
    const esc = (value: string) =>
      /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
    const headers = [
      "Employee",
      "Employee Code",
      "Department",
      "Shift",
      "Check In",
      "Check Out",
      "Hours",
      "Status",
    ];
    const lines = filteredRows.map((row) =>
      [
        row.employeeName,
        row.employeeCode,
        row.departmentName,
        row.shiftName,
        row.checkInLabel,
        row.checkOutLabel,
        row.hoursLabel,
        STATUS_META[row.status].label,
      ]
        .map(esc)
        .join(","),
    );
    const csv = [headers.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance_${dateFilter || "all-dates"}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnDef<AttendanceRow>[]>(
    () => [
      {
        id: "employee",
        header: sortableHeader("Employee"),
        cell: ({ row }) => {
          const r = row.original;
          const initials = r.employeeName
            .split(" ")
            .map((w) => w[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 rounded-full border border-border bg-muted">
                <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">
                  {r.employeeName}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {r.employeeCode}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "departmentName",
        header: "Department",
        cell: ({ getValue }) => (
          <span className="text-sm text-foreground">{getValue() as string}</span>
        ),
      },
      {
        accessorKey: "shiftName",
        header: "Shift",
        cell: ({ getValue }) => {
          const val = getValue() as string;
          return val === "—" ? (
            <span className="text-sm text-muted-foreground">—</span>
          ) : (
            <span className="text-xs font-semibold text-foreground bg-muted/60 border border-border/70 px-2 py-0.5 rounded-full">
              {val}
            </span>
          );
        },
      },
      {
        accessorKey: "checkInLabel",
        header: sortableHeader("Check In"),
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "checkOutLabel",
        header: "Check Out",
        cell: ({ getValue }) => (
          <span className="text-sm tabular-nums text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "hoursLabel",
        header: sortableHeader("Hours"),
        cell: ({ getValue }) => (
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {getValue() as string}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => (
          <StatusBadge status={getValue() as AttendanceStatus} />
        ),
      },
    ],
    [],
  );

  const statCards = [
    {
      label: "Total Employees",
      value: stats.total,
      icon: Users,
      accent: "bg-primary/10 text-primary",
    },
    {
      label: "Present",
      value: stats.present,
      icon: CheckCircle2,
      accent: "bg-success/10 text-success",
    },
    {
      label: "Late",
      value: stats.late,
      icon: Clock3,
      accent: "bg-warning/10 text-warning",
    },
    {
      label: "Absent",
      value: stats.absent,
      icon: UserX,
      accent: "bg-destructive/10 text-destructive",
    },
    {
      label: "On Leave",
      value: stats.onLeave,
      icon: Plane,
      accent: "bg-blue-500/10 text-blue-500",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span>Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Attendance</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track employee check-ins, working hours and daily status.
          </p>
        </div>
        {canCreate && (
          <Button onClick={openMarkDialog} className="gap-2">
            <Plus className="size-4" /> Mark Attendance
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 animate-in fade-in duration-200">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                {card.label}
              </p>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${card.accent}`}
              >
                <card.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Date
              </span>
              <div className="relative">
                <Calendar className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="h-9 w-44 bg-card pl-9"
                />
              </div>
            </div>

            <Select
              value={departmentFilter}
              onValueChange={(value) => setDepartmentFilter(value ?? "all")}
            >
              <SelectTrigger className="h-9 w-44 bg-card">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departmentOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={shiftFilter}
              onValueChange={(value) => setShiftFilter(value ?? "all")}
            >
              <SelectTrigger className="h-9 w-40 bg-card">
                <SelectValue placeholder="All Shifts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Shifts</SelectItem>
                {shiftOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value ?? "all")}
            >
              <SelectTrigger className="h-9 w-40 bg-card">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee..."
                className="h-9 w-64 bg-card pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={exportCSV}
              className="h-9 gap-2 bg-card"
            >
              <Download className="size-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <GenericTable<AttendanceRow>
        columns={columns}
        data={filteredRows}
        isLoading={isLoading}
        storageKey="attendances"
      />

      <Dialog open={markDialogOpen} onOpenChange={setMarkDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Bulk Entry
            </p>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              Mark Attendance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose a date and mark attendance for employees. Employees already
              logged for this date are shown for reference and skipped on save.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Attendance Date
                </Label>
                <Input
                  type="date"
                  value={markDate}
                  onChange={(e) => handleMarkDateChange(e.target.value)}
                  className="h-9 w-44 bg-card"
                />
              </div>
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={markSearch}
                  onChange={(e) => setMarkSearch(e.target.value)}
                  placeholder="Search employees..."
                  className="h-9 bg-card pl-9"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={markAllPresent}
                className="h-9 gap-2 bg-card"
              >
                <CheckCircle2 className="size-4" /> Mark all present
              </Button>
            </div>

            <div className="rounded-xl border border-border/80 overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto divide-y divide-border/60">
                {dialogEmployees.length === 0 ? (
                  <div className="p-10 text-center text-xs text-muted-foreground border border-dashed rounded-xl m-3">
                    No employees match your search.
                  </div>
                ) : (
                  dialogEmployees.map((emp) => {
                    const existing = markedOnDate.get(emp.id);
                    const name =
                      [emp.firstName, emp.lastName].filter(Boolean).join(" ") ||
                      "Unknown employee";
                    const mark =
                      markings[emp.id] ??
                      { status: "PRESENT", checkIn: "", checkOut: "" };
                    return (
                      <div
                        key={emp.id}
                        className="flex flex-col gap-3 bg-card p-3.5 lg:flex-row lg:items-center"
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-3">
                          <Avatar className="h-8 w-8 rounded-full border border-border bg-muted">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {name
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {emp.employeeCode ?? "—"} ·{" "}
                              {emp.department?.name ?? "—"}
                            </p>
                          </div>
                        </div>

                        {existing ? (
                          <div className="flex flex-wrap items-center gap-2 lg:w-[430px] lg:justify-end">
                            <span className="text-[11px] font-medium text-muted-foreground">
                              Already logged
                            </span>
                            <StatusBadge
                              status={existing.status as AttendanceStatus}
                            />
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center gap-2 lg:w-[430px] lg:justify-end">
                            <Select
                              value={mark.status}
                              onValueChange={(value) =>
                                setMarkField(emp.id, "status", value ?? "PRESENT")
                              }
                            >
                              <SelectTrigger className="h-8 w-32 bg-card">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["PRESENT", "ABSENT", "HALF_DAY", "ON_LEAVE", "HOLIDAY"].map(
                                  (s) => (
                                    <SelectItem key={s} value={s}>
                                      {STATUS_META[s as AttendanceStatus].label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <Input
                              type="datetime-local"
                              value={mark.checkIn}
                              onChange={(e) =>
                                setMarkField(emp.id, "checkIn", e.target.value)
                              }
                              className="h-8 w-44 bg-card text-xs"
                            />
                            <Input
                              type="datetime-local"
                              value={mark.checkOut}
                              onChange={(e) =>
                                setMarkField(emp.id, "checkOut", e.target.value)
                              }
                              className="h-8 w-44 bg-card text-xs"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-between gap-3 sticky bottom-0 bg-background">
            <span className="text-xs font-medium text-muted-foreground">
              {dialogEmployees.filter((e) => !markedOnDate.has(e.id)).length}{" "}
              unmarked · {markedOnDate.size} already logged
            </span>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMarkDialogOpen(false)}
                className="hover:bg-muted/80"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={submitMarkings}
                className="gap-2 shadow-xs hover:opacity-90"
              >
                {isSubmitting && <Loader2 className="size-4 animate-spin" />}
                Save Attendance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AttendancePage;