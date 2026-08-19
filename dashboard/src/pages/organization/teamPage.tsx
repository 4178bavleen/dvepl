import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnDef } from "@tanstack/react-table";
import * as z from "zod";
import {
  Plus, Search, Calendar, Info, Layers, User, UserPlus, UserMinus, Loader2,
} from "lucide-react";
import { GenericTable, sortableHeader } from "@/components/tables/genericTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import { organizationApi } from "@/services/organization";
import { ConfirmDialog } from "@/components/shared/confirmDialog";
import { canPerformPageAction } from "@/utils/pagePermissions";
import type { Team } from "@/types/erp";

const IGNORED_KEYS = new Set([
  "id", "companyId", "passwordHash", "tokenHash", "otpHash",
  "activationToken", "deletedAt", "company", "userPermissions",
  "createdAt", "updatedAt", "contacts",
]);

const OVERVIEW_HIDDEN = ["employees", "_count", "isActive"];

const formatFieldLabel = (key: string) =>
  key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).replace(/\sId$/, "");

const renderDisplayValue = (key: string, value: unknown, record?: Record<string, any>): React.ReactNode => {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "string" && key.endsWith("Id") && record) {
    const rel = record[key.slice(0, -2)];
    if (rel && typeof rel === "object") {
      const l = rel.name ?? rel.title ?? rel.code ?? rel.id;
      if (l) return String(l);
    }
  }
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) return new Date(value).toLocaleString();
  if (typeof value === "boolean") return value
    ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold">Yes</span>
    : <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20 px-2.5 py-0.5 text-xs font-semibold">No</span>;
  if (typeof value === "object") { const l = (value as any).name ?? (value as any).title ?? (value as any).code ?? (value as any).id; return l ? String(l) : "—"; }
  return String(value);
};

const groupRecordFields = (record: Record<string, any>, hiddenFields: string[] = []) => {
  const core: Array<{ key: string; value: any }> = [];
  const dates: Array<{ key: string; value: any }> = [];
  const relations: Array<{ key: string; value: any }> = [];
  Object.entries(record)
    .filter(([key]) => !IGNORED_KEYS.has(key) && !hiddenFields.includes(key))
    .forEach(([key, value]) => {
      if (key === "status" || key === "name" || key === "title") return;
      if (key.endsWith("Id")) { const rel = key.slice(0, -2); if (record[rel] !== undefined) return; }
      if (Array.isArray(value) || (typeof value === "object" && value !== null)) relations.push({ key, value });
      else if ((typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) || key.toLowerCase().includes("date") || key === "createdAt" || key === "updatedAt")
        dates.push({ key, value });
      else if (typeof value !== "object" || value === null) core.push({ key, value });
    });
  return { core, dates, relations };
};

const asInputValue = (v: unknown) => (v == null ? "" : String(v));

