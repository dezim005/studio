
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SpotBookingStatus = 'available' | 'fully_booked' | 'unavailable_by_owner' | 'not_configured';

interface SpotStatusBadgeProps {
  status: SpotBookingStatus;
  className?: string;
}

export function SpotStatusBadge({ status, className }: SpotStatusBadgeProps) {
  let text = "";
  // let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default"; // Not used due to direct styling

  switch (status) {
    case 'available':
      text = "Disponível";
      // badgeVariant = "default"; // Green via accent in theme
      break;
    case 'fully_booked':
      text = "Indisponível"; // Changed text
      // badgeVariant = "destructive"; // Will be red
      break;
    case 'unavailable_by_owner':
      text = "Indisponível";
      // badgeVariant = "destructive"; // Red
      break;
    case 'not_configured':
      text = "Não Configurada";
      // badgeVariant = "outline"; // Neutral, like gray
      break;
    default:
      text = "Desconhecido";
      // badgeVariant = "outline";
  }

  return (
    <Badge
      className={cn(
        "px-3 py-1 text-xs font-semibold",
        status === 'available' && "bg-accent text-accent-foreground",
        status === 'fully_booked' && "bg-destructive text-destructive-foreground", // Changed to destructive (Red)
        status === 'unavailable_by_owner' && "bg-destructive text-destructive-foreground",
        status === 'not_configured' && "bg-muted text-muted-foreground",
        className
      )}
    >
      {text}
    </Badge>
  );
}
