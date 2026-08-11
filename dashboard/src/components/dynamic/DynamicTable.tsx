import React, { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Pencil,
  Trash2,
  GripVertical,
  Package,
  Plus,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DynamicRecord,
  DynamicTableProps,
  DynamicField,
} from "@/types/dynamic";

function SortableHeaderCell({
  id,
  children,
  className,
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 20 : undefined,
    position: "relative",
  };
  return (
    <th ref={setNodeRef} style={style} className={className}>
      <div className="flex items-center gap-3">
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
  onVendors,
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
    }),
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
    localStorage.setItem(
      "inventory-table-column-order",
      JSON.stringify(newOrder),
    );
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
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="max-h-[70vh] overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={orderedColumnIds}
            strategy={horizontalListSortingStrategy}
          >
            <table className="w-full min-w-[920px]">
              <thead className="sticky top-0 z-30 bg-card/95 backdrop-blur-xs border-b border-border/80 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)]">
                <tr>
                  {orderedColumnIds.map((colId) => {
                    const field = fieldsMap.get(colId);
                    if (!field) return null;
                    return (
                      <SortableHeaderCell
                        key={colId}
                        id={colId}
                        className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground whitespace-nowrap select-none"
                      >
                        {field.label}
                      </SortableHeaderCell>
                    );
                  })}
                  <th className="w-[250px] min-w-[250px] max-w-[200px] px-2 py-3.5 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider select-none">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {records.length === 0 && (
                  <tr>
                    <td
                      colSpan={orderedColumnIds.length + 1}
                      className="py-16 text-center text-sm text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="p-4 bg-muted rounded-full text-muted-foreground/60 select-none">
                          <Package className="h-8 w-8" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p className="font-bold text-foreground text-sm">
                            No inventory records found
                          </p>
                          <p className="text-xs text-muted-foreground max-w-xs">
                            Add a new item to get started or try importing an
                            Excel sheet.
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {records.map((record: DynamicRecord) => (
                  <tr
                    key={record.id}
                    className="border-t hover:bg-muted/40 transition-colors duration-150"
                  >
                    {orderedColumnIds.map((colId) => {
                      const field = fieldsMap.get(colId);
                      if (!field) return null;
                      return (
                        <td
                          key={colId}
                          className="px-6 py-3.5 align-middle whitespace-nowrap"
                        >
                          {renderValue(record.values?.[field.fieldName], field)}
                        </td>
                      );
                    })}

                    <td className="w-[200px] min-w-[200px] max-w-[200px] sticky right-0 z-10 bg-background/95 backdrop-blur-xs px-2 py-3.5 border-l border-border/60 shadow-[-6px_0_10px_-4px_rgba(0,0,0,0.06)] align-middle text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg hover:bg-primary/10 hover:text-primary font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors duration-150"
                          onClick={() => onStock(record)}
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Stock</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 rounded-lg hover:bg-blue-500/10 hover:text-blue-600 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors duration-150"
                          onClick={() => onVendors(record)}
                        >
                          <Users className="h-3.5 w-3.5" />
                          <span>Suppliers</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 transition-colors duration-150"
                          title="Edit"
                          onClick={() => onEdit(record)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/15 transition-colors duration-150"
                          title="Delete"
                          onClick={() => onDelete(record)}
                        >
                          <Trash2 className="h-4 w-4" />
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
    </div>
  );
}

function renderValue(value: any, field: DynamicField) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-foreground font-medium">-</span>;
  }

  const fieldNameLower = field.fieldName.toLowerCase();
  const labelLower = field.label.toLowerCase();

  // 1. Stock / Quantity styling
  if (
    field.type === "NUMBER" &&
    (fieldNameLower.includes("qty") ||
      fieldNameLower.includes("quantity") ||
      fieldNameLower.includes("stock") ||
      fieldNameLower.includes("balance") ||
      labelLower.includes("qty") ||
      labelLower.includes("quantity") ||
      labelLower.includes("stock") ||
      labelLower.includes("balance"))
  ) {
    const num = Number(value);
    if (!isNaN(num)) {
      if (num <= 0) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 border border-rose-500/10 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            {num} (Out of Stock)
          </span>
        );
      }
      if (num <= 5) {
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 border border-amber-500/10 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {num} (Low Stock)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/10 select-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {num} (In Stock)
        </span>
      );
    }
  }

  // 2. Email Address
  if (
    field.type === "EMAIL" ||
    fieldNameLower.includes("email") ||
    labelLower.includes("email")
  ) {
    return (
      <a
        href={`mailto:${value}`}
        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium hover:text-primary/80 transition-colors"
      >
        <svg
          className="w-3.5 h-3.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        {String(value)}
      </a>
    );
  }

  // 3. Phone Number
  if (
    field.type === "PHONE" ||
    fieldNameLower.includes("phone") ||
    labelLower.includes("phone") ||
    fieldNameLower.includes("contact") ||
    labelLower.includes("contact")
  ) {
    const valStr = String(value);
    if (/^[+]*[0-9\s-]{7,15}$/.test(valStr.trim())) {
      return (
        <a
          href={`tel:${valStr}`}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-medium hover:underline transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 shrink-0 text-muted-foreground/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          </svg>
          {valStr}
        </a>
      );
    }
  }

  // 4. Default formats
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
        No
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <span className="font-medium text-foreground">{value.join(", ")}</span>
    );
  }

  if (typeof value === "object") {
    return (
      <code className="text-xs bg-muted p-1 rounded font-mono">
        {JSON.stringify(value)}
      </code>
    );
  }

  // Standard string
  return <span className="font-medium text-foreground">{String(value)}</span>;
}
