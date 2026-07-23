import { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import { sortableHeader } from "@/components/tables/genericTable";
import { organizationApi } from "@/services/organization";
import {
  Company,
  Branch,
  Department,
  Team,
  Designation,
  CostCenter,
} from "@/types/erp";

// ==========================================
// 1. COMPANIES ROUTE CONFIG
// ==========================================
export const companiesConfig = {
  tableName: "companies",
  moduleName: "Company",
  pluralName: "Companies",
  searchPlaceholder: "Search companies...",
  api: organizationApi.companies,
  zodSchema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    gst: z.string().optional().nullable(),
    pan: z.string().optional().nullable(),
    email: z.string().email("Invalid email address").or(z.string().length(0)),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    name: "",
    gst: "",
    pan: "",
    email: "",
    phone: "",
    address: "",
    isActive: true,
  },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Companies" }],
  columns: [
    { accessorKey: "id", header: "ID", enableSorting: false },
    { accessorKey: "name", header: sortableHeader("Name") },
    { accessorKey: "gst", header: "GSTIN" },
    { accessorKey: "pan", header: "PAN" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "phone", header: "Phone" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => {
        const val = getValue();
        return (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${val ? "bg-success/15 text-success" : "bg-muted-foreground/15 text-muted-foreground"}`}
          >
            {val ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ] as ColumnDef<Company>[],
  fields: [
    {
      name: "name",
      label: "Company Name",
      type: "text",
      placeholder: "Enter company name",
      required: true,
    },
    {
      name: "gst",
      label: "GSTIN",
      type: "text",
      placeholder: "27AAAAA1111A1Z1",
    },
    { name: "pan", label: "PAN", type: "text", placeholder: "AAAAA1111A" },
    {
      name: "email",
      label: "Email Address",
      type: "text",
      placeholder: "info@company.com",
    },
    {
      name: "phone",
      label: "Phone Number",
      type: "text",
      placeholder: "+91 22 5555 1234",
    },
    {
      name: "address",
      label: "Registered Address",
      type: "textarea",
      placeholder: "Enter address details",
    },
    { name: "isActive", label: "Active", type: "checkbox" },
  ] as any[],
  statsCards: (data: Company[]) => [
    { label: "Total Companies", value: data.length },
    {
      label: "Active Companies",
      value: data.filter((c) => c.isActive).length,
      change: "100%",
      trend: "up" as const,
    },
    { label: "Compliance Pending", value: 0 },
  ],
};

// ==========================================
// 2. BRANCHES ROUTE CONFIG
// ==========================================
export const branchesConfig = {
  tableName: "branches",
  moduleName: "Branch",
  pluralName: "Branches",
  searchPlaceholder: "Search branches...",
  api: organizationApi.branches,
  zodSchema: z.object({
    companyId: z.string().uuid("Select a company"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Branch Code must be at least 2 characters"),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: {
    companyId: "",
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
  },
  selectOptions: { companyId: organizationApi.companies.list },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Branches" }],
  columns: [
    { accessorKey: "code", header: sortableHeader("Branch Code") },
    { accessorKey: "name", header: sortableHeader("Branch Name") },
    { accessorKey: "city", header: "City" },
    { accessorKey: "state", header: "State" },
    { accessorKey: "pincode", header: "Pincode" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getValue() ? "bg-success/15 text-success" : "bg-muted-foreground/15 text-muted-foreground"}`}
        >
          {getValue() ? "Active" : "Inactive"}
        </span>
      ),
    },
  ] as ColumnDef<Branch>[],
  fields: [
    { name: "companyId", label: "Company", type: "select", required: true },
    {
      name: "name",
      label: "Branch Name",
      type: "text",
      placeholder: "Enter branch name",
      required: true,
    },
    {
      name: "code",
      label: "Branch Code",
      type: "text",
      placeholder: "B-MUM-HQ",
      required: true,
    },
    {
      name: "address",
      label: "Branch Address",
      type: "text",
      placeholder: "Enter street details",
    },
    { name: "city", label: "City", type: "text", placeholder: "Mumbai" },
    { name: "state", label: "State", type: "text", placeholder: "Maharashtra" },
    { name: "pincode", label: "Pincode", type: "text", placeholder: "400001" },
    { name: "isActive", label: "Active", type: "checkbox" },
  ] as any[],
  statsCards: (data: Branch[]) => [
    { label: "Total Branches", value: data.length },
    { label: "Active Locations", value: data.filter((b) => b.isActive).length },
  ],
};

