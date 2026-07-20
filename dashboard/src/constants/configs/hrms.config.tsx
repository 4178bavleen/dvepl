import { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import { sortableHeader } from "@/components/tables/GenericTable";
import { hrmsApi } from "@/services/modules";
import { organizationApi } from "@/services/organization";
import { EmployeeStatus } from "@/types/erp";
import { Employee, Attendance, Leave, Salary } from "@/types/erp";

// ==========================================
// 7. EMPLOYEES ROUTE CONFIG
// ==========================================
export const employeesConfig = {
  api: hrmsApi.employees,
  selectOptions: {
    branchId: organizationApi.branches.list,
    departmentId: organizationApi.departments.list,
    teamId: organizationApi.teams.list,
    designationId: organizationApi.designations.list,
  },
  tableName: "employees",
  moduleName: "Employee",
  pluralName: "Employees",
  searchPlaceholder: "Search by name or code...",
  zodSchema: z.object({
    employeeCode: z.string().min(2),
    firstName: z.string().min(2),
    lastName: z.string().min(1),

    gender: z.string().optional().nullable(),

    branchId: z.string().optional().nullable(),
    departmentId: z.string().optional().nullable(),
    teamId: z.string().optional().nullable(),
    designationId: z.string().optional().nullable(),

    dateOfBirth: z.string().optional().nullable(),
    dateOfJoining: z.string().optional().nullable(),

    status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  }),
  defaultFormValues: {
    employeeCode: "",
    firstName: "",
    lastName: "",

    gender: "MALE",

    branchId: "",
    departmentId: "",
    teamId: "",
    designationId: "",

    dateOfBirth: "",
    dateOfJoining: "",

    status: EmployeeStatus.ACTIVE,
  },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Employees" }],
  columns: [
    { accessorKey: "employeeCode", header: sortableHeader("Emp Code") },
    {
      id: "fullName",
      header: sortableHeader("Full Name"),
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: "gender", header: "Gender" },

    {
      id: "department",
      header: "Department",
      cell: ({ row }) => row.original.department?.name ?? "-",
    },
    {
      id: "designation",
      header: "Designation",
      cell: ({ row }) => row.original.designation?.title ?? "-",
    },
    {
      id: "branch",
      header: "Branch",
      cell: ({ row }) => row.original.branch?.name ?? "-",
    },
    {
      id: "team",
      header: "Team",
      cell: ({ row }) => row.original.team?.name ?? "-",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              val === "ACTIVE"
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
  ] as ColumnDef<Employee>[],
  fields: [
    {
      name: "employeeCode",
      label: "Employee Code",
      type: "text",
      required: true,
    },
    {
      name: "firstName",
      label: "First Name",
      type: "text",
      required: true,
    },
    {
      name: "lastName",
      label: "Last Name",
      type: "text",
      required: true,
    },
    {
      name: "gender",
      label: "Gender",
      type: "select",
      options: [
        { label: "Male", value: "MALE" },
        { label: "Female", value: "FEMALE" },
        { label: "Other", value: "OTHER" },
      ],
    },
    {
      name: "dateOfBirth",
      label: "Date of Birth",
      type: "date",
    },
    {
      name: "dateOfJoining",
      label: "Date of Joining",
      type: "date",
    },
    {
      name: "branchId",
      label: "Branch",
      type: "select",
    },
    {
      name: "departmentId",
      label: "Department",
      type: "select",
    },
    {
      name: "teamId",
      label: "Team",
      type: "select",
    },
    {
      name: "designationId",
      label: "Designation",
      type: "select",
    },
    {
      name: "checkIn",
      label: "Check In Time",
      type: "datetime-local",
    },
    {
      name: "checkOut",
      label: "Check Out Time",
      type: "datetime-local",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "On Leave", value: "ON_LEAVE" },
        { label: "Suspended", value: "SUSPENDED" },
        { label: "Resigned", value: "RESIGNED" },
      ],
    },
  ] as any[],
  statsCards: (data: Employee[]) => [
    { label: "Total Employees", value: data.length },
    {
      label: "Active Employees",
      value: data.filter((e) => e.status === "ACTIVE").length,
    },
    {
      label: "On Leave Today",
      value: data.filter((e) => e.status === "ON_LEAVE").length,
    },
    { label: "Designations Tracked", value: 6 },
  ],
};

