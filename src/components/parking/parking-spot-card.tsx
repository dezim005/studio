
import type { ParkingSpot, Reservation } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpotStatusBadge, type SpotBookingStatus } from "./spot-status-badge";
import { isSpotFullyBooked } from "@/lib/reservation-service"; 
import { Car, MapPin, ParkingCircle, Tag, CalendarDays, User as UserIconLucide, Eye, Trash2, Info } from "lucide-react"; // Adicionado Info
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; 
import * as React from "react"; // Adicionado React para useMemo

interface ParkingSpotCardProps {
  spot: ParkingSpot;
  reservationsForSpot?: Reservation[]; 
  showActions?: boolean;
  onBookSpotClick?: (spot: ParkingSpot) => void; 
  onDeleteSpotClick?: (spot: ParkingSpot) => void; 
  currentBookingStatus?: SpotBookingStatus;
}

export function ParkingSpotCard({ 
  spot, 
  reservationsForSpot = [], 
  showActions = false, 
  onBookSpotClick,
  onDeleteSpotClick, 
  currentBookingStatus
}: ParkingSpotCardProps) {
  const { user } = useAuth(); 

  const spotTypeTranslations: Record<ParkingSpot['type'], string> = {
    compact: 'Compacto',
    standard: 'Padrão',
    suv: 'SUV',
    motorcycle: 'Moto'
  };

  const canCurrentUserManage = user && spot.ownerId === user.id;
  const canAdminManage = user && user.role === 'manager';

  const activeReservation = React.useMemo(() => {
    const now = new Date();
    return reservationsForSpot.find(res => {
      const startTime = new Date(res.startTime);
      const endTime = new Date(res.endTime);
      return now >= startTime && now <= endTime;
    });
  }, [reservationsForSpot]);

  let statusToDisplay = currentBookingStatus;
  if (statusToDisplay === undefined) {
    if (!spot.isAvailable) {
      statusToDisplay = 'unavailable_by_owner';
    } else if (!spot.availability || spot.availability.length === 0) {
      statusToDisplay = 'not_configured';
    } else if (activeReservation) { // Se há uma reserva ativa, está ocupada
        statusToDisplay = 'fully_booked'; // Usamos 'fully_booked' para o estilo vermelho, mas poderia ser um novo status
    } else if (isSpotFullyBooked(spot, reservationsForSpot)) { // Se não há ativa, mas está totalmente reservada
        statusToDisplay = 'fully_booked';
    } else {
      statusToDisplay = 'available';
    }
  }
  
  const isBookableActionActive = 
    statusToDisplay === 'available' && 
    onBookSpotClick;

  return (
    <Card className="w-full shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col justify-between">
      <div>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-2xl font-semibold text-primary flex items-center">
              <ParkingCircle className="mr-2 h-6 w-6" /> Vaga {spot.number}
            </CardTitle>
            <SpotStatusBadge status={statusToDisplay} />
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
           {statusToDisplay === 'not_configured' && (
            <p className="text-xs text-orange-600 dark:text-orange-400 pt-1">Disponibilidade não definida pelo proprietário.</p>
          )}
          {activeReservation && activeReservation.renterName && (
            <p className="text-sm text-accent-foreground bg-accent/20 p-2 rounded-md mt-2 flex items-center">
              <Info className="inline mr-2 h-4 w-4 shrink-0" />
              Reservada por: <strong>{activeReservation.renterName}</strong>
            </p>
          )}
        </CardContent>
      </div>
      {showActions && (
        <CardFooter className="flex flex-col items-stretch sm:flex-row sm:flex-wrap sm:justify-end sm:items-center gap-2 pt-4">
          {isBookableActionActive ? (
            <Button 
              onClick={() => onBookSpotClick && onBookSpotClick(spot)} 
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Eye className="mr-2 h-4 w-4" /> Ver Disponibilidade e Reservar
            </Button>
          ) : (
             <Button variant="outline" disabled  className="w-full sm:w-auto">
              {statusToDisplay === 'unavailable_by_owner' ? 'Vaga Indisponível' :
               statusToDisplay === 'not_configured' ? 'Indisponível para Reserva' :
               statusToDisplay === 'fully_booked' ? (activeReservation ? 'Ocupada Atualmente' : 'Totalmente Reservada') : 
               'Indisponível para Reserva'}
            </Button>
          )}
          {(canCurrentUserManage || canAdminManage) && ( 
            <>
              <Link href={`/my-spots/${spot.id}/availability`} passHref legacyBehavior>
                <Button variant="outline" className="w-full sm:w-auto">
                  <CalendarDays className="mr-2 h-4 w-4" /> Gerenciar Disponibilidade
                </Button>
              </Link>
              {onDeleteSpotClick && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="w-full sm:w-auto"
                  onClick={() => onDeleteSpotClick(spot)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Vaga
                </Button>
              )}
            </>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