// ==========================================
// 3. DEPARTMENTS ROUTE CONFIG
// ==========================================
export const departmentsConfig = {
  tableName: "departments",
  api: organizationApi.departments,
  moduleName: "Department",
  pluralName: "Departments",
  zodSchema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Code must be at least 2 characters"),
    branchId: z.string().min(1, "Select a branch"),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: { name: "", code: "", branchId: "", isActive: true },
  selectOptions: { branchId: organizationApi.branches.list },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Departments" }],
  columns: [
    { accessorKey: "code", header: sortableHeader("Dept Code") },
    { accessorKey: "name", header: sortableHeader("Department Name") },
    { accessorKey: "branchId", header: "Branch ID" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getValue() ? "bg-success/15 text-success" : "bg-muted-foreground/15 text-muted-foreground"}`}
        >
          {getValue() ? "Active" : "Inactive"}
        </span>
      ),
    },
  ] as ColumnDef<Department>[],
  fields: [
    {
      name: "branchId",
      label: "Branch Location",
      type: "select",
      options: [
        { label: "Mumbai HQ", value: "branch-1" },
        { label: "Pune Plant", value: "branch-2" },
        { label: "Delhi Office", value: "branch-3" },
      ],
      required: true,
    },
    {
      name: "name",
      label: "Department Name",
      type: "text",
      placeholder: "Human Resources",
      required: true,
    },
    {
      name: "code",
      label: "Department Code",
      type: "text",
      placeholder: "D-MUM-HR",
      required: true,
    },
    { name: "isActive", label: "Active", type: "checkbox" },
  ] as any[],
  statsCards: (data: Department[]) => [
    { label: "Total Departments", value: data.length },
  ],
};

// ==========================================
// 4. TEAMS ROUTE CONFIG
// ==========================================
export const teamsConfig = {
  tableName: "teams",
  api: organizationApi.teams,
  moduleName: "Team",
  pluralName: "Teams",

  zodSchema: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    departmentId: z.string().min(1, "Select a department"),
    isActive: z.boolean().default(true),
  }),
  defaultFormValues: { name: "", departmentId: "", isActive: true },
  selectOptions: { departmentId: organizationApi.departments.list },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Teams" }],
  columns: [
    { accessorKey: "id", header: "ID" },
    { accessorKey: "name", header: sortableHeader("Team Name") },
    { accessorKey: "departmentId", header: "Department ID" },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ getValue }) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            getValue()
              ? "bg-success/15 text-success"
              : "bg-muted-foreground/15 text-muted-foreground"
          }`}
        >
          {getValue() ? "Active" : "Inactive"}
        </span>
      ),
    },
  ] as ColumnDef<Team>[],

  fields: [
    {
      name: "departmentId",
      label: "Department",
      type: "select",
      options: [
        { label: "Sales & Marketing", value: "dept-1" },
        { label: "Human Resources", value: "dept-2" },
        { label: "Finance & Accounts", value: "dept-3" },
        { label: "Production Control", value: "dept-4" },
      ],
      required: true,
    },
    {
      name: "name",
      label: "Team Name",
      type: "text",
      placeholder: "Bidding Specialists",
      required: true,
    },
    {
      name: "isActive",
      label: "Active",
      type: "checkbox",
    },
  ] as any[],

  statsCards: (data: Team[]) => [
    {
      label: "Total Teams",
      value: data.length,
    },
  ],
};

// ==========================================
// 5. DESIGNATIONS ROUTE CONFIG
// ==========================================
export const designationsConfig = {
  tableName: "designations",
  api: organizationApi.designations,
  moduleName: "Designation",
  pluralName: "Designations",
  zodSchema: z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    level: z.coerce.number(),
  }),
  defaultFormValues: { title: "", level: "1" },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Designations" }],
  columns: [
    { accessorKey: "title", header: sortableHeader("Title") },
    { accessorKey: "level", header: sortableHeader("Seniority Level") },
  ] as ColumnDef<Designation>[],
  fields: [
    {
      name: "title",
      label: "Designation Title",
      type: "text",
      placeholder: "Senior Manager",
      required: true,
    },
    {
      name: "level",
      label: "Seniority Level (1-10)",
      type: "number",
      placeholder: "7",
      required: true,
    },
  ] as any[],
};

// ==========================================
// 6. COST CENTERS ROUTE CONFIG
// ==========================================
export const costCentersConfig = {
  tableName: "costCenters",
  api: organizationApi.costCenters,
  moduleName: "Cost Center",
  pluralName: "Cost Centers",
  zodSchema: z.object({
    code: z.string().min(2, "Code must be at least 2 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    budget: z.coerce.number(),
    departmentId: z.string().optional().nullable(),
  }),
  defaultFormValues: { code: "", name: "", budget: "0", departmentId: "" },
  selectOptions: { departmentId: organizationApi.departments.list },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Cost Centers" }],
  columns: [
    { accessorKey: "code", header: sortableHeader("Code") },
    { accessorKey: "name", header: sortableHeader("Name") },
    {
      accessorKey: "budget",
      header: sortableHeader("Annual Budget"),
      cell: ({ getValue }) => `₹${Number(getValue() || 0).toLocaleString()}`,
    },
    { accessorKey: "departmentId", header: "Department ID" },
  ] as ColumnDef<CostCenter>[],
  fields: [
    {
      name: "code",
      label: "Cost Center Code",
      type: "text",
      placeholder: "CC-MUM-SALES",
      required: true,
    },
    {
      name: "name",
      label: "Cost Center Name",
      type: "text",
      placeholder: "Marketing Overhead",
      required: true,
    },
    {
      name: "budget",
      label: "Budget Allocation (INR)",
      type: "number",
      placeholder: "500000",
      required: true,
    },
    {
      name: "departmentId",
      label: "Department Link",
      type: "select",
      options: [
        { label: "Sales & Marketing", value: "dept-1" },
        { label: "Human Resources", value: "dept-2" },
        { label: "Finance & Accounts", value: "dept-3" },
      ],
    },
  ] as any[],
  statsCards: (data: CostCenter[]) => [
    { label: "Cost Centers", value: data.length },
    {
      label: "Total ERP Budget",
      value: `₹${data.reduce((sum, item) => sum + Number(item.budget || 0), 0).toLocaleString()}`,
    },
  ],
};