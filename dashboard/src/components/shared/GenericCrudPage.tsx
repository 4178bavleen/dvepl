<<<<<<< HEAD
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ColumnDef } from '@tanstack/react-table';
import type { ZodType } from 'zod';
import { Plus, Search, Calendar, FileText, Info, Paperclip, User, Layers, CheckSquare, Loader2 } from 'lucide-react';
import { GenericTable } from '@/components/tables/GenericTable';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useERPStore } from '@/store/erpStore';
import { toast } from 'react-hot-toast';
import type { ResourceApi } from '@/services/organization';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select' | 'checkbox';

interface CrudField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface GenericCrudPageProps<TRecord extends { id: string } = { id: string }> {
  tableName: string;
  moduleName: string;
  pluralName: string;
  columns: ColumnDef<TRecord>[];
  fields: CrudField[];
  defaultFormValues: Record<string, unknown>;
  zodSchema: ZodType;
  breadcrumbs?: BreadcrumbItem[];
  searchPlaceholder?: string;
  statsCards?: (data: TRecord[]) => Array<{ label: string; value: React.ReactNode; change?: string; trend?: 'up' | 'down' }>;
  api?: ResourceApi<any>;
  selectOptions?: Record<string, () => Promise<Array<{ id: string; name?: string; title?: string; code?: string }>>>;
  readOnly?: boolean;
}

const asInputValue = (value: unknown) => value == null ? '' : String(value);

// Stable fallback — must NOT be inline `?? []` inside a Zustand selector
// because a new array literal creates a new reference every render,
// causing useSyncExternalStore to loop infinitely.
const EMPTY_ARRAY: never[] = [];

// Fields that must never render in a generic view/detail sheet, regardless
// of which model the record came from — schema-wide secrets & internal
// bookkeeping columns (see users.passwordHash, refresh_tokens/otp_requests/
// password_resets *Hash columns, customer_portal_users.activationToken).
const IGNORED_KEYS = new Set([
  'id',
  'companyId',
  'passwordHash',
  'tokenHash',
  'otpHash',
  'activationToken',
  'deletedAt',
  'company',
  'userPermissions',
  'createdAt',
  'updatedAt',
]);

// Maps a foreign-key field name (as it appears on any Prisma model in
// schema.prisma) to the Zustand store slice that holds the referenced
// records, plus how to turn one of those records into a display label.
// Keeping this table-driven (rather than an if/else chain per field) means
// new relations added to the schema only need one line here.
type RelationResolver = { storeKey: string; label: (record: any) => string | undefined };

const personLabel = (record: any) => record ? `${record.firstName ?? ''} ${record.lastName ?? ''}`.trim() || record.name : undefined;
const nameLabel = (record: any) => record?.name ?? record?.title ?? record?.code ?? record?.id;

const FK_RELATION_MAP: Record<string, RelationResolver> = {
  // Organization
  branchId: { storeKey: 'branches', label: nameLabel },
  departmentId: { storeKey: 'departments', label: nameLabel },
  teamId: { storeKey: 'teams', label: nameLabel },
  designationId: { storeKey: 'designations', label: (r) => r?.title },
  costCenterId: { storeKey: 'costCenters', label: nameLabel },
  reportsToId: { storeKey: 'employees', label: personLabel },
  // Auth / PRBAC
  userId: { storeKey: 'users', label: (r) => r?.name },
  roleId: { storeKey: 'roles', label: nameLabel },
  employeeId: { storeKey: 'employees', label: personLabel },
  createdById: { storeKey: 'employees', label: personLabel },
  assignedToId: { storeKey: 'users', label: (r) => r?.name },
  approvedById: { storeKey: 'users', label: (r) => r?.name },
  askedById: { storeKey: 'users', label: (r) => r?.name },
  answeredById: { storeKey: 'users', label: (r) => r?.name },
  approverId: { storeKey: 'users', label: (r) => r?.name },
  // Tender / Govt hierarchy
  governmentDepartmentId: { storeKey: 'governmentDepartments', label: nameLabel },
  sectionId: { storeKey: 'sections', label: nameLabel },
  divisionId: { storeKey: 'divisions', label: nameLabel },
  subDivisionId: { storeKey: 'subDivisions', label: nameLabel },
  tenderRequestId: { storeKey: 'tenderRequests', label: (r) => r?.title },
  tenderId: { storeKey: 'tenders', label: (r) => r?.title },
  // CRM / Sales
  customerId: { storeKey: 'customers', label: nameLabel },
  quotationId: { storeKey: 'quotations', label: (r) => r?.quotationNo },
  salesOrderId: { storeKey: 'salesOrders', label: (r) => r?.orderNo ?? r?.soNumber },
  portalUserId: { storeKey: 'customerPortalUsers', label: (r) => r?.name },
};

