
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type SpotBookingStatus = 'available' | 'fully_booked' | 'unavailable_by_owner' | 'not_configured';

interface SpotStatusBadgeProps {
  status: SpotBookingStatus;
  className?: string;
}

export function SpotStatusBadge({ status, className }: SpotStatusBadgeProps) {
  let text = "";
  let badgeVariant: "default" | "secondary" | "destructive" | "outline" = "default";

  switch (status) {
    case 'available':
      text = "Disponível";
      badgeVariant = "default"; // Usually green via accent in theme
      break;
    case 'fully_booked':
      text = "Totalmente Reservada";
      // Use a color that indicates it's booked but not necessarily "bad" like destructive
      // We'll rely on Tailwind direct class for this, as destructive is too strong.
      // Consider adding a 'warning' variant to Badge or styling directly.
      // For now, let's use secondary with a specific bg color if needed or rely on accent.
      // Using secondary for now, can be customized later.
      badgeVariant = "secondary";
      break;
    case 'unavailable_by_owner':
      text = "Indisponível";
      badgeVariant = "destructive";
      break;
    case 'not_configured':
      text = "Não Configurada";
      badgeVariant = "outline"; // Neutral, like gray
      break;
    default:
      text = "Desconhecido";
      badgeVariant = "outline";
  }

  return (
    <Badge
      className={cn(
        "px-3 py-1 text-xs font-semibold",
        status === 'available' && "bg-accent text-accent-foreground",
        status === 'fully_booked' && "bg-orange-500 text-white dark:bg-orange-600", // Example custom color
        status === 'unavailable_by_owner' && "bg-destructive text-destructive-foreground",
        status === 'not_configured' && "bg-muted text-muted-foreground",
        className
      )}
      // variant={badgeVariant} // variant prop might conflict with direct bg- classes
    >
      {text}
    </Badge>
  );
}
