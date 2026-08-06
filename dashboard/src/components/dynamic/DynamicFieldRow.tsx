import { memo } from "react";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import DynamicFieldOptions from "./DynamicFieldOptions";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DynamicField } from "@/types/dynamic";

interface Props {
  field: DynamicField;
  saving?: boolean;

  onUpdate: (id: string, changes: Partial<DynamicField>) => void;

  onDelete: (id: string) => void;
}

function DynamicFieldRow({
  field,
  saving,
  onUpdate,
  onDelete,
}: Props) {
  return (
    <div className="border rounded-lg p-4 grid grid-cols-5 gap-4 items-center">
      <Input
    value={field.label ?? ""}
    placeholder="Field label"
    onChange={(e) =>
        onUpdate(field.id, {
            label: e.target.value,
        })
    }
/>

      <Select
        value={field.type}
        onValueChange={(value) =>
          onUpdate(field.id, {
            type: value as DynamicField["type"],
          })
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="TEXT">Text</SelectItem>

          <SelectItem value="NUMBER">Number</SelectItem>

          <SelectItem value="TEXTAREA">Textarea</SelectItem>

          <SelectItem value="SELECT">Dropdown</SelectItem>

          <SelectItem value="DATE">Date</SelectItem>

          <SelectItem value="EMAIL">Email</SelectItem>

          <SelectItem value="PHONE">Phone</SelectItem>

          <SelectItem value="CHECKBOX">Checkbox</SelectItem>
        </SelectContent>
      </Select>
      {field.type === "SELECT" && (
  <DynamicFieldOptions
    options={field.options ?? []}
    onChange={(options) =>
      onUpdate(field.id, {
        options,
      })
    }
  />
)}

      <div className="flex items-center gap-2">
        <Checkbox
          checked={field.required}
          onCheckedChange={(v) =>
            onUpdate(field.id, {
              required: Boolean(v),
            })
          }
        />

        <span>Required</span>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={field.visible}
          onCheckedChange={(v) => {
                        onUpdate(field.id, {
    visible: Boolean(v),
})
          } 

          }/>

        <span>Visible</span>
      </div>

      <div className="flex justify-end">
        <Button
          variant="destructive"
          size="icon"
          onClick={() => onDelete(field.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default memo(DynamicFieldRow);
