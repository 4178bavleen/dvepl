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
  | "datetime-local"
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

      const options = items.map((item: any) => ({
  value: item.id,
  label:
    item.name ??
    item.title ??
    (item.firstName && item.lastName
      ? `${item.firstName} ${item.lastName} (${item.employeeCode})`
      : item.employeeCode ??
        item.code ??
        item.id),
}));

        console.log("OPTIONS:", options);

        setOptionValues((current) => ({
          ...current,
          [field]: options,
        }));
    setOptionValues((current) => ({
  ...current,
  [field]: items.map((item: any) => ({
    value: item.id,
    label:
      item.name ??
      item.title ??
      (item.firstName && item.lastName
        ? `${item.firstName} ${item.lastName} (${item.employeeCode})`
        : item.employeeCode ??
          item.code ??
          item.id),
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