// Every enum status/action value defined across schema.prisma, mapped to a
// badge color. Falls back to a neutral badge for anything not listed here
// (e.g. a future enum value) instead of silently going gray-only.
const STATUS_COLORS: Record<string, string> = {
  // TenderStatus
  DRAFT: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  OPEN: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  ASSIGNED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  IN_PROGRESS: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  SUBMITTED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  WON: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  LOST: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  COMPLETED: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
  CANCELLED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  // TenderRequestStatus
  NEW: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  CONTACTED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  QUALIFIED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  TENDER: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  QUOTATION: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  // QuotationStatus
  PENDING_APPROVAL: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  APPROVED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  SENT: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  ACCEPTED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  REJECTED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  NEGOTIATING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  EXPIRED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  REVISED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  // ApprovalStatus / LeaveStatus
  PENDING: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  // SalesOrderStatus
  ACTIVE: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  ON_HOLD: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  // EmployeeStatus
  ON_LEAVE: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  SUSPENDED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  RESIGNED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  TERMINATED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  // AttendanceStatus
  PRESENT: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  ABSENT: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  HALF_DAY: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  HOLIDAY: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  // ClarificationStatus
  ANSWERED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  CLOSED: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
  // ReferenceCodeAction
  GENERATED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  UPDATED: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  DELETED: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  REGENERATED: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  MISSING: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
};

