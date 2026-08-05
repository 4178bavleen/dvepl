import { useMemo } from "react";

import { Button } from "@/components/ui/button";

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

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
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