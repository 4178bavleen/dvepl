import { Checkbox } from "@/components/ui/checkbox";

interface Action {
  key: string;
  label: string;
}

interface PermissionRowProps {
  title: string;
  actions: Action[];
  selected: string[];
  onToggle: (permission: string) => void;
}

export function PermissionRow({
  title,
  actions,
  selected,
  onToggle,
}: PermissionRowProps) {
  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      {/* Header */}
      <div className="bg-muted px-5 py-3 border-b">
        <h3 className="font-semibold text-sm">{title}</h3>
      </div>

      {/* Permission Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 p-5">
        {actions.map((action) => (
          <label
            key={action.key}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Checkbox
              checked={selected.includes(action.key)}
              onCheckedChange={() => onToggle(action.key)}
            />

            <span className="text-sm">{action.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}