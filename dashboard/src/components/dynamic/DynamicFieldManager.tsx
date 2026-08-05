import { useEffect, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

import dynamicApi from "@/services/dynamicApi";
import DynamicFieldRow from "@/components/dynamic/DynamicFieldRow";

import { DynamicField, DynamicFieldManagerProps } from "@/types/dynamic";
import { useDebouncedCallback } from "./hooks/useDebouncedCallback";

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
  const saveField = useDebouncedCallback(
  async (
    id: string,
    changes: Partial<DynamicField>,
    previous: DynamicField[],
  ) => {
    try {
      setSavingId(id);

      await dynamicApi.updateField(id, changes);
    } catch (err) {
      console.error(err);

      setLocalFields(previous);
    } finally {
      setSavingId(null);
    }
  },
  700,
);

  useEffect(() => {
    setLocalFields(fields);
  }, [fields]);

const updateField = (
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
};
const saveChanges = async () => {
  try {
    for (const [id, changes] of Object.entries(dirtyFields)) {
      await dynamicApi.updateField(id, changes);
    }

    setDirtyFields({});
    await onRefresh();
  } catch (err) {
    console.error(err);
  }
};
  const deleteField = async (id: string) => {
    if (!confirm("Delete field?")) return;

    await dynamicApi.deleteField(id);

    await onRefresh();
  };

  const addField = async () => {
    await dynamicApi.createField({
      moduleId,
      fieldName: `field_${Date.now()}`,
      label: "New Field",
      type: "TEXT",
      required: false,
      visible: true,
      searchable: true,
      filterable: false,
      table: true,
      orderNo: localFields.length + 1,
    });

    await onRefresh();
  };

  return (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-lg font-bold">Manage Fields</h2>

      <div className="flex gap-2">
        <Button
          variant="outline"
          disabled={Object.keys(dirtyFields).length === 0}
          onClick={saveChanges}
        >
          Save Changes
        </Button>

        <Button onClick={addField}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>
    </div>

    {[...localFields]
      .sort((a, b) => a.orderNo - b.orderNo)
      .map((field) => (
        <DynamicFieldRow
          key={field.id}
          field={field}
          saving={savingId === field.id}
          onUpdate={updateField}
          onDelete={deleteField}
        />
      ))}
  </div>
);
}
