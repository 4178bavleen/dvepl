import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  variant?: "default" | "primary";
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  onClick,
  variant = "default",
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "card-elevated p-5 text-left w-full group transition-all duration-200",
        variant === "primary" && "gradient-whatsapp border-primary/20"
      )}
    >
      <div
        className={cn(
          "inline-flex p-3 rounded-xl mb-3 transition-transform duration-200 group-hover:scale-110",
          variant === "default"
            ? "bg-primary/10 text-primary"
            : "bg-primary-foreground/20 text-primary-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <h3
        className={cn(
          "font-semibold mb-1",
          variant === "default" ? "text-foreground" : "text-primary-foreground"
        )}
      >
        {title}
      </h3>
      <p
        className={cn(
          "text-sm",
          variant === "default"
            ? "text-muted-foreground"
            : "text-primary-foreground/80"
        )}
      >
        {description}
      </p>
    </button>
  );
}
