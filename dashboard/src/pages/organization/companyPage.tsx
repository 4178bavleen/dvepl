import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import {
  Plus,
  Search,
  Calendar,
  Info,
  Layers,
} from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import { organizationApi } from "@/services/organization";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import { canPerformPageAction } from "@/utils/pagePermissions";
import type { Company } from "@/types/erp";

const IGNORED_KEYS = new Set([
  "id",
  "companyId",
  "passwordHash",
  "tokenHash",
  "otpHash",
  "activationToken",
  "deletedAt",
  "company",
  "userPermissions",
  "createdAt",
  "updatedAt",
  "contacts",
]);

const formatFieldLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\sId$/, "");

const renderDisplayValue = (key: string, value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value).toLocaleString();
  }

  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 px-2.5 py-0.5 text-xs font-semibold">
        No
      </span>
    );
  }

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const label = obj.name ?? obj.title ?? obj.code ?? obj.id;
    return label ? String(label) : "—";
  }

  return String(value);
};

const groupRecordFields = (record: Record<string, any>, hiddenFields: string[] = []) => {
  const core: Array<{ key: string; value: any }> = [];
  const dates: Array<{ key: string; value: any }> = [];

  Object.entries(record)
    .filter(([key]) => !IGNORED_KEYS.has(key) && !hiddenFields.includes(key))
    .forEach(([key, value]) => {
      if (key === "status" || key === "name" || key === "title") return;
      if (key.endsWith("Id")) {
        const relationKey = key.slice(0, -2);
        if (record[relationKey] !== undefined) return;
      }
      if (
        (typeof value === "string" &&
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) ||
        key.toLowerCase().includes("date") ||
        key === "createdAt" ||
        key === "updatedAt"
      ) {
        dates.push({ key, value });
      } else if (typeof value !== "object" || value === null) {
        core.push({ key, value });
      }
    });

  return { core, dates };
};

const zodSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  gst: z.string().optional().nullable(),
  pan: z.string().optional().nullable(),
  email: z.string().email("Invalid email address").or(z.string().length(0)),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

const defaultFormValues = {
  name: "",
  gst: "",
  pan: "",
  email: "",
  phone: "",
  address: "",
  isActive: true,
};

const fields = [
  { name: "name", label: "Company Name", type: "text" as const, placeholder: "Enter company name", required: true },
  { name: "gst", label: "GSTIN", type: "text" as const, placeholder: "27AAAAA1111A1Z1" },
  { name: "pan", label: "PAN", type: "text" as const, placeholder: "AAAAA1111A" },
  { name: "email", label: "Email Address", type: "text" as const, placeholder: "info@company.com" },
  { name: "phone", label: "Phone Number", type: "text" as const, placeholder: "+91 22 5555 1234" },
  { name: "address", label: "Registered Address", type: "textarea" as const, placeholder: "Enter address details" },
  { name: "isActive", label: "Active", type: "checkbox" as const },
];

const columns: ColumnDef<Company>[] = [
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
];

const asInputValue = (value: unknown) => (value == null ? "" : String(value));

