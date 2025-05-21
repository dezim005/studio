
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  const logoColor = "#1F998C";

  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Vaga Livre" {...rest}>
      <Car className="h-7 w-7 shrink-0" style={{ color: logoColor }} />
      <span className="text-xl font-bold" style={{ color: logoColor, lineHeight: '1' }}>
        VAGA LIVRE
      </span>
    </div>
  );
}
