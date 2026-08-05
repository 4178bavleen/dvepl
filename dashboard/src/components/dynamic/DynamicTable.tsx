import React, { useState, useEffect, useMemo } from "react";
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DynamicRecord, DynamicTableProps } from "@/types/dynamic";

function SortableHeaderCell({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  return (
    <th
      ref={setNodeRef}
      style={style}
      className={className}
    >
      <div className="flex items-center gap-1.5">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-muted-foreground/50 hover:text-muted-foreground shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>
        <span className="select-none">{children}</span>
      </div>
    </th>
  );
}

export default function DynamicTable({
  fields,
  records,
  loading = false,
  onStock,
  onEdit,
  onDelete,
}: DynamicTableProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const defaultOrder = useMemo(() => {
    return [...fields]
      .filter((field) => field.visible && field.table)
      .sort((a, b) => Number(a.orderNo) - Number(b.orderNo))
      .map((f) => f.fieldName);
  }, [fields]);

  const [orderedColumnIds, setOrderedColumnIds] = useState<string[]>(() => {
    const defaultOrder = [...fields]
      .filter((field) => field.visible && field.table)
      .sort((a, b) => Number(a.orderNo) - Number(b.orderNo))
      .map((f) => f.fieldName);

    const saved = localStorage.getItem("inventory-table-column-order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        const filtered = parsed.filter((id) => defaultOrder.includes(id));
        const missing = defaultOrder.filter((id) => !filtered.includes(id));
        return [...filtered, ...missing];
      } catch (e) {
        return defaultOrder;
      }
    }
    return defaultOrder;
  });

  useEffect(() => {
    if (defaultOrder.length === 0) return;

    setOrderedColumnIds((prev) => {
      const saved = localStorage.getItem("inventory-table-column-order");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as string[];
          const filtered = parsed.filter((id) => defaultOrder.includes(id));
          const missing = defaultOrder.filter((id) => !filtered.includes(id));
          return [...filtered, ...missing];
        } catch (e) {}
      }

      const filtered = prev.filter((id) => defaultOrder.includes(id));
      const missing = defaultOrder.filter((id) => !filtered.includes(id));
      return [...filtered, ...missing];
    });
  }, [defaultOrder]);

  const saveOrder = (newOrder: string[]) => {
    setOrderedColumnIds(newOrder);
    localStorage.setItem("inventory-table-column-order", JSON.stringify(newOrder));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = orderedColumnIds.indexOf(String(active.id));
      const newIndex = orderedColumnIds.indexOf(String(over.id));
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(orderedColumnIds, oldIndex, newIndex);
        saveOrder(newOrder);
      }
    }
  };

  const fieldsMap = useMemo(() => {
    return new Map(fields.map((f) => [f.fieldName, f]));
  }, [fields]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-60">Loading...</div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedColumnIds}
          strategy={horizontalListSortingStrategy}
        >
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                {orderedColumnIds.map((colId) => {
                  const field = fieldsMap.get(colId);
                  if (!field) return null;
                  return (
                    <SortableHeaderCell key={colId} id={colId} className="text-left px-4 py-3 font-semibold">
                      {field.label}
                    </SortableHeaderCell>
                  );
                })}
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={orderedColumnIds.length + 1}
                    className="text-center py-8"
                  >
                    No Records Found
                  </td>
                </tr>
              )}

              {records.map((record: DynamicRecord) => (
                <tr key={record.id} className="border-t hover:bg-muted/40">
                  {orderedColumnIds.map((colId) => {
                    const field = fieldsMap.get(colId);
                    if (!field) return null;
                    return (
                      <td key={colId} className="px-4 py-3">
                        {renderValue(record.values?.[field.fieldName])}
                      </td>
                    );
                  })}

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
        </SortableContext>
      </DndContext>
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
