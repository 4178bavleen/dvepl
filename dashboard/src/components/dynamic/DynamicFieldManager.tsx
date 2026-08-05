import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import dynamicApi from "@/services/dynamicApi";

import {
  DynamicField,
  DynamicFieldManagerProps,
} from "@/types/dynamic";

export default function DynamicFieldManager({
  moduleId,
  fields,
  onRefresh,
}: DynamicFieldManagerProps) {
  const [saving, setSaving] = useState(false);

  const updateField = async (
    id: string,
    key: keyof DynamicField,
    value: any
  ) => {
    setSaving(true);

    try {
      await dynamicApi.updateField(id, {
        [key]: value,
      });

      await onRefresh();
    } finally {
      setSaving(false);
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
      orderNo: fields.length + 1,
    });

    await onRefresh();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">
          Manage Fields
        </h2>

        <Button onClick={addField}>
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      {[...fields]
        .sort((a, b) => a.orderNo - b.orderNo)
        .map((field) => (
          <div
            key={field.id}
            className="border rounded-lg p-4 grid grid-cols-5 gap-4 items-center"
          >
            {/* Label */}
            <Input
              defaultValue={field.label}
              disabled={saving}
              onBlur={(e) =>
                updateField(
                  field.id,
                  "label",
                  e.target.value
                )
              }
            />

            {/* Type */}
            <Select
              value={field.type}
              onValueChange={(v) =>
                updateField(field.id, "type", v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="TEXT">
                  Text
                </SelectItem>

                <SelectItem value="NUMBER">
                  Number
                </SelectItem>

                <SelectItem value="TEXTAREA">
                  Textarea
                </SelectItem>

                <SelectItem value="SELECT">
                  Dropdown
                </SelectItem>

                <SelectItem value="DATE">
                  Date
                </SelectItem>

                <SelectItem value="EMAIL">
                  Email
                </SelectItem>

                <SelectItem value="PHONE">
                  Phone
                </SelectItem>

                <SelectItem value="CHECKBOX">
                  Checkbox
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Required */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={field.required}
                onCheckedChange={(v) =>
                  updateField(
                    field.id,
                    "required",
                    v
                  )
                }
              />
              <span>Required</span>
            </div>

            {/* Visible */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={field.visible}
                onCheckedChange={(v) =>
                  updateField(
                    field.id,
                    "visible",
                    v
                  )
                }
              />
              <span>Visible</span>
            </div>

            {/* Delete */}
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="icon"
                onClick={() =>
                  deleteField(field.id)
                }
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}