export function CompanyPage() {
  const [searchParams] = useSearchParams();
  const globalStore = useERPStore();

  const [search, setSearch] = useState("");
  const [formValues, setFormValues] = useState<Record<string, unknown>>(defaultFormValues);
  const [editingRecord, setEditingRecord] = useState<Company | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Company | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Company | null>(null);

  const currentUser = globalStore.users?.find(
    (u: any) => u.id === globalStore.currentUserId,
  ) as any;
  const canCreate = canPerformPageAction(currentUser?.actionPermissions, "companies", "create");
  const canEdit = canPerformPageAction(currentUser?.actionPermissions, "companies", "edit");
  const canDelete = canPerformPageAction(currentUser?.actionPermissions, "companies", "delete");

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecords(await organizationApi.companies.list());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to load companies.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    let hasPrefill = false;
    const prefilled: Record<string, unknown> = { ...defaultFormValues };

    fields.forEach((field) => {
      const val = searchParams.get(field.name);
      if (val !== null) {
        prefilled[field.name] = val;
        hasPrefill = true;
      }
    });

    if (hasPrefill) {
      setFormValues(prefilled);
      setIsFormOpen(true);
    }
  }, []);

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

  const statsCards = useMemo(() => [
    { label: "Total Companies", value: records.length },
    {
      label: "Active Companies",
      value: records.filter((c) => c.isActive).length,
      change: "100%",
      trend: "up" as const,
    },
    { label: "Compliance Pending", value: 0 },
  ], [records]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormValues(defaultFormValues);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (record: Company) => {
    setEditingRecord(record);
    setFormValues({ ...defaultFormValues, ...record });
    setErrors({});
    setIsFormOpen(true);
  };

  const setField = (name: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = zodSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? "form");
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingRecord && organizationApi.companies.update) {
        await organizationApi.companies.update(editingRecord.id, result.data as Record<string, unknown>);
      } else {
        await organizationApi.companies.create(result.data as Record<string, unknown>);
      }
      await loadRecords();
      setIsFormOpen(false);
      toast.success("Company saved successfully.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to save company.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewingGroups = useMemo(
    () =>
      viewingRecord
        ? groupRecordFields(viewingRecord as unknown as Record<string, any>)
        : null,
    [viewingRecord],
  );

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span className="text-foreground">Dashboard</span>
        <span className="mx-2">/</span>
        <span className="text-foreground">Companies</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Companies</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage companies.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> Add Company
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-200">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200"
          >
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{card.label}</p>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground">{card.value}</p>
            {card.change && (
              <p className="mt-1.5 text-xs text-muted-foreground font-semibold">
                {card.change}
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search companies..."
          className="pl-9"
        />
      </div>

      <GenericTable<any>
        columns={columns as any}
        data={filteredRecords}
        onView={setViewingRecord}
        onEdit={canEdit ? openEdit : undefined}
        onDelete={
          !canDelete
            ? undefined
            : (record) => {
              setRecordToDelete(record);
              setDeleteConfirmOpen(true);
            }
        }
        isLoading={isLoading}
        freezeActions={true}
        storageKey="companies"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {editingRecord ? "Update Entry" : "New Entry"}
            </p>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {editingRecord ? "Edit Company" : "Add Company"}
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
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      id={field.name}
                      value={asInputValue(formValues[field.name])}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setField(field.name, event.target.value)
                      }
                      className="min-h-[120px] bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  ) : field.type === "checkbox" ? (
                    <div className="flex h-10 items-center gap-2.5 px-3 rounded-lg border border-border/80 bg-card hover:bg-card/85 transition-colors">
                      <Checkbox
                        id={field.name}
                        checked={Boolean(formValues[field.name])}
                        onCheckedChange={(checked) =>
                          setField(field.name, Boolean(checked))
                        }
                        className="border-muted-foreground/50 data-[state=checked]:bg-primary"
                      />
                      <Label
                        htmlFor={field.name}
                        className="text-sm font-medium text-foreground cursor-pointer select-none"
                      >
                        Active / Enabled
                      </Label>
                    </div>
                  ) : (
                    <Input
                      id={field.name}
                      type={field.type}
                      value={asInputValue(formValues[field.name])}
                      placeholder={field.placeholder}
                      onChange={(event) =>
                        setField(field.name, event.target.value)
                      }
                      className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  )}
                  {errors[field.name] && (
                    <p className="text-xs text-destructive font-medium mt-0.5">
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
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
                {editingRecord ? "Save changes" : "Create Company"}
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
                <DialogTitle>Company Overview</DialogTitle>
                <DialogDescription>
                  View complete company details.
                </DialogDescription>
              </DialogHeader>

              <div className="px-6 pb-6">
                {viewingGroups && (
                  <div className="space-y-6 py-4">
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
                                {renderDisplayValue(key, value)}
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
                                {renderDisplayValue(key, value)}
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
        title="Move Company to Recycle Bin?"
        description="This company will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin."
        confirmText="Move to Bin"
        onConfirm={async () => {
          if (!recordToDelete) return;
          setIsLoading(true);
          try {
            if (organizationApi.companies.remove) {
              await organizationApi.companies.remove(recordToDelete.id);
              await loadRecords();
            }
            toast.success("Company deleted successfully.");
          } catch (error: any) {
            toast.error(
              error.response?.data?.message ?? "Unable to delete company.",
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

export default CompanyPage;
