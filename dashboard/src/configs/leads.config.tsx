import { crmApi } from "@/services/modules";
import type { CrudField } from "@/components/crud/types";
import { LeadStatus } from "@/types/erp";
import * as z from "zod";

export const leadsConfig = {
  api: crmApi.leads,

  tableName: "leads",

  moduleName: "Lead",

  pluralName: "Leads",

  searchPlaceholder: "Search Leads...",

  zodSchema: z.object({
    name: z.string().min(2),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    company: z.string().optional().nullable(),
    status: z.string(),
  }),

  defaultFormValues: {
    name: "",
    email: "",
    phone: "",
    company: "",
    status: "NEW",
  },

  breadcrumbs: [
    { label: "Dashboard", href: "/" },
    { label: "Lead Management" },
  ],

  columns: [
    {
      accessorKey: "name",
      header: "Lead Name",
    },
    {
      accessorKey: "company",
      header: "Company",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ],

  fields: [
    {
      name: "name",
      label: "Lead Name",
      type: "text",
      required: true,
    },
    {
      name: "company",
      label: "Company",
      type: "text",
    },
    {
      name: "email",
      label: "Email",
      type: "text",
    },
    {
      name: "phone",
      label: "Phone",
      type: "text",
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: [
        { label: "New", value: "NEW" },
        { label: "Qualified", value: "QUALIFIED" },
        { label: "Proposal", value: "PROPOSAL" },
        { label: "Won", value: "WON" },
        { label: "Lost", value: "LOST" },
      ],
    },
  ] satisfies CrudField[],
};