const getStatusBadge = (status: string) => {
  const s = String(status).toUpperCase();
  const colorClass = STATUS_COLORS[s] ?? 'bg-muted text-muted-foreground border-border';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors ${colorClass}`}>
      {status}
    </span>
  );
};

const groupRecordFields = (record: Record<string, any>) => {
  const core: Array<{ key: string; value: any }> = [];
  const dates: Array<{ key: string; value: any }> = [];
  const relations: Array<{ key: string; value: any }> = [];

  Object.entries(record)
    .filter(([key]) => !IGNORED_KEYS.has(key))
    .forEach(([key, value]) => {
      if (key === 'status' || key === 'name' || key === 'title') return;

      // Skip foreign key IDs if the actual relationship object is present in the record
      if (key.endsWith('Id')) {
        const relationKey = key.slice(0, -2);
        if (record[relationKey] !== undefined) return;
      }

      if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
        relations.push({ key, value });
      } else if (
        (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) ||
        key.toLowerCase().includes('date') ||
        key === 'createdAt' ||
        key === 'updatedAt'
      ) {
        dates.push({ key, value });
      } else {
        core.push({ key, value });
      }
    });

  return { core, dates, relations };
};

const formatFieldLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .replace(/\sId$/, '');

const renderDisplayValue = (
  key: string,
  value: unknown,
  record?: Record<string, any>,
  optionValues?: Record<string, any>,
  fields?: Array<{ name: string; options?: Array<{ value: string; label: string }> }>
): React.ReactNode => {
  if (value === null || value === undefined || value === '') return '—';

  // 1. Resolve foreign key UUIDs to names dynamically using relation objects
  //    that were already eager-loaded onto the record (e.g. `customer` next
  //    to `customerId`).
  if (typeof value === 'string' && key.endsWith('Id') && record) {
    const relationKey = key.slice(0, -2);
    const relationObj = record[relationKey];
    if (relationObj && typeof relationObj === 'object') {
      const label = relationObj.firstName
        ? `${relationObj.firstName} ${relationObj.lastName ?? ''}`.trim()
        : (relationObj.name ?? relationObj.title ?? relationObj.fileName ?? relationObj.code ?? relationObj.id);
      if (label) return String(label);
    }
  }

  // 2. Resolve loaded select option labels (API level)
  if (optionValues && optionValues[key]) {
    const matched = (optionValues[key] as Array<{ value: string; label: string }> | undefined)?.find((opt: any) => opt.value === value);
    if (matched) return matched.label;
  }

  // 3. Resolve static field configuration options
  if (fields) {
    const fieldConfig = fields.find((f) => f.name === key);
    if (fieldConfig && fieldConfig.options) {
      const matched = fieldConfig.options.find((opt) => opt.value === value);
      if (matched) return matched.label;
    }
  }

  // 4. Resolve IDs globally using Zustand store lists, driven by
  //    FK_RELATION_MAP so every relation defined in schema.prisma is covered
  //    (not just the handful the view happens to embed eagerly).
  if (typeof value === 'string') {
    const resolver = FK_RELATION_MAP[key];
    if (resolver) {
      const store = useERPStore.getState() as Record<string, any>;
      const list = store[resolver.storeKey];
      if (Array.isArray(list)) {
        const match = list.find((item: any) => item.id === value);
        if (match) {
          const label = resolver.label(match);
          if (label) return label;
        }
      }
    }
  }

  // Handle Arrays (e.g. attachments, revisions, etc.)
  if (Array.isArray(value)) {
    if (value.length === 0) return '—';
    if (typeof value[0] === 'object' && value[0] !== null) {
      return (
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {value.map((item: any, i) => {
            const label = item.name ?? item.title ?? item.fileName ?? item.code ?? item.quotationNo ?? item.orderNo ?? item.soNumber ?? `Item #${i + 1}`;
            return (
              <span key={i} className="inline-flex items-center gap-1.5 rounded-lg bg-muted border hover:bg-muted/80 transition-all px-2.5 py-1 text-xs font-semibold text-foreground">
                <Paperclip className="size-3 text-muted-foreground" />
                {label}
              </span>
            );
          })}
        </div>
      );
    }
    return value.join(', ');
  }

  // Handle Object Relations (e.g. customer, createdBy)
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (obj.firstName) {
      return `${obj.firstName} ${obj.lastName ?? ''}`.trim();
    }
    const label = obj.name ?? obj.title ?? obj.code ?? obj.quotationNo ?? obj.orderNo ?? obj.soNumber ?? obj.id;
    return label ? String(label) : '—';
  }

  // Handle known status/action enums (TenderStatus, QuotationStatus,
  // ApprovalStatus, AttendanceStatus, ClarificationStatus, etc.)
  if (typeof value === 'string' && (key === 'status' || key === 'action' || key === 'actionType') && STATUS_COLORS[value.toUpperCase()]) {
    return getStatusBadge(value);
  }

  // Handle ISO Date formats
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value).toLocaleString();
  }

  // Handle Booleans
  if (typeof value === 'boolean') {
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

  return String(value);
};

const getCombinedOptions = (
  fieldName: string,
  staticOptions?: Array<{ value: string; label: string }>,
  optionValues?: Record<string, any>
) => {
  const loaded = optionValues?.[fieldName] ?? [];
  const statics = staticOptions ?? [];
  
  // Resolve from store globally if available
  const storeOptions: Array<{ value: string; label: string }> = [];
  const resolver = FK_RELATION_MAP[fieldName];
  if (resolver) {
    const store = useERPStore.getState() as Record<string, any>;
    const list = store[resolver.storeKey];
    if (Array.isArray(list)) {
      list.forEach((item: any) => {
        const label = resolver.label(item);
        if (label && item.id) {
          storeOptions.push({ value: item.id, label });
        }
      });
    }
  }

  const combined = [...loaded, ...storeOptions, ...statics];
  
  return combined.filter(
    (opt, index, self) => self.findIndex((o) => o.value === opt.value) === index
  );
};

