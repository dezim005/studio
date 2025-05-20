
import type { SVGProps } from 'react';
import { ParkingCircle } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" aria-label="Vaga Livre">
      <ParkingCircle className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary tracking-tight">
        Vaga Livre
      </span>
    </div>
  );
}
