import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

import { DynamicRecord, DynamicTableProps } from "@/types/dynamic";

export default function DynamicTable({
  fields,
  records,
  loading = false,
  onStock,
  onEdit,
  onDelete,
}: DynamicTableProps) {
  const visibleFields = [...fields]
    .filter((field) => field.visible && field.table)
    .sort((a, b) => Number(a.orderNo) - Number(b.orderNo));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">Loading...</div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            {visibleFields.map((field) => (
              <th key={field.id} className="text-left px-4 py-3 font-semibold">
                {field.label}
              </th>
            ))}

            <th className="text-right px-4 py-3">Actions</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 && (
            <tr>
              <td
                colSpan={visibleFields.length + 1}
                className="text-center py-8"
              >
                No Records Found
              </td>
            </tr>
          )}

          {records.map((record: DynamicRecord) => (
            <tr key={record.id} className="border-t hover:bg-muted/40">
              {visibleFields.map((field) => (
                <td key={field.id} className="px-4 py-3">
                  {renderValue(record.values?.[field.fieldName])}
                </td>
              ))}

              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => onStock(record)}>
                    📦 Stock
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(record)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => onDelete(record)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderValue(value: any) {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}
