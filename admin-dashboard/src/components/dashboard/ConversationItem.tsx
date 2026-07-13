import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck } from "lucide-react";

interface ConversationItemProps {
  name: string;
  message: string;
  time: string;
  avatar?: string;
  unread?: number;
  status?: "sent" | "delivered" | "read";
  isActive?: boolean;
}

export function ConversationItem({
  name,
  message,
  time,
  avatar,
  unread,
  status,
  isActive,
}: ConversationItemProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200",
        isActive
          ? "bg-primary/10 border border-primary/20"
          : "hover:bg-muted/50"
      )}
    >
      <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-foreground truncate">{name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{time}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            {status && (
              <span className="flex-shrink-0">
                {status === "sent" && <Check className="h-3.5 w-3.5 text-muted-foreground" />}
                {status === "delivered" && <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />}
                {status === "read" && <CheckCheck className="h-3.5 w-3.5 text-primary" />}
              </span>
            )}
            <span className="text-sm text-muted-foreground truncate">{message}</span>
          </div>
          {unread && unread > 0 && (
            <Badge className="bg-primary text-primary-foreground h-5 min-w-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5">
              {unread}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
