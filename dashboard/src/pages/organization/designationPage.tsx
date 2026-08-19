import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import { Plus, Search, Calendar, Info } from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import { organizationApi } from "@/services/organization";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import { canPerformPageAction } from "@/utils/pagePermissions";
import type { Designation } from "@/types/erp";

const IGNORED_KEYS = new Set([
  "id", "companyId", "passwordHash", "tokenHash", "otpHash",
  "activationToken", "deletedAt", "company", "userPermissions",
  "createdAt", "updatedAt", "contacts",
]);

const formatFieldLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).replace(/\sId$/, "");

const renderDisplayValue = (key: string, value: unknown): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return new Date(value).toLocaleString();
  if (typeof value === "boolean") return value
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">Yes</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 px-2.5 py-0.5 text-xs font-semibold">No</span>;
  if (typeof value === "object") { const l = (value as any).name ?? (value as any).title ?? (value as any).code ?? (value as any).id; return l ? String(l) : "—"; }
  return String(value);
};

const groupRecordFields = (record: Record<string, any>) => {
  const core: Array<{ key: string; value: any }> = [];
  const dates: Array<{ key: string; value: any }> = [];
  Object.entries(record)
    .filter(([key]) => !IGNORED_KEYS.has(key))
    .forEach(([key, value]) => {
      if (key === "status" || key === "name" || key === "title") return;
      if ((typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) || key.toLowerCase().includes("date") || key === "createdAt" || key === "updatedAt")
        dates.push({ key, value });
      else if (typeof value !== "object" || value === null) core.push({ key, value });
    });
  return { core, dates };
};

const asInputValue = (v: unknown) => (v == null ? "" : String(v));

