
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SpotStatusBadgeProps {
  isAvailable: boolean;
  className?: string;
}

export function SpotStatusBadge({ isAvailable, className }: SpotStatusBadgeProps) {
  return (
    <Badge
      className={cn(
        isAvailable ? "bg-accent text-accent-foreground" : "bg-destructive/80 text-destructive-foreground",
        "px-3 py-1 text-xs font-semibold",
        className
      )}
    >
      {isAvailable ? "Disponível" : "Ocupada"}
    </Badge>
  );
}
