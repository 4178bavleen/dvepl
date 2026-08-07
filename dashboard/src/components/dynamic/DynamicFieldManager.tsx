import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";

import dynamicApi from "@/services/dynamicApi";
import DynamicFieldRow from "@/components/dynamic/DynamicFieldRow";
import { ConfirmDialog } from "@/components/shared/confirmDialog";

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
  const [isAddingField, setIsAddingField] = useState(false);

  // Deletion Dialog States
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      toast.success("All field changes saved successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to save field changes");
    } finally {
      setIsSavingChanges(false);
    }
  };

  const confirmDeleteField = (id: string) => {
    setFieldToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const deleteField = async () => {
    if (!fieldToDelete) return;
    const id = fieldToDelete;

    const removedField = localFields.find((field) => field.id === id);
    if (!removedField) return;

    // Optimistically update local UI
    setLocalFields((prev) => prev.filter((field) => field.id !== id));
    setDirtyFields((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      setIsDeleting(true);
      await dynamicApi.deleteField(id);
      await onRefresh();
      toast.success("Field deleted successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete field");
      // Rollback local state
      setLocalFields((prev) => (removedField ? [removedField, ...prev].sort((a, b) => a.orderNo - b.orderNo) : prev));
    } finally {
      setIsDeleting(false);
      setFieldToDelete(null);
    }
  };

  const addField = async () => {
    if (isAddingField) return;
    setIsAddingField(true);

    const orderNo = localFields.length + 1;
    const fieldName = `field_${Date.now()}`;

    try {
      await dynamicApi.createField({
        moduleId,
        fieldName,
        label: "New Field",
        type: "TEXT",
        required: false,
        visible: true,
        searchable: true,
        filterable: false,
        table: true,
        orderNo,
      });
      await onRefresh();
      toast.success("New field added successfully");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to add new field");
    } finally {
      setIsAddingField(false);
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

          <Button disabled={isAddingField} onClick={addField}>
            <Plus className="w-4 h-4 mr-2" />
            {isAddingField ? "Adding..." : "Add Field"}
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
              onDelete={confirmDeleteField}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Dynamic Field?"
        description="Are you sure you want to delete this field? This will permanently delete this field and any data stored in it across all records."
        confirmText="Delete"
        cancelText="Cancel"
        variant="warning"
        onConfirm={deleteField}
        loading={isDeleting}
      />
    </div>
  );
}
