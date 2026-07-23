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
    name: z.string().min(2, "Vendor name is required"),
    category: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email("Invalid email format").or(z.literal("")).optional().nullable(),
    gstNumber: z.string().optional().nullable(),
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
