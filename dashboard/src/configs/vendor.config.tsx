import { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import { sortableHeader } from "@/components/tables/genericTable";
import { tenderApi } from "@/services/modules";

export const vendorsConfig = {
  api: tenderApi.vendors,
  tableName: "vendors",
  moduleName: "Vendor",
  pluralName: "Vendors",
  searchPlaceholder: "Search by name or GST...",
  zodSchema: z.object({
    name: z.string().min(2, "Vendor name must be at least 2 characters"),
    category: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z
      .string()
      .max(10, "Phone number cannot exceed 10 digits")
      .optional()
      .nullable()
      .refine(
        (v) => !v || /^[6-9]\d{9}$/.test(v.trim()),
        { message: "Enter a valid 10-digit Indian mobile number" }
      ),
    email: z
      .string()
      .optional()
      .nullable()
      .refine(
        (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        { message: "Enter a valid email address" }
      ),
    gstNumber: z
      .string()
      .optional()
      .nullable()
      .refine(
        (v) => !v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(v.toUpperCase()),
        { message: "Enter a valid 15-character GSTIN (e.g. 22AAAAA0000A1Z5)" }
      ),
    address: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
  }),
  defaultFormValues: {
    name: "",
    category: "",
    contactPerson: "",
    phone: "",
    email: "",
    gstNumber: "",
    address: "",
    notes: "",
  },
  breadcrumbs: [{ label: "Dashboard", href: "/" }, { label: "Vendors" }],
  columns: [
    {
      accessorKey: "name",
      header: sortableHeader("Vendor Name"),
    },
    { accessorKey: "category", header: "Category" },
    { accessorKey: "contactPerson", header: "Contact Person" },
    { accessorKey: "phone", header: "Phone" },
    { accessorKey: "email", header: "Email" },
    { accessorKey: "gstNumber", header: "GSTIN" },
  ] as ColumnDef<any>[],
  fields: [
    { name: "name", label: "Vendor Name", type: "text", required: true },
    { name: "category", label: "Category", type: "text" },
    { name: "contactPerson", label: "Contact Person", type: "text" },
    { name: "phone", label: "Phone", type: "text" },
    { name: "email", label: "Email", type: "text" },
    { name: "gstNumber", label: "GSTIN", type: "text" },
    { name: "address", label: "Address", type: "textarea" },
    { name: "notes", label: "Notes", type: "textarea" },
  ],
};
