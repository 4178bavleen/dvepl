import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";

import DynamicFieldRenderer from "./DynamicFieldRenderer";

import {
  DynamicField,
  DynamicFormProps,
} from "@/types/dynamic";

export default function DynamicForm({
  fields,
  values,
  loading = false,
  onChange,
  onSubmit,
  onCancel,
}: DynamicFormProps) {
  const sortedFields = useMemo(() => {
    return [...fields]
      .filter((field) => field.visible)
      .sort(
        (a, b) =>
          Number(a.orderNo) -
          Number(b.orderNo)
      );
  }, [fields]);
const validateForm = () => {
  for (const field of sortedFields) {
    if (!field.required) continue;

    const value = values[field.fieldName];

    const isEmpty =
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      toast.error(`${field.label} is required`);
      return false;
    }
  }

  return true;
};
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (!validateForm()) return;
        onSubmit();
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sortedFields.map((field: DynamicField) => (
          <DynamicFieldRenderer
            key={field.id}
            field={field}
            value={
              values[field.fieldName]
            }
            onChange={(value) =>
              onChange(
                field.fieldName,
                value
              )
            }
          />
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Saving..."
            : "Save"}
        </Button>
      </div>
    </form>
  );
}