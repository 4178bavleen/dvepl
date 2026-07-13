import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
}

const variantStyles = {
  default: "bg-card",
  primary: "gradient-whatsapp-light border-primary/20",
  success: "bg-success/5 border-success/20",
  warning: "bg-warning/5 border-warning/20",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
};

export function MetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon: Icon,
  variant = "default",
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "card-elevated p-6 flex flex-col gap-4",
        variantStyles[variant]
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className={cn("p-2.5 rounded-xl", iconVariantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold tracking-tight text-foreground">{value}</span>
        {change && (
          <span
            className={cn(
              "text-sm font-medium px-2 py-0.5 rounded-full",
              changeType === "positive" && "bg-success/10 text-success",
              changeType === "negative" && "bg-destructive/10 text-destructive",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
