
import type { ParkingSpot } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpotStatusBadge } from "./spot-status-badge";
import { Car, MapPin, ParkingCircle, Tag, CalendarDays, User as UserIconLucide } from "lucide-react"; // Adicionado UserIconLucide
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; 

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  showActions?: boolean;
  onReserve?: (spotId: string) => void;
}

export function ParkingSpotCard({ spot, showActions = false, onReserve }: ParkingSpotCardProps) {
  const { user } = useAuth(); 

  const spotTypeTranslations: Record<ParkingSpot['type'], string> = {
    compact: 'Compacto',
    standard: 'Padrão',
    suv: 'SUV',
    motorcycle: 'Moto'
  };

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-2xl font-semibold text-primary flex items-center">
            <ParkingCircle className="mr-2 h-6 w-6" /> Vaga {spot.number}
          </CardTitle>
          <SpotStatusBadge isAvailable={spot.isAvailable} />
        </div>
        <CardDescription className="flex items-center text-muted-foreground pt-1">
          <MapPin className="mr-2 h-4 w-4" /> {spot.location}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm">
          <Tag className="mr-2 h-4 w-4 text-primary" />
          Tipo: <span className="font-medium ml-1 capitalize">{spotTypeTranslations[spot.type]}</span>
        </div>
        { (spot.ownerName || spot.ownerId) && ( // Mostrar se ownerName ou ownerId existir
          <div className="text-sm text-muted-foreground flex items-center">
            <UserIconLucide className="mr-2 h-4 w-4" />
            Anunciada por: {spot.ownerName ? spot.ownerName : `Residente ${spot.ownerId?.slice(-4)}`}
          </div>
        )}
      </CardContent>
      {showActions && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2">
          {spot.isAvailable && onReserve && (
            <Button onClick={() => onReserve(spot.id)} className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground">
              <CalendarDays className="mr-2 h-4 w-4" /> Reservar Agora
            </Button>
          )}
          {!spot.isAvailable && (
             <Button variant="outline" disabled  className="w-full sm:w-auto">
              Indisponível
            </Button>
          )}
          {user && spot.ownerId === user.id && ( 
            <Link href={`/my-spots/${spot.id}/availability`} passHref legacyBehavior>
              <Button variant="outline" className="w-full sm:w-auto">
                <CalendarDays className="mr-2 h-4 w-4" /> Gerenciar Disponibilidade
              </Button>
            </Link>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