// ==========================================
// 8. ATTENDANCE ROUTE CONFIG
// ==========================================
export const attendanceConfig = {
  api: hrmsApi.attendance,

  selectOptions: {
    employeeId: hrmsApi.employees.list,
  },

  tableName: "attendances",
  moduleName: "Attendance Log",
  pluralName: "Attendance",

  zodSchema: z.object({
    employeeId: z.string().min(1, "Select an employee"),
    date: z.string().min(1, "Select a date"),
    checkIn: z.string().optional().nullable(),
    checkOut: z.string().optional().nullable(),
    status: z.string().default("PRESENT"),
    remarks: z.string().optional().nullable(),
  }),

  defaultFormValues: {
    employeeId: "",
    date: new Date().toISOString().split("T")[0],
    checkIn: "",
    checkOut: "",
    status: "PRESENT",
    remarks: "",
  },

  breadcrumbs: [
    { label: "Dashboard", href: "/" },
    { label: "Attendance Logs" },
  ],

  columns: [
    {
      accessorKey: "date",
      header: sortableHeader("Date"),
      cell: ({ getValue }) =>
        getValue()
          ? new Date(getValue() as string).toLocaleDateString()
          : "—",
    },
    {
      id: "employee",
      header: "Employee",
      cell: ({ row }) => {
        const employee = row.original.employee;

        if (!employee) return "-";

        return `${employee.firstName} ${employee.lastName} (${employee.employeeCode})`;
      },
    },
    {
      accessorKey: "checkIn",
      header: "Check In",
      cell: ({ getValue }) =>
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
      cell: ({ getValue }) =>
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
      cell: ({ getValue }) => {
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
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
  ] as ColumnDef<Attendance>[],

  fields: [
    {
      name: "employeeId",
      label: "Employee",
      type: "select",
      required: true,
    },
    {
      name: "date",
      label: "Attendance Date",
      type: "date",
      required: true,
    },
    {
      name: "checkIn",
      label: "Check In Time",
      type: "datetime-local",
    },
    {
      name: "checkOut",
      label: "Check Out Time",
      type: "datetime-local",
    },
    {
      name: "status",
      label: "Attendance Status",
      type: "select",
      options: [
        { label: "Present", value: "PRESENT" },
        { label: "Absent", value: "ABSENT" },
        { label: "Half Day", value: "HALF_DAY" },
        { label: "On Leave", value: "ON_LEAVE" },
        { label: "Holiday", value: "HOLIDAY" },
      ],
    },
    {
      name: "remarks",
      label: "Remarks",
      type: "text",
      placeholder: "Enter remarks",
    },
  ] as any[],

  statsCards: (data: Attendance[]) => [
    {
      label: "Total Attendance Logs",
      value: data.length,
    },
    {
      label: "Present Today",
      value: data.filter((a) => a.status === "PRESENT").length,
    },
  ],
};

// ==========================================
// 9. LEAVE ROUTE CONFIG
// ==========================================
export const leaveConfig = {
  api: hrmsApi.leave,
  selectOptions: { employeeId: hrmsApi.employees.list },
  tableName: "leaves",
  moduleName: "Leave Application",
  pluralName: "Leaves",
  zodSchema: z.object({
    employeeId: z.string().min(1, "Select an employee"),
    leaveType: z.string().min(1, "Enter leave type (e.g. CASUAL, SICK)"),
    fromDate: z.string().min(2, "Start date required"),
    toDate: z.string().min(2, "End date required"),
    reason: z.string().optional().nullable(),
    status: z.string().default("PENDING"),
  }),
  defaultFormValues: {
    employeeId: "emp-3",
    leaveType: "CASUAL",
    fromDate: "",
    toDate: "",
    reason: "",
    status: "PENDING",
  },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Leaves" }],
  columns: [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ getValue }) => {
        const id = getValue();
        if (id === "emp-1") return "Gabriel Dhillon";
        if (id === "emp-2") return "Rajesh Kumar";
        if (id === "emp-3") return "Priya Sharma";
        return String(id);
      },
    },
    { accessorKey: "leaveType", header: "Leave Type" },
    {
      accessorKey: "fromDate",
      header: "Start Date",
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString(),
    },
    {
      accessorKey: "toDate",
      header: "End Date",
      cell: ({ getValue }) =>
        new Date(getValue() as string).toLocaleDateString(),
    },
    { accessorKey: "reason", header: "Reason" },
    {
      accessorKey: "status",
      header: "Approval Status",
      cell: ({ getValue }) => {
        const val = getValue() as string;
        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              val === "APPROVED"
                ? "bg-success/15 text-success"
                : val === "PENDING"
                  ? "bg-warning/15 text-warning"
                  : "bg-destructive/15 text-destructive"
            }`}
          >
            {val}
          </span>
        );
      },
    },
  ] as ColumnDef<Leave>[],
  fields: [
    {
      name: "employeeId",
      label: "Select Employee",
      type: "select",
      options: [
        { label: "Gabriel Dhillon", value: "emp-1" },
        { label: "Rajesh Kumar", value: "emp-2" },
        { label: "Priya Sharma", value: "emp-3" },
      ],
      required: true,
    },
    {
      name: "leaveType",
      label: "Leave Type",
      type: "select",
      options: [
        { label: "Casual Leave (CL)", value: "CASUAL" },
        { label: "Sick Leave (SL)", value: "SICK" },
        { label: "Earned Leave (EL)", value: "EARNED" },
        { label: "Maternity Leave (ML)", value: "MATERNITY" },
      ],
      required: true,
    },
    { name: "fromDate", label: "From Date", type: "date", required: true },
    { name: "toDate", label: "To Date", type: "date", required: true },
    {
      name: "reason",
      label: "Reason for Leave",
      type: "textarea",
      placeholder: "Enter reason",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "Pending", value: "PENDING" },
        { label: "Approved", value: "APPROVED" },
        { label: "Rejected", value: "REJECTED" },
        { label: "Cancelled", value: "CANCELLED" },
      ],
    },
  ] as any[],
  statsCards: (data: Leave[]) => [
    { label: "Total Leaves Filed", value: data.length },
    {
      label: "Pending Approvals",
      value: data.filter((l) => l.status === "PENDING").length,
      change: "Urgent",
      trend: "down" as const,
    },
    {
      label: "Approved Leaves",
      value: data.filter((l) => l.status === "APPROVED").length,
    },
  ],
};

// ==========================================
// 10. PAYROLL / SALARY ROUTE CONFIG
// ==========================================
export const payrollConfig = {
  api: hrmsApi.salary,
  selectOptions: { employeeId: hrmsApi.employees.list },
  tableName: "salaries",
  moduleName: "Salary File",
  pluralName: "Payroll Records",
  zodSchema: z.object({
    employeeId: z.string().min(1, "Select an employee"),
    effectiveFrom: z.string().min(2, "Start date required"),
    basic: z.coerce.number(),
    hra: z.coerce.number(),
    allowances: z.coerce.number(),
    deductions: z.coerce.number(),
  }),
  defaultFormValues: {
    employeeId: "emp-1",
    effectiveFrom: new Date().toISOString().split("T")[0],
    basic: "0",
    hra: "0",
    allowances: "0",
    deductions: "0",
  },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Payroll" }],
  columns: [
    {
      accessorKey: "employeeId",
      header: "Employee",
      cell: ({ getValue }) => {
        const id = getValue();
        if (id === "emp-1") return "Gabriel Dhillon";
        if (id === "emp-2") return "Rajesh Kumar";
        if (id === "emp-3") return "Priya Sharma";
        return String(id);
      },
    },
    { accessorKey: "effectiveFrom", header: "Effective From" },
    {
      accessorKey: "basic",
      header: "Basic Salary",
      cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString()}`,
    },
    {
      accessorKey: "hra",
      header: "HRA Benefit",
      cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString()}`,
    },
    {
      accessorKey: "allowances",
      header: "Special Allowances",
      cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString()}`,
    },
    {
      accessorKey: "deductions",
      header: "Provident Deductions",
      cell: ({ getValue }) => `₹${Number(getValue()).toLocaleString()}`,
    },
    {
      accessorKey: "ctc",
      header: sortableHeader("Total CTC (Monthly)"),
      cell: ({ row }) => {
        const ctc =
          Number(row.original.basic) +
          Number(row.original.hra) +
          Number(row.original.allowances) -
          Number(row.original.deductions);
        return `₹${ctc.toLocaleString()}`;
      },
    },
  ] as ColumnDef<Salary>[],
  fields: [
    {
      name: "employeeId",
      label: "Select Employee",
      type: "select",
      options: [
        { label: "Gabriel Dhillon", value: "emp-1" },
        { label: "Rajesh Kumar", value: "emp-2" },
        { label: "Priya Sharma", value: "emp-3" },
      ],
      required: true,
    },
    {
      name: "effectiveFrom",
      label: "Effective Date",
      type: "date",
      required: true,
    },
    {
      name: "basic",
      label: "Basic Salary (Monthly)",
      type: "number",
      placeholder: "50000",
      required: true,
    },
    {
      name: "hra",
      label: "HRA Benefit",
      type: "number",
      placeholder: "20000",
      required: true,
    },
    {
      name: "allowances",
      label: "Other Allowances",
      type: "number",
      placeholder: "10000",
      required: true,
    },
    {
      name: "deductions",
      label: "Total Deductions (PF/Tax)",
      type: "number",
      placeholder: "5000",
      required: true,
    },
  ] as any[],
  statsCards: (data: Salary[]) => [
    { label: "Staff Count", value: data.length },
    {
      label: "Monthly Payroll Overhead",
      value: `₹${data.reduce((sum, item) => sum + (Number(item.basic) + Number(item.hra) + Number(item.allowances) - Number(item.deductions)), 0).toLocaleString()}`,
    },
  ],
};

