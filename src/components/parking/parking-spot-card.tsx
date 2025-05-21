
import type { ParkingSpot } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpotStatusBadge } from "./spot-status-badge";
import { Car, MapPin, ParkingCircle, Tag, CalendarDays, User as UserIconLucide, Eye } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; 

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  showActions?: boolean;
  // onReserve prop removida, substituída por onBookSpotClick
  onBookSpotClick?: (spot: ParkingSpot) => void; 
}

export function ParkingSpotCard({ spot, showActions = false, onBookSpotClick }: ParkingSpotCardProps) {
  const { user } = useAuth(); 

  const spotTypeTranslations: Record<ParkingSpot['type'], string> = {
    compact: 'Compacto',
    standard: 'Padrão',
    suv: 'SUV',
    motorcycle: 'Moto'
  };

  const canCurrentUserManage = user && spot.ownerId === user.id;
  // Uma vaga é "bookable" na lista se estiver disponível e tiver disponibilidade definida
  const isGenerallyBookable = spot.isAvailable && spot.availability && spot.availability.length > 0;

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
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
          { (spot.ownerName || spot.ownerId) && (
            <div className="text-sm text-muted-foreground flex items-center">
              <UserIconLucide className="mr-2 h-4 w-4" />
              Anunciada por: {spot.ownerName ? spot.ownerName : `Residente ${spot.ownerId?.slice(-4)}`}
            </div>
          )}
          {spot.description && (
             <p className="text-sm text-muted-foreground pt-1 italic">"{spot.description}"</p>
          )}
           {!spot.availability || spot.availability.length === 0 && spot.isAvailable && (
            <p className="text-xs text-orange-600 dark:text-orange-400 pt-1">Disponibilidade não definida pelo proprietário.</p>
          )}
        </CardContent>
      </div>
      {showActions && (
        <CardFooter className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
          {isGenerallyBookable && onBookSpotClick && (
            <Button 
              onClick={() => onBookSpotClick(spot)} 
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Disponibilidade e Reservar
            </Button>
          )}
          {!isGenerallyBookable && spot.isAvailable && (
             <Button variant="outline" disabled  className="w-full sm:w-auto">
              Indisponível para Reserva
            </Button>
          )}
           {!spot.isAvailable && ( // Vaga mestre está indisponível
             <Button variant="outline" disabled  className="w-full sm:w-auto">
              Vaga Indisponível
            </Button>
          )}
          {canCurrentUserManage && ( 
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