export function TeamPage() {
  const [searchParams] = useSearchParams();
  const globalStore = useERPStore();
  const [search, setSearch] = useState("");
  const [formValues, setFormValues] = useState<Record<string, unknown>>({ name: "", departmentId: "", isActive: true });
  const [editingRecord, setEditingRecord] = useState<Team | null>(null);
  const [viewingRecord, setViewingRecord] = useState<Team | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [records, setRecords] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<Team | null>(null);
  const [departmentOptions, setDepartmentOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Team member management
  const [teamEmployees, setTeamEmployees] = useState<any[]>([]);
  const [teamMemberDialogOpen, setTeamMemberDialogOpen] = useState(false);
  const [teamMemberSearch, setTeamMemberSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isTeamMemberSubmitting, setIsTeamMemberSubmitting] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const currentUser = globalStore.users?.find((u: any) => u.id === globalStore.currentUserId) as any;
  const canCreate = canPerformPageAction(currentUser?.actionPermissions, "teams", "create");
  const canEdit = canPerformPageAction(currentUser?.actionPermissions, "teams", "edit");
  const canDelete = canPerformPageAction(currentUser?.actionPermissions, "teams", "delete");

  const defaultFormValues = { name: "", departmentId: "", isActive: true };
  const zodSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    departmentId: z.string().min(1, "Select a department"),
    isActive: z.boolean().default(true),
  });
  const fields: Array<{ name: string; label: string; type: "text" | "select" | "checkbox"; placeholder?: string; required?: boolean }> = [
    { name: "departmentId", label: "Department", type: "select", required: true },
    { name: "name", label: "Team Name", type: "text", placeholder: "Bidding Specialists", required: true },
    { name: "isActive", label: "Active", type: "checkbox" },
  ];

  const columns: ColumnDef<Team>[] = [
    { accessorKey: "name", header: sortableHeader("Team Name") },
    { id: "department.name", accessorKey: "department.name", header: "Department" },
    {
      id: "_count.employees", accessorKey: "_count.employees", header: "Members",
      cell: ({ row }: { row: any }) => {
        const count = row.original?._count?.employees ?? 0;
        const employees = row.original?.employees ?? [];
        return (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {employees.slice(0, 3).map((emp: any) => {
                const initials = `${(emp.firstName ?? "").charAt(0)}${(emp.lastName ?? "").charAt(0)}`.toUpperCase();
                return (
                  <div key={emp.id} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-foreground"
                    title={`${emp.firstName ?? ""} ${emp.lastName ?? ""}`}>{initials || "?"}</div>
                );
              })}
              {count > 3 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-semibold text-muted-foreground" title={`${count - 3} more members`}>
                  +{count - 3}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-foreground">{count} {count === 1 ? "member" : "members"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive", header: "Status",
      cell: ({ getValue }: { getValue: () => unknown }) => {
        const active = Boolean(getValue());
        return (
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${active ? "bg-success/15 text-success" : "bg-muted-foreground/15 text-muted-foreground"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-success" : "bg-muted-foreground"}`} />
            {active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    try { setRecords(await organizationApi.teams.list()); }
    catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to load teams."); }
    finally { setIsLoading(false); }
  }, []);

  const loadDepartments = useCallback(async () => {
    try { setDepartmentOptions((await organizationApi.departments.list()).map((d: any) => ({ id: d.id, name: d.name }))); }
    catch (err) { console.warn("Unable to load departments:", err); }
  }, []);

  useEffect(() => { void loadRecords(); void loadDepartments(); }, [loadRecords, loadDepartments]);

  useEffect(() => {
    let hasPrefill = false;
    const prefilled: Record<string, unknown> = { ...defaultFormValues };
    fields.forEach((f) => { const v = searchParams.get(f.name); if (v !== null) { prefilled[f.name] = v; hasPrefill = true; } });
    if (hasPrefill) { setFormValues(prefilled); setIsFormOpen(true); }
  }, []);

  useEffect(() => {
    if (!viewingRecord) { setTeamEmployees([]); setSelectedEmployeeIds([]); }
  }, [viewingRecord]);

  const filteredRecords = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q)));
  }, [records, search]);

  const statsCards = useMemo(() => [{ label: "Total Teams", value: records.length }], [records]);

  const openCreate = () => { setEditingRecord(null); setFormValues(defaultFormValues); setErrors({}); setIsFormOpen(true); };
  const openEdit = (r: Team) => { setEditingRecord(r); setFormValues({ ...defaultFormValues, ...r }); setErrors({}); setIsFormOpen(true); };
  const setField = (name: string, value: unknown) => { setFormValues((c) => ({ ...c, [name]: value })); setErrors((c) => ({ ...c, [name]: "" })); };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = zodSchema.safeParse(formValues);
    if (!result.success) { const fe: Record<string, string> = {}; result.error.issues.forEach((i) => { const f = String(i.path[0] ?? "form"); if (!fe[f]) fe[f] = i.message; }); setErrors(fe); return; }
    setIsSubmitting(true);
    try {
      if (editingRecord && organizationApi.teams.update) await organizationApi.teams.update(editingRecord.id, result.data as Record<string, unknown>);
      else await organizationApi.teams.create(result.data as Record<string, unknown>);
      await loadRecords(); setIsFormOpen(false); toast.success("Team saved successfully.");
    } catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to save team."); }
    finally { setIsSubmitting(false); }
  };

  const viewingGroups = useMemo(() => viewingRecord ? groupRecordFields(viewingRecord as unknown as Record<string, any>, OVERVIEW_HIDDEN) : null, [viewingRecord]);

  const currentTeamMembers = useMemo(() => {
    if (!viewingRecord) return [];
    const val = (viewingRecord as any).employees;
    return Array.isArray(val) ? val : [];
  }, [viewingRecord]);

  const availableTeamEmployees = useMemo(() => {
    const memberIds = new Set(currentTeamMembers.map((m: any) => m?.employeeId ?? m?.employee?.id ?? m?.id));
    const q = teamMemberSearch.trim().toLowerCase();
    return teamEmployees.filter((emp) => {
      if (!emp?.id || memberIds.has(emp.id)) return false;
      if (!q) return true;
      const name = `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim();
      return [name, emp.email, emp.employeeCode].filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [teamEmployees, currentTeamMembers, teamMemberSearch]);

  const openTeamMemberDialog = async () => {
    if (!viewingRecord) return;
    setTeamMemberSearch(""); setSelectedEmployeeIds([]); setTeamMemberDialogOpen(true);
    try {
      const available = await organizationApi.teams.availableMembers(viewingRecord.id);
      setTeamEmployees(Array.isArray(available) ? available : []);
    } catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to load available members."); setTeamEmployees([]); }
  };

  const toggleEmployeeSelection = (id: string) => setSelectedEmployeeIds((c) => c.includes(id) ? c.filter((i) => i !== id) : [...c, id]);

  const submitTeamMembers = async () => {
    if (!viewingRecord || selectedEmployeeIds.length === 0) return;
    setIsTeamMemberSubmitting(true);
    try {
      await organizationApi.teams.addMembers(viewingRecord.id, selectedEmployeeIds);
      setViewingRecord((c) => {
        if (!c) return c;
        const existing = Array.isArray((c as any).employees) ? (c as any).employees : [];
        const existingIds = new Set(existing.map((m: any) => m?.employeeId ?? m?.id));
        const added = teamEmployees.filter((e) => selectedEmployeeIds.includes(e.id) && !existingIds.has(e.id));
        return { ...c, employees: [...existing, ...added] } as any;
      });
      const available = await organizationApi.teams.availableMembers(viewingRecord.id);
      setTeamEmployees(Array.isArray(available) ? available : []);
      setSelectedEmployeeIds([]); setTeamMemberDialogOpen(false);
      toast.success(selectedEmployeeIds.length === 1 ? "Employee added to team." : `${selectedEmployeeIds.length} employees added to team.`);
    } catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to add employees to team."); }
    finally { setIsTeamMemberSubmitting(false); }
  };

  const removeTeamMember = async (empId: string) => {
    if (!viewingRecord) return;
    setRemoveMemberId(empId);
    try {
      await organizationApi.teams.removeMember(viewingRecord.id, empId);
      setViewingRecord((c) => {
        if (!c) return c;
        const members = Array.isArray((c as any).employees) ? (c as any).employees : [];
        return { ...c, employees: members.filter((m: any) => (m?.employeeId ?? m?.id) !== empId) } as any;
      });
      const available = await organizationApi.teams.availableMembers(viewingRecord.id);
      setTeamEmployees(Array.isArray(available) ? available : []);
      toast.success("Employee removed from team.");
    } catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to remove employee from team."); }
    finally { setRemoveMemberId(null); }
  };

  const getEmpName = (e: any) => {
    if (!e) return "Unknown";
    if (e.firstName) return `${e.firstName} ${e.lastName ?? ""}`.trim();
    return e.name ?? e.title ?? e.email ?? e.employeeCode ?? e.id;
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
        <span className="text-foreground">Dashboard</span><span className="mx-2">/</span><span className="text-foreground">Teams</span>
      </nav>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage teams.</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && <Button onClick={openCreate} className="gap-2"><Plus className="size-4" /> Add Team</Button>}
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-200">
        {statsCards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-all duration-200">
            <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{c.label}</p>
            <p className="mt-2.5 text-2xl font-extrabold tracking-tight text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search teams..." className="pl-9" />
      </div>
      <GenericTable<any> columns={columns as any} data={filteredRecords} onView={setViewingRecord} onEdit={canEdit ? openEdit : undefined}
        onDelete={!canDelete ? undefined : (r) => { setRecordToDelete(r); setDeleteConfirmOpen(true); }} isLoading={isLoading} freezeActions={true} storageKey="teams" />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{editingRecord ? "Update Entry" : "New Entry"}</p>
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{editingRecord ? "Edit Team" : "Add Team"}</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Complete the details below to update the system logs.</DialogDescription>
          </DialogHeader>
          <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {field.label}{field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {field.type === "select" ? (
                    <Select value={asInputValue(formValues[field.name])} onValueChange={(v) => setField(field.name, v)}>
                      <SelectTrigger id={field.name} className="w-full bg-card hover:bg-card/85 transition-colors border-border/80 focus:ring-1 focus:ring-primary">
                        <SelectValue placeholder={`Select ${field.label}`}>
                          {departmentOptions.find((o) => o.id === asInputValue(formValues[field.name]))?.name ?? undefined}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {departmentOptions.map((o) => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : field.type === "checkbox" ? (
                    <div className="flex h-10 items-center gap-2.5 px-3 rounded-lg border border-border/80 bg-card hover:bg-card/85 transition-colors">
                      <Checkbox id={field.name} checked={Boolean(formValues[field.name])} onCheckedChange={(c) => setField(field.name, Boolean(c))} className="border-muted-foreground/50 data-[state=checked]:bg-primary" />
                      <Label htmlFor={field.name} className="text-sm font-medium text-foreground cursor-pointer select-none">Active / Enabled</Label>
                    </div>
                  ) : (
                    <Input id={field.name} type={field.type} value={asInputValue(formValues[field.name])} placeholder={field.placeholder}
                      onChange={(e) => setField(field.name, e.target.value)} className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary" />
                  )}
                  {errors[field.name] && <p className="text-xs text-destructive font-medium mt-0.5">{errors[field.name]}</p>}
                </div>
              ))}
            </div>
            <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-end gap-3 sticky bottom-0 bg-background">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="hover:bg-muted/80">Cancel</Button>
              <Button type="submit" className="shadow-xs hover:opacity-90">{editingRecord ? "Save changes" : "Create Team"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(viewingRecord)} onOpenChange={(o) => !o && setViewingRecord(null)}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[85vh] overflow-y-auto p-0">
          {viewingRecord && (
            <>
              <DialogHeader className="px-6 pt-6"><DialogTitle>Team Overview</DialogTitle><DialogDescription>View complete team details.</DialogDescription></DialogHeader>
              <div className="px-6 pb-6">
                {viewingGroups && <div className="space-y-6 py-4">
                  {viewingGroups.core.length > 0 && <section className="space-y-2">
                    <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80"><Info className="size-3.5" /> Details</h3>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                      {viewingGroups.core.map(({ key, value }) => (
                        <React.Fragment key={key}>
                          <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                          <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value, viewingRecord as Record<string, any>)}</dd>
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
                          <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value, viewingRecord as Record<string, any>)}</dd>
                        </React.Fragment>
                      ))}
                    </dl>
                  </section>}

                  {/* Team Members */}
                  <section className="space-y-3 rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80"><User className="size-3.5" /> Team Members</h3>
                        <p className="mt-1 text-xs text-muted-foreground">Add or remove employees assigned to this team.</p>
                      </div>
                      <Button type="button" size="sm" className="gap-1.5" onClick={() => void openTeamMemberDialog()}>
                        <UserPlus className="size-4" /> Add members
                      </Button>
                    </div>
                    {currentTeamMembers.length === 0 ? (
                      <div className="rounded-lg border border-dashed p-5 text-center text-sm text-muted-foreground">No employees are assigned to this team yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {currentTeamMembers.map((member: any) => {
                          const emp = member?.employee ?? member;
                          const empId = member?.employeeId ?? emp?.id;
                          return (
                            <div key={empId} className="flex items-center justify-between gap-3 rounded-lg border bg-background p-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold">{getEmpName(emp)}</p>
                                {emp?.email && <p className="truncate text-xs text-muted-foreground">{emp.email}</p>}
                              </div>
                              <Button type="button" variant="ghost" size="sm" className="shrink-0 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={removeMemberId === empId} onClick={() => void removeTeamMember(empId)}>
                                {removeMemberId === empId ? <Loader2 className="size-4 animate-spin" /> : <UserMinus className="size-4" />} Remove
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={teamMemberDialogOpen} onOpenChange={(o) => { setTeamMemberDialogOpen(o); if (!o) { setTeamMemberSearch(""); setSelectedEmployeeIds([]); } }}>
        <DialogContent className="w-[95vw] max-w-lg p-0">
          <DialogHeader className="border-b p-6">
            <DialogTitle>Add Team Members</DialogTitle>
            <DialogDescription>Select one or more employees to add to this team.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <Input value={teamMemberSearch} onChange={(e) => setTeamMemberSearch(e.target.value)} placeholder="Search employees..." autoFocus />
            <div className="max-h-[360px] overflow-y-auto rounded-lg border">
              {availableTeamEmployees.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">{teamMemberSearch ? "No matching available employees." : "No available employees to add."}</div>
              ) : (
                <div className="divide-y">
                  {availableTeamEmployees.map((emp) => {
                    const selected = selectedEmployeeIds.includes(emp.id);
                    return (
                      <button key={emp.id} type="button" onClick={() => toggleEmployeeSelection(emp.id)}
                        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50">
                        <Checkbox checked={selected} onCheckedChange={() => toggleEmployeeSelection(emp.id)} onClick={(e) => e.stopPropagation()} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">{getEmpName(emp)}</p>
                          {emp.email && <p className="truncate text-xs text-muted-foreground">{emp.email}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {selectedEmployeeIds.length > 0 && <p className="text-xs font-medium text-muted-foreground">{selectedEmployeeIds.length} employee{selectedEmployeeIds.length === 1 ? "" : "s"} selected</p>}
          </div>
          <div className="flex items-center justify-end gap-3 border-t bg-muted/30 p-4">
            <Button type="button" variant="ghost" onClick={() => setTeamMemberDialogOpen(false)} disabled={isTeamMemberSubmitting}>Cancel</Button>
            <Button type="button" onClick={() => void submitTeamMembers()} disabled={selectedEmployeeIds.length === 0 || isTeamMemberSubmitting} className="gap-2">
              {isTeamMemberSubmitting && <Loader2 className="size-4 animate-spin" />} Add selected
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen} title="Move Team to Recycle Bin?"
        description="This team will be moved to the Recycle Bin. You can restore it anytime from Settings → Recycle Bin." confirmText="Move to Bin"
        onConfirm={async () => {
          if (!recordToDelete) return; setIsLoading(true);
          try { if (organizationApi.teams.remove) { await organizationApi.teams.remove(recordToDelete.id); await loadRecords(); } toast.success("Team deleted successfully."); }
          catch (e: any) { toast.error(e.response?.data?.message ?? "Unable to delete team."); }
          finally { setIsLoading(false); setRecordToDelete(null); }
        }} />
    </div>
  );
}

export default TeamPage;