// ==========================================
// 11. HOLIDAYS CONFIG
// ==========================================
export const holidaysConfig = {
  api: hrmsApi.holidays,
  tableName: "holidays",
  moduleName: "Holiday",
  pluralName: "Holidays",
  zodSchema: z.object({
    name: z.string().min(2, "Name is required"),
    date: z.string().min(2, "Date is required"),
    type: z.string().optional().nullable(),
  }),
  defaultFormValues: { name: "", date: "", type: "NATIONAL" },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Holidays" }],
  columns: [
    { accessorKey: "name", header: sortableHeader("Holiday Event") },
    {
      accessorKey: "date",
      header: sortableHeader("Date"),
      cell: ({ getValue }) =>
        getValue() ? new Date(getValue() as string).toLocaleDateString() : "—",
    },
    { accessorKey: "type", header: "Type" },
  ] as ColumnDef<any>[],
  fields: [
    {
      name: "name",
      label: "Holiday Name",
      type: "text",
      placeholder: "Independence Day",
      required: true,
    },
    { name: "date", label: "Holiday Date", type: "date", required: true },
    {
      name: "type",
      label: "Type classification",
      type: "select",
      options: [
        { label: "National Holiday", value: "NATIONAL" },
        { label: "Regional Holiday", value: "REGIONAL" },
        { label: "Optional Holiday", value: "OPTIONAL" },
      ],
    },
  ] as any[],
  statsCards: (data: any[]) => [
    { label: "Scheduled Holidays", value: data.length },
  ],
};

// ==========================================
// 12. SHIFT MANAGEMENT CONFIG
// ==========================================
export const shiftsConfig = {
  api: hrmsApi.shifts,
  tableName: "shifts",
  moduleName: "Shift",
  pluralName: "Shifts",
  zodSchema: z.object({
    name: z.string().min(2, "Name is required"),
    startTime: z.string().min(2, "Start Time is required"),
    endTime: z.string().min(2, "End Time is required"),
  }),
  defaultFormValues: { name: "", startTime: "", endTime: "" },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Shifts" }],
  columns: [
    { accessorKey: "name", header: sortableHeader("Shift Name") },
    { accessorKey: "startTime", header: "Start time" },
    { accessorKey: "endTime", header: "End time" },
  ] as ColumnDef<any>[],
  fields: [
    {
      name: "name",
      label: "Shift Name",
      type: "text",
      placeholder: "Day Shift A",
      required: true,
    },
    {
      name: "startTime",
      label: "Start Time (HH:MM)",
      type: "text",
      placeholder: "09:00",
      required: true,
    },
    {
      name: "endTime",
      label: "End Time (HH:MM)",
      type: "text",
      placeholder: "18:00",
      required: true,
    },
  ] as any[],
};
