import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Status = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning' | 'draft' | 'sent' | 'delivered' | 'failed' | 'online' | 'offline';

interface StatusBadgeProps {
  status: Status;
  label?: string;
}

const statusConfig: Record<Status, { className: string; defaultLabel: string }> = {
  active: { className: 'bg-success/10 text-success border-success/20', defaultLabel: 'Active' },
  inactive: { className: 'bg-muted text-muted-foreground border-muted', defaultLabel: 'Inactive' },
  pending: { className: 'bg-warning/10 text-warning border-warning/20', defaultLabel: 'Pending' },
  success: { className: 'bg-success/10 text-success border-success/20', defaultLabel: 'Success' },
  error: { className: 'bg-destructive/10 text-destructive border-destructive/20', defaultLabel: 'Error' },
  warning: { className: 'bg-warning/10 text-warning border-warning/20', defaultLabel: 'Warning' },
  draft: { className: 'bg-muted text-muted-foreground border-muted', defaultLabel: 'Draft' },
  sent: { className: 'bg-info/10 text-info border-info/20', defaultLabel: 'Sent' },
  delivered: { className: 'bg-success/10 text-success border-success/20', defaultLabel: 'Delivered' },
  failed: { className: 'bg-destructive/10 text-destructive border-destructive/20', defaultLabel: 'Failed' },
  online: { className: 'bg-success/10 text-success border-success/20', defaultLabel: 'Online' },
  offline: { className: 'bg-muted text-muted-foreground border-muted', defaultLabel: 'Offline' },
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("font-medium", config.className)}>
      <span className={cn(
        "w-1.5 h-1.5 rounded-full mr-1.5",
        status === 'active' || status === 'success' || status === 'delivered' || status === 'online' ? 'bg-success' :
        status === 'pending' || status === 'warning' ? 'bg-warning' :
        status === 'error' || status === 'failed' ? 'bg-destructive' :
        'bg-muted-foreground'
      )} />
      {label || config.defaultLabel}
    </Badge>
  );
}
