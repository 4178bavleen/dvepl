import {
  Input,
} from "@/components/ui/input";

import {
  Checkbox,
} from "@/components/ui/checkbox";

import {
  Textarea,
} from "@/components/ui/textarea";

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

  value: any;

  onChange: (value: any) => void;
}

export default function DynamicFieldRenderer({
  field,
  value,
  onChange,
}: Props) {
  const renderInput = () => {
    switch (field.type) {
      case "TEXT":
      case "EMAIL":
      case "PHONE":
        return (
          <Input
            placeholder={field.placeholder ?? ""}
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        );

      case "NUMBER":
        return (
          <Input
            type="number"
            placeholder={field.placeholder ?? ""}
            value={value ?? ""}
            onChange={(e) =>
              onChange(Number(e.target.value))
            }
          />
        );

      case "DATE":
        return (
          <Input
            type="date"
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        );

      case "TEXTAREA":
        return (
          <Textarea
            placeholder={field.placeholder ?? ""}
            value={value ?? ""}
            rows={4}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        );

      case "CHECKBOX":
        return (
          <Checkbox
            checked={Boolean(value)}
            onCheckedChange={onChange}
          />
        );

      case "SELECT":
        return (
          <Select
            value={value ?? ""}
            onValueChange={onChange}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  field.placeholder ??
                  "Select"
                }
              />
            </SelectTrigger>

            <SelectContent>
              {(field.options || []).map(
                (option: string) => (
                  <SelectItem
                    key={option}
                    value={option}
                  >
                    {option}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        );

      default:
        return (
          <Input
            value={value ?? ""}
            onChange={(e) =>
              onChange(e.target.value)
            }
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">
        {field.label}

        {field.required && (
          <span className="text-red-500 ml-1">
            *
          </span>
        )}
      </label>

      {renderInput()}
    </div>
  );
}