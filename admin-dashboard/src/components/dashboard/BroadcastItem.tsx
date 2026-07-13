import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, Users } from "lucide-react";

interface BroadcastItemProps {
  name: string;
  status: "active" | "scheduled" | "completed" | "draft";
  sent: number;
  total: number;
  date: string;
}

const statusStyles = {
  active: "bg-primary/10 text-primary border-primary/20",
  scheduled: "bg-info/10 text-info border-info/20",
  completed: "bg-success/10 text-success border-success/20",
  draft: "bg-muted text-muted-foreground border-muted",
};

const statusLabels = {
  active: "Active",
  scheduled: "Scheduled",
  completed: "Completed",
  draft: "Draft",
};

export function BroadcastItem({ name, status, sent, total, date }: BroadcastItemProps) {
  const progress = total > 0 ? (sent / total) * 100 : 0;

  return (
    <div className="card-elevated p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="font-semibold text-foreground mb-1">{name}</h4>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {total.toLocaleString()} recipients
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {date}
            </span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("text-xs font-medium", statusStyles[status])}
        >
          {statusLabels[status]}
        </Badge>
      </div>
      {status !== "draft" && status !== "scheduled" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {sent.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
}
