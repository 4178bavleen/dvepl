import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  options: string[];
  onChange: (options: string[]) => void;
}

export default function DynamicFieldOptions({
  options,
  onChange,
}: Props) {
  const updateOption = (index: number, value: string) => {
    const copy = [...options];
    copy[index] = value;
    onChange(copy);
  };

  const addOption = () => {
    onChange([...options, ""]);
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index));
  };

  return (
    <div className="col-span-5 mt-4 border-t pt-4">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-medium">Dropdown Options</h4>

        <Button
          size="sm"
          variant="outline"
          onClick={addOption}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Option
        </Button>
      </div>

      <div className="space-y-2">
        {options.map((option, index) => (
          <div
            key={index}
            className="flex gap-2"
          >
            <Input
              value={option}
              onChange={(e) =>
                updateOption(index, e.target.value)
              }
            />

            <Button
              variant="destructive"
              size="icon"
              onClick={() => removeOption(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}