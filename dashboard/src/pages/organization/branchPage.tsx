import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import {
  Plus,
  Search,
  Calendar,
  Info,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import { organizationApi } from "@/services/organization";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import { canPerformPageAction } from "@/utils/pagePermissions";
import type { Branch } from "@/types/erp";

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

const renderDisplayValue = (key: string, value: unknown, record?: Record<string, any>): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "—";

  if (typeof value === "string" && key.endsWith("Id") && record) {
    const relationKey = key.slice(0, -2);
    const relationObj = record[relationKey];
    if (relationObj && typeof relationObj === "object") {
      const label = relationObj.name ?? relationObj.title ?? relationObj.code ?? relationObj.id;
      if (label) return String(label);
    }
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)
  ) {
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

const asInputValue = (value: unknown) => (value == null ? "" : String(value));

export function BranchPage() {
  const [searchParams] = useSearchParams();
  const globalStore = useERPStore();

  const [search, setSearch] = useState("");
  const [formValues, setFormValues] = useState<Record<string, unknown>>({
    companyId: "",
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
  });
  const [editingRecord, setEditingRecord] = useState<Branch | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Branch | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Branch | null>(null);
  const [companyOptions, setCompanyOptions] = useState<Array<{ id: string; name: string }>>([]);

  const currentUser = globalStore.users?.find(
    (u: any) => u.id === globalStore.currentUserId,
  ) as any;
  const canCreate = canPerformPageAction(currentUser?.actionPermissions, "branches", "create");
  const canEdit = canPerformPageAction(currentUser?.actionPermissions, "branches", "edit");
  const canDelete = canPerformPageAction(currentUser?.actionPermissions, "branches", "delete");

  const defaultFormValues = {
    companyId: "",
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    isActive: true,
  };

  const zodSchema = z.object({
    companyId: z.string().uuid("Select a company"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    code: z.string().min(2, "Branch Code must be at least 2 characters"),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  });

  const fields: Array<{ name: string; label: string; type: "text" | "select" | "checkbox"; placeholder?: string; required?: boolean }> = [
    { name: "companyId", label: "Company", type: "select", required: true },
    { name: "name", label: "Branch Name", type: "text", placeholder: "Enter branch name", required: true },
    { name: "code", label: "Branch Code", type: "text", placeholder: "B-MUM-HQ", required: true },
    { name: "address", label: "Branch Address", type: "text", placeholder: "Enter street details" },
    { name: "city", label: "City", type: "text", placeholder: "Mumbai" },
    { name: "state", label: "State", type: "text", placeholder: "Maharashtra" },
    { name: "pincode", label: "Pincode", type: "text", placeholder: "400001" },
    { name: "isActive", label: "Active", type: "checkbox" },
  ];

  const columns: ColumnDef<Branch>[] = [
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
  ];

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try {
      setRecords(await organizationApi.branches.list());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to load branches.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCompanies = useCallback(async () => {
    try {
      const companies = await organizationApi.companies.list();
      setCompanyOptions(companies.map((c: any) => ({ id: c.id, name: c.name })));
    } catch (err) {
      console.warn("Unable to load companies:", err);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
    void loadCompanies();
  }, [loadRecords, loadCompanies]);

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
    { label: "Total Branches", value: records.length },
    { label: "Active Locations", value: records.filter((b) => b.isActive).length },
  ], [records]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormValues(defaultFormValues);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (record: Branch) => {
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
      if (editingRecord && organizationApi.branches.update) {
        await organizationApi.branches.update(editingRecord.id, result.data as Record<string, unknown>);
      } else {
        await organizationApi.branches.create(result.data as Record<string, unknown>);
      }
      await loadRecords();
      setIsFormOpen(false);
      toast.success("Branch saved successfully.");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ?? "Unable to save branch.",
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
        <span className="text-foreground">Branches</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Branches</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage branches.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" /> Add Branch
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
          </div>
        ))}
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search branches..."
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
        storageKey="branches"
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {editingRecord ? "Update Entry" : "New Entry"}
            </p>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">
              {editingRecord ? "Edit Branch" : "Add Branch"}
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
                  {field.type === "select" ? (
                    <Select
                      value={asInputValue(formValues[field.name])}
                      onValueChange={(value) => setField(field.name, value)}
                    >
                      <SelectTrigger
                        id={field.name}
                        className="w-full bg-card hover:bg-card/85 transition-colors border-border/80 focus:ring-1 focus:ring-primary"
                      >
                        <SelectValue placeholder={`Select ${field.label}`}>
                          {companyOptions
                            .find((o) => o.id === asInputValue(formValues[field.name]))
                            ?.name ?? undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {companyOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                {editingRecord ? "Save changes" : "Create Branch"}
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
                <DialogTitle>Branch Overview</DialogTitle>
                <DialogDescription>
                  View complete branch details.
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
                                {renderDisplayValue(key, value, viewingRecord as Record<string, any>)}
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
                                {renderDisplayValue(key, value, viewingRecord as Record<string, any>)}
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
        title="Move Branch to Recycle Bin?"
        description="This branch will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin."
        confirmText="Move to Bin"
        onConfirm={async () => {
          if (!recordToDelete) return;
          setIsLoading(true);
          try {
            if (organizationApi.branches.remove) {
              await organizationApi.branches.remove(recordToDelete.id);
              await loadRecords();
            }
            toast.success("Branch deleted successfully.");
          } catch (error: any) {
            toast.error(
              error.response?.data?.message ?? "Unable to delete branch.",
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

export default BranchPage;
