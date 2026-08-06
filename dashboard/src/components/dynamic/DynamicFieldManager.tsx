import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import dynamicApi from "@/services/dynamicApi";
import DynamicFieldRow from "@/components/dynamic/DynamicFieldRow";

import { DynamicField, DynamicFieldManagerProps } from "@/types/dynamic";

export default function DynamicFieldManager({
  moduleId,
  fields,
  onRefresh,
}: DynamicFieldManagerProps) {
  const [localFields, setLocalFields] = useState<DynamicField[]>(fields);
  const [dirtyFields, setDirtyFields] = useState<
  Record<string, Partial<DynamicField>>
>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isSavingChanges, setIsSavingChanges] = useState(false);

  useEffect(() => {
    setLocalFields((prev) => {
      const serverFields = [...fields].sort((a, b) => a.orderNo - b.orderNo);
      const prevById = new Map(prev.map((field) => [field.id, field]));

      const merged = serverFields.map((field) => {
        const existing = prevById.get(field.id);
        return existing ? { ...field, ...existing } : field;
      });

      const missing = prev.filter(
        (field) => !serverFields.some((serverField) => serverField.id === field.id),
      );

      return [...merged, ...missing].sort((a, b) => a.orderNo - b.orderNo);
    });
  }, [fields]);

const updateField = useCallback((
  id: string,
  changes: Partial<DynamicField>,
) => {
  setLocalFields((prev) =>
    prev.map((field) =>
      field.id === id
        ? {
            ...field,
            ...changes,
          }
        : field,
    ),
  );

  setDirtyFields((prev) => ({
    ...prev,
    [id]: {
      ...prev[id],
      ...changes,
    },
  }));
}, []);
const saveChanges = async () => {
  if (Object.keys(dirtyFields).length === 0) return;

  try {
    setIsSavingChanges(true);
    const entries = Object.entries(dirtyFields);
    await Promise.all(
      entries.map(([id, changes]) => dynamicApi.updateField(id, changes)),
    );

    setDirtyFields({});
    await onRefresh();
  } catch (err) {
    console.error(err);
  } finally {
    setIsSavingChanges(false);
  }
};
  const deleteField = async (id: string) => {
    if (!confirm("Delete field?")) return;

    const removedField = localFields.find((field) => field.id === id);
    if (!removedField) return;

    setLocalFields((prev) => prev.filter((field) => field.id !== id));
    setDirtyFields((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      await dynamicApi.deleteField(id);
      await onRefresh();
    } catch (err) {
      console.error(err);
      setLocalFields((prev) => (removedField ? [removedField, ...prev] : prev));
    }
  };

  const addField = async () => {
    const newField = {
      id: `temp-${Date.now()}`,
      moduleId,
      fieldName: `field_${Date.now()}`,
      label: "New Field",
      type: "TEXT" as const,
      required: false,
      visible: true,
      searchable: true,
      filterable: false,
      table: true,
      orderNo: localFields.length + 1,
      options: [],
    };

    setLocalFields((prev) => [...prev, newField as DynamicField]);

    try {
      await dynamicApi.createField({
        moduleId,
        fieldName: newField.fieldName,
        label: newField.label,
        type: newField.type,
        required: newField.required,
        visible: newField.visible,
        searchable: newField.searchable,
        filterable: newField.filterable,
        table: newField.table,
        orderNo: newField.orderNo,
      });
      await onRefresh();
    } catch (err) {
      console.error(err);
      setLocalFields((prev) => prev.filter((field) => field.id !== newField.id));
    }
  };

  const sortedFields = useMemo(
    () => [...localFields].sort((a, b) => a.orderNo - b.orderNo),
    [localFields],
  );

  return (
  <div className="flex h-full flex-col space-y-4">
    <div className="flex justify-between items-center gap-2">
      <h2 className="text-lg font-bold">Manage Fields</h2>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={Object.keys(dirtyFields).length === 0 || isSavingChanges}
          onClick={saveChanges}
        >
          {isSavingChanges ? "Saving..." : "Save Changes"}
        </Button>

        <Button onClick={addField}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>

    <div className="flex-1 overflow-y-auto pr-2">
      <div className="space-y-3">
        {sortedFields.map((field) => (
          <DynamicFieldRow
            key={field.id}
            field={field}
            saving={savingId === field.id}
            onUpdate={updateField}
            onDelete={deleteField}
          />
        ))}
      </div>
    </div>
  </div>
);
}