export function GenericCrudPage<TRecord extends { id: string }>({
  tableName,
  moduleName,
  pluralName,
  columns,
  fields,
  defaultFormValues,
  zodSchema,
  breadcrumbs = [],
  searchPlaceholder = `Search ${pluralName.toLowerCase()}...`,
  statsCards,
  api,
  selectOptions,
  readOnly = false,
}: GenericCrudPageProps<TRecord>) {
  const [searchParams] = useSearchParams();
  const localRecords = useERPStore((state) => (state as unknown as Record<string, unknown>)[tableName] as TRecord[] ?? EMPTY_ARRAY);
  const addRecord = useERPStore((state) => state.addRecord);
  const updateRecord = useERPStore((state) => state.updateRecord);
  const deleteRecord = useERPStore((state) => state.deleteRecord);
  const [search, setSearch] = useState('');
  const [formValues, setFormValues] = useState<Record<string, unknown>>(defaultFormValues);
  const [editingRecord, setEditingRecord] = useState<TRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remoteRecords, setRemoteRecords] = useState<TRecord[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(api));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optionValues, setOptionValues] = useState<Record<string, CrudField['options']>>({});
  const records = api ? remoteRecords : localRecords;

  const loadRecords = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try { setRemoteRecords(await api.list()); }
    catch (error: any) { toast.error(error.response?.data?.message ?? `Unable to load ${pluralName.toLowerCase()}.`); }
    finally { setIsLoading(false); }
  }, [api, pluralName]);

  useEffect(() => { void loadRecords(); }, [loadRecords]);

  // Stabilise the selectOptions reference — the prop is an object literal that
  // gets a new identity on every render, which would cause an infinite loop.
  const selectOptionsRef = React.useRef(selectOptions);

  useEffect(() => {
    const opts = selectOptionsRef.current;
    if (!opts) return;
    Object.entries(opts).forEach(([field, load]) => {
      load()
        .then((items) => {
          setOptionValues((current) => ({
            ...current,
            [field]: items.map((item: any) => {
              const label = item.firstName
                ? `${item.firstName} ${item.lastName ?? ''}`.trim()
                : (item.name ?? item.title ?? item.code ?? item.id);
              return { value: item.id, label };
            })
          }));
        })
        .catch((err) => {
          console.warn(`Unable to load options for field ${field}:`, err);
        });
    });
  }, []); // intentionally empty — selectOptionsRef.current is stable

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on component mount to capture URL query params


  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return records;
    return records.filter((record) => Object.values(record).some((value) =>
      String(value ?? '').toLowerCase().includes(query),
    ));
  }, [records, search]);

  const openCreate = () => {
    setEditingRecord(null);
    setFormValues(defaultFormValues);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (record: TRecord) => {
    setEditingRecord(record);
    setFormValues({ ...defaultFormValues, ...record });
    setErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = zodSchema.safeParse(formValues);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? 'form');
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      if (api) {
        if (editingRecord && api.update) await api.update(editingRecord.id, result.data as Record<string, unknown>);
        else await api.create(result.data as Record<string, unknown>);
        await loadRecords();
      } else if (editingRecord) updateRecord(tableName, editingRecord.id, result.data);
      else addRecord(tableName, result.data);
      setIsFormOpen(false);
      toast.success(`${moduleName} saved successfully.`);
    } catch (error: any) {
      toast.error(error.response?.data?.message ?? `Unable to save ${moduleName.toLowerCase()}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const setField = (name: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const cards = statsCards?.(records) ?? [];

  const processedColumns = useMemo(() => {
    return columns.map((col) => {
      const accessorKey = (col as any).accessorKey;
      if (typeof accessorKey === 'string' && FK_RELATION_MAP[accessorKey] && !(col as any).cell) {
        return {
          ...col,
          cell: ({ getValue, row }: any) => {
            const val = getValue();
            return renderDisplayValue(accessorKey, val, row.original, optionValues, fields);
          },
        };
      }
      return col;
    });
  }, [columns, optionValues, fields]);

  const viewingGroups = useMemo(
    () => (viewingRecord ? groupRecordFields(viewingRecord as unknown as Record<string, any>) : null),
    [viewingRecord]
  );

  if (isLoading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] w-full gap-3">
        <Loader2 className="animate-spin text-primary size-10" />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 animate-pulse">Loading {pluralName}...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && <span className="mx-2">/</span>}
              <span className={index === breadcrumbs.length - 1 ? 'text-foreground' : undefined}>{item.label}</span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{pluralName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage {pluralName.toLowerCase()}.</p>
        </div>
        {!readOnly && <Button onClick={openCreate} className="gap-2">
          <Plus className="size-4" /> Add {moduleName}
        </Button>}
      </div>

      {cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              {card.change && <p className="mt-1 text-xs text-muted-foreground">{card.change}</p>}
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder} className="pl-9" />
      </div>

      <GenericTable
        columns={processedColumns}
        data={filteredRecords}
        onView={setViewingRecord}
        onEdit={!readOnly && (!api || api.update) ? openEdit : undefined}
        onDelete={api && !api.remove ? undefined : async (record) => {
          if (!window.confirm(`Delete this ${moduleName.toLowerCase()}?`)) return;
          setIsLoading(true);
          try {
            if (api?.remove) { await api.remove(record.id); await loadRecords(); }
            else deleteRecord(tableName, record.id);
            toast.success(`${moduleName} deleted successfully.`);
          } catch (error: any) { 
            toast.error(error.response?.data?.message ?? `Unable to delete ${moduleName.toLowerCase()}.`); 
          } finally {
            setIsLoading(false);
          }
        }}
        isLoading={isLoading}
      />

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent side="right" className="h-full w-full max-w-md p-0 flex flex-col gap-0 border-l shadow-2xl sm:max-w-lg">
          <div className="bg-gradient-to-br from-primary/5 via-background to-transparent border-b p-6 pt-8 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{editingRecord ? 'Update Entry' : 'New Entry'}</p>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{editingRecord ? `Edit ${moduleName}` : `Add ${moduleName}`}</h2>
            <p className="text-xs text-muted-foreground">Complete the details below to update the system logs.</p>
          </div>
          <form onSubmit={submitForm} className="flex-1 flex flex-col justify-between overflow-y-auto">
            <div className="p-6 space-y-6">
              {fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <Label htmlFor={field.name} className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {field.label}{field.required && <span className="text-destructive"> *</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea id={field.name} value={asInputValue(formValues[field.name])} placeholder={field.placeholder} onChange={(event) => setField(field.name, event.target.value)} className="min-h-[120px] bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary" />
                  ) : field.type === 'select' ? (
                    <Select value={asInputValue(formValues[field.name])} onValueChange={(value) => setField(field.name, value)}>
                      <SelectTrigger id={field.name} className="w-full bg-card hover:bg-card/85 transition-colors border-border/80 focus:ring-1 focus:ring-primary"><SelectValue placeholder={`Select ${field.label}`} /></SelectTrigger>
                      <SelectContent>
                        {getCombinedOptions(field.name, field.options, optionValues).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : field.type === 'checkbox' ? (
                    <div className="flex h-10 items-center gap-2.5 px-3 rounded-lg border border-border/80 bg-card hover:bg-card/85 transition-colors">
                      <Checkbox id={field.name} checked={Boolean(formValues[field.name])} onCheckedChange={(checked) => setField(field.name, Boolean(checked))} className="border-muted-foreground/50 data-[state=checked]:bg-primary" />
                      <Label htmlFor={field.name} className="text-sm font-medium text-foreground cursor-pointer select-none">Active / Enabled</Label>
                    </div>
                  ) : (
                    <Input id={field.name} type={field.type} value={asInputValue(formValues[field.name])} placeholder={field.placeholder} onChange={(event) => setField(field.name, event.target.value)} className="bg-card hover:bg-card/85 transition-colors border-border/80 focus-visible:ring-1 focus-visible:ring-primary" />
                  )}
                  {errors[field.name] && <p className="text-xs text-destructive font-medium mt-0.5">{errors[field.name]}</p>}
                </div>
              ))}
            </div>
            <div className="bg-muted/30 border-t p-4 px-6 flex items-center justify-end gap-3 sticky bottom-0 bg-background">
              <Button type="button" variant="ghost" onClick={() => setIsFormOpen(false)} className="hover:bg-muted/80">Cancel</Button>
              <Button type="submit" className="shadow-xs hover:opacity-90">{editingRecord ? 'Save changes' : `Create ${moduleName}`}</Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>



      <Sheet open={Boolean(viewingRecord)} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <SheetContent side="right" className="max-w-lg p-6 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{moduleName} details</SheetTitle>
          </SheetHeader>

          {viewingRecord && viewingGroups && (
            <div className="space-y-6 py-4">
              {'status' in (viewingRecord as any) && (
                <div>{getStatusBadge(String((viewingRecord as any).status))}</div>
              )}

              {viewingGroups.core.length > 0 && (
                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Info className="size-3.5" /> Details
                  </h3>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    {viewingGroups.core.map(({ key, value }) => (
                      <React.Fragment key={key}>
                        <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                        <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value, viewingRecord as Record<string, any>, optionValues, fields)}</dd>
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
                        <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                        <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value, viewingRecord as Record<string, any>, optionValues, fields)}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </section>
              )}

              {viewingGroups.relations.length > 0 && (
                <section className="space-y-2">
                  <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
                    <Layers className="size-3.5" /> Related records
                  </h3>
                  <dl className="grid grid-cols-1 gap-y-3 text-sm">
                    {viewingGroups.relations.map(({ key, value }) => (
                      <React.Fragment key={key}>
                        <dt className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider mt-1">{formatFieldLabel(key)}</dt>
                        <dd className="break-words text-foreground font-medium">{renderDisplayValue(key, value, viewingRecord as Record<string, any>, optionValues, fields)}</dd>
                      </React.Fragment>
                    ))}
                  </dl>
                </section>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
=======
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ZodType } from "zod";
import { Plus, Search } from "lucide-react";
import { GenericTable } from "@/components/tables/GenericTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from "@/components/ui/textarea";
import { useERPStore } from "@/store/erpStore";
import { toast } from "react-hot-toast";
import type { ResourceApi } from "@/services/organization";

type FieldType =
  | "text"
  | "number"
  | "date"
  | "textarea"
  | "select"
  | "checkbox";

interface CrudField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ label: string; value: string }>;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface GenericCrudPageProps<
  TRecord extends { id: string } = { id: string },
> {
  tableName: string;
  moduleName: string;
  pluralName: string;
  columns: ColumnDef<TRecord>[];
  fields: CrudField[];
  defaultFormValues: Record<string, unknown>;
  zodSchema: ZodType;
  breadcrumbs?: BreadcrumbItem[];
  searchPlaceholder?: string;
  statsCards?: (
    data: TRecord[],
  ) => Array<{
    label: string;
    value: React.ReactNode;
    change?: string;
    trend?: "up" | "down";
  }>;
  api?: ResourceApi<any>;
  selectOptions?: Record<
    string,
    () => Promise<
      Array<{ id: string; name?: string; title?: string; code?: string }>
    >
  >;
  readOnly?: boolean;
}

const asInputValue = (value: unknown) => (value == null ? "" : String(value));

export function GenericCrudPage<TRecord extends { id: string }>({
  tableName,
  moduleName,
  pluralName,
  columns,
  fields,
  defaultFormValues,
  zodSchema,
  breadcrumbs = [],
  searchPlaceholder = `Search ${pluralName.toLowerCase()}...`,
  statsCards,
  api,
  selectOptions,
  readOnly = false,
}: GenericCrudPageProps<TRecord>) {
  const localRecords = useERPStore(
    (state) =>
      ((state as unknown as Record<string, unknown>)[tableName] as TRecord[]) ??
      [],
  );
  const addRecord = useERPStore((state) => state.addRecord);
  const updateRecord = useERPStore((state) => state.updateRecord);
  const deleteRecord = useERPStore((state) => state.deleteRecord);
  const [search, setSearch] = useState("");
  const [formValues, setFormValues] =
    useState<Record<string, unknown>>(defaultFormValues);
  const [editingRecord, setEditingRecord] = useState<TRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<TRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [remoteRecords, setRemoteRecords] = useState<TRecord[]>([]);
  const [isLoading, setIsLoading] = useState(Boolean(api));
  const [optionValues, setOptionValues] = useState<
    Record<string, CrudField["options"]>
  >({});
  const records = api ? remoteRecords : localRecords;

  const loadRecords = useCallback(async () => {
    if (!api) return;
    setIsLoading(true);
    try {
      setRemoteRecords(await api.list());
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          `Unable to load ${pluralName.toLowerCase()}.`,
      );
    } finally {
      setIsLoading(false);
    }
  }, [api, pluralName]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  useEffect(() => {
    if (!selectOptions) return;
    void Promise.all(
      Object.entries(selectOptions).map(async ([field, load]) => {
        const items = await load();

        console.log("==========");
        console.log("FIELD:", field);
        console.log("RAW ITEMS:", items);

        const options = items.map((item) => ({
          value: item.id,
          label: item.name ?? item.title ?? item.code ?? item.id,
        }));

        console.log("OPTIONS:", options);

        setOptionValues((current) => ({
          ...current,
          [field]: options,
        }));
        setOptionValues((current) => ({
          ...current,
          [field]: items.map((item) => ({
            value: item.id,
            label: item.name ?? item.title ?? item.code ?? item.id,
          })),
        }));
      }),
    ).catch(() => toast.error("Unable to load form options."));
  }, [selectOptions]);

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

  const openCreate = () => {
    setEditingRecord(null);
    setFormValues(defaultFormValues);
    setErrors({});
    setIsFormOpen(true);
  };

  const openEdit = (record: TRecord) => {
    setEditingRecord(record);
    setFormValues({ ...defaultFormValues, ...record });
    setErrors({});
    setIsFormOpen(true);
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

    try {
      if (api) {
        if (editingRecord && api.update)
          await api.update(
            editingRecord.id,
            result.data as Record<string, unknown>,
          );
        else await api.create(result.data as Record<string, unknown>);
        await loadRecords();
      } else if (editingRecord)
        updateRecord(tableName, editingRecord.id, result.data);
      else addRecord(tableName, result.data);
      setIsFormOpen(false);
      toast.success(`${moduleName} saved successfully.`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ??
          `Unable to save ${moduleName.toLowerCase()}.`,
      );
    }
  };

  const setField = (name: string, value: unknown) => {
    setFormValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const cards = statsCards?.(records) ?? [];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={`${item.label}-${index}`}>
              {index > 0 && <span className="mx-2">/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "text-foreground"
                    : undefined
                }
              >
                {item.label}
              </span>
            </React.Fragment>
          ))}
        </nav>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {pluralName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage {pluralName.toLowerCase()}.
          </p>
        </div>
        {!readOnly && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="size-4" /> Add {moduleName}
          </Button>
        )}
      </div>

      {cards.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border bg-card p-4 shadow-sm"
            >
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold">{card.value}</p>
              {card.change && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {card.change}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      <GenericTable
        columns={columns}
        data={filteredRecords}
        onView={setViewingRecord}
        onEdit={!readOnly && (!api || api.update) ? openEdit : undefined}
        onDelete={
          api && !api.remove
            ? undefined
            : async (record) => {
                if (!window.confirm(`Delete this ${moduleName.toLowerCase()}?`))
                  return;
                try {
                  if (api?.remove) {
                    await api.remove(record.id);
                    await loadRecords();
                  } else deleteRecord(tableName, record.id);
                  toast.success(`${moduleName} deleted successfully.`);
                } catch (error: any) {
                  toast.error(
                    error.response?.data?.message ??
                      `Unable to delete ${moduleName.toLowerCase()}.`,
                  );
                }
              }
        }
        isLoading={isLoading}
      />

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? `Edit ${moduleName}` : `Add ${moduleName}`}
            </DialogTitle>
            <DialogDescription>
              Complete the details below and save your changes.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={submitForm}
            className="grid gap-4 py-2 sm:grid-cols-2"
          >
            {fields.map((field) => (
              <div
                key={field.name}
                className={
                  field.type === "textarea"
                    ? "space-y-2 sm:col-span-2"
                    : "space-y-2"
                }
              >
                <Label htmlFor={field.name}>
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
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={asInputValue(formValues[field.name])}
                    onValueChange={(value) => setField(field.name, value)}
                  >
                    <SelectTrigger id={field.name} className="w-full">
                      <SelectValue placeholder={`Select ${field.label}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {(optionValues[field.name] ?? field.options)?.map(
                        (option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                ) : field.type === "checkbox" ? (
                  <div className="flex h-8 items-center gap-2">
                    <Checkbox
                      id={field.name}
                      checked={Boolean(formValues[field.name])}
                      onCheckedChange={(checked) =>
                        setField(field.name, Boolean(checked))
                      }
                    />
                    <Label htmlFor={field.name}>Yes</Label>
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
                  />
                )}
                {errors[field.name] && (
                  <p className="text-xs text-destructive">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRecord ? "Save changes" : `Add ${moduleName}`}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(viewingRecord)}
        onOpenChange={(open) => !open && setViewingRecord(null)}
      >
        <DialogContent className="max-w-lg p-6">
          <DialogHeader>
            <DialogTitle>{moduleName} details</DialogTitle>
          </DialogHeader>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {viewingRecord &&
              Object.entries(viewingRecord).map(([key, value]) => (
                <React.Fragment key={key}>
                  <dt className="font-medium text-muted-foreground">{key}</dt>
                  <dd className="break-words">{asInputValue(value)}</dd>
                </React.Fragment>
              ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
>>>>>>> ff5e4d8 (employeeCrud_fix)