export function DesignationPage() {
  const [searchParams] = useSearchParams();
  const globalStore = useERPStore();
  const [search, setSearch] = useState("");
  const [formValues, setFormValues] = useState<Record<string, unknown>>({ title: "", level: "1" });
  const [editingRecord, setEditingRecord] = useState<Designation | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Designation | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Designation | null>(null);

  const currentUser = globalStore.users?.find((u: any) => u.id === globalStore.currentUserId) as any;
  const canCreate = canPerformPageAction(currentUser?.actionPermissions, "designations", "create");
  const canEdit = canPerformPageAction(currentUser?.actionPermissions, "designations", "edit");
  const canDelete = canPerformPageAction(currentUser?.actionPermissions, "designations", "delete");

  const defaultFormValues = { title: "", level: "1" };
  const zodSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    level: z.coerce.number(),
  });
  const fields: Array<{ name: string; label: string; type: "text" | "number"; placeholder?: string; required?: boolean }> = [
    { name: "title", label: "Designation Title", type: "text", placeholder: "Senior Manager", required: true },
    { name: "level", label: "Seniority Level (1-10)", type: "number", placeholder: "7", required: true },
  ];
  const columns: ColumnDef<Designation>[] = [
    {
      accessorKey: "title", header: sortableHeader("Title"),
      cell: ({ row }) => <span className="font-semibold text-foreground">{row.original.title}</span>,
    },
    {
      accessorKey: "level", header: sortableHeader("Seniority Level"),
      cell: ({ getValue }) => {
        const lvl = Number(getValue() || 0);
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            Level {lvl}
          </span>
        );
      },
    },
  ];

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try { setRecords(await organizationApi.designations.list()); }
    catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to load designations."); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  useEffect(() => {
    let hasPrefill = false;
    const prefilled: Record<string, unknown> = { ...defaultFormValues };
    fields.forEach((f) => { const v = searchParams.get(f.name); if (v !== null) { prefilled[f.name] = v; hasPrefill = true; } });
    if (hasPrefill) { setFormValues(prefilled); setIsFormOpen(true); }
  }, []);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [records, search]);

  const openCreate = () => { setEditingRecord(null); setFormValues(defaultFormValues); setErrors({}); setIsFormOpen(true); };
  const openEdit = (r: Designation) => { setEditingRecord(r); setFormValues({ ...defaultFormValues, ...r }); setErrors({}); setIsFormOpen(true); };
  const setField = (name: string, value: unknown) => { setFormValues((c) => ({ ...c, [name]: value })); setErrors((c) => ({ ...c, [name]: "" })); };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = zodSchema.safeParse(formValues);
    if (!result.success) { const fe: Record<string, string> = {}; result.error.issues.forEach((i) => { const f = String(i.path[0] ?? "form"); if (!fe[f]) fe[f] = i.message; }); setErrors(fe); return; }
    setIsSubmitting(true);
    try {
      if (editingRecord && organizationApi.designations.update) await organizationApi.designations.update(editingRecord.id, result.data as Record<string, unknown>);
      else await organizationApi.designations.create(result.data as Record<string, unknown>);
      await loadRecords(); setIsFormOpen(false); toast.success("Designation saved successfully.");
    } catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to save designation."); }
    finally { setIsSubmitting(false); }
  };

  const viewingGroups = useMemo(() => viewingRecord ? groupRecordFields(viewingRecord as unknown as Record<string, any>) : null, [viewingRecord]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span className="text-foreground">Dashboard</span><span className="mx-2">/</span><span className="text-foreground">Designations</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Designations</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage designations.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && <Button onClick={openCreate} className="gap-2"><Plus className="size-4" /> Add Designation</Button>}
        </div>
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search designations..." className="pl-9" />
      </div>
      <GenericTable<any> columns={columns as any} data={filteredRecords} onView={setViewingRecord} onEdit={canEdit ? openEdit : undefined}
        onDelete={!canDelete ? undefined : (r) => { setRecordToDelete(r); setDeleteConfirmOpen(true); }} isLoading={isLoading} freezeActions={false} storageKey="designations" />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{editingRecord ? "Update Entry" : "New Entry"}</p>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{editingRecord ? "Edit Designation" : "Add Designation"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Complete the details below to update the system logs.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {field.label}{field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  <Input id={field.name} type={field.type} value={asInputValue(formValues[field.name])} placeholder={field.placeholder}
                    onChange={(e) => setField(field.name, e.target.value)} className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary" />
                  {errors[field.name] && <p className="text-xs text-destructive font-medium mt-0.5">{errors[field.name]}</p>}
                </div>
              ))}
            </div>
            <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-end gap-3 sticky bottom-0 bg-background">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="hover:bg-muted/80">Cancel</Button>
              <Button type="submit" className="shadow-xs hover:opacity-90">{editingRecord ? "Save changes" : "Create Designation"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingRecord)} onOpenChange={(o) => !o && setViewingRecord(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          {viewingRecord && (
            <>
              <DialogHeader className="px-6 pt-6"><DialogTitle>Designation Overview</DialogTitle><DialogDescription>View complete designation details.</DialogDescription></DialogHeader>
              <div className="px-6 pb-6">
                {viewingGroups && <div className="space-y-6 py-4">
                  {viewingGroups.core.length > 0 && <section className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80"><Info className="size-3.5" /> Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {viewingGroups.core.map(({ key, value }) => (
                        <React.Fragment key={key}>
                          <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                          <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </section>}
                  {viewingGroups.dates.length > 0 && <section className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80"><Calendar className="size-3.5" /> Dates</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {viewingGroups.dates.map(({ key, value }) => (
                        <React.Fragment key={key}>
                          <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                          <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </section>}
                </div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Move Designation to Recycle Bin?"
        description="This designation will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin." confirmText="Move to Bin"
        onConfirm={async () => {
          if (!recordToDelete) return; setIsLoading(true);
          try { if (organizationApi.designations.remove) { await organizationApi.designations.remove(recordToDelete.id); await loadRecords(); } toast.success("Designation deleted successfully."); }
          catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to delete designation."); }
          finally { setIsLoading(false); setRecordToDelete(null); }
        }} />
    </div>
  );
}

export default DesignationPage;
