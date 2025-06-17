
import type { ParkingSpot, Reservation } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpotStatusBadge, type SpotBookingStatus } from "./spot-status-badge";
import { isSpotFullyBooked } from "@/lib/reservation-service"; 
import { Car, MapPin, ParkingCircle, Tag, CalendarDays, User as UserIconLucide, Eye, Trash2, Info } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context"; 
import * as React from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

  const relevantReservation = React.useMemo(() => {
    const now = new Date();
    // Filtrar apenas reservas atuais ou futuras
    const futureOrCurrentReservations = reservationsForSpot.filter(res => new Date(res.endTime) >= now);
    
    // Ordenar: ativas primeiro, depois futuras por data de início
    const sortedReservations = futureOrCurrentReservations.sort((a, b) => {
        const aStartTime = new Date(a.startTime);
        const aEndTime = new Date(a.endTime);
        const bStartTime = new Date(b.startTime);
        const bEndTime = new Date(b.endTime);

        const aIsActive = now >= aStartTime && now <= aEndTime;
        const bIsActive = now >= bStartTime && now <= bEndTime;

        if (aIsActive && !bIsActive) return -1; // a ativa vem primeiro
        if (!aIsActive && bIsActive) return 1;  // b ativa vem primeiro

        // Se ambas ativas ou ambas futuras, ordena pela data de início
        return aStartTime.getTime() - bStartTime.getTime();
      });
    return sortedReservations.length > 0 ? sortedReservations[0] : null;
  }, [reservationsForSpot]);


  let statusToDisplay = currentBookingStatus;
  if (statusToDisplay === undefined) {
    if (!spot.isAvailable) {
      statusToDisplay = 'unavailable_by_owner';
    } else if (!spot.availability || spot.availability.length === 0) {
      statusToDisplay = 'not_configured';
    } else if (relevantReservation && new Date() >= new Date(relevantReservation.startTime) && new Date() <= new Date(relevantReservation.endTime)) { 
      // Se há uma reserva relevante e ela está ativa AGORA
      statusToDisplay = 'fully_booked'; 
    } else if (isSpotFullyBooked(spot, reservationsForSpot)) { 
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
          
          {relevantReservation && relevantReservation.renterName && (
            <div className="text-sm border border-accent/30 bg-accent/10 p-3 rounded-md mt-3 space-y-1 shadow">
              <div className="flex items-center font-semibold text-accent-foreground">
                <Info size={16} className="inline mr-2 shrink-0" />
                <span>
                  {new Date() >= new Date(relevantReservation.startTime) && new Date() <= new Date(relevantReservation.endTime)
                    ? "Reservada Atualmente"
                    : "Próxima Reserva"}
                </span>
              </div>
              <div className="pl-2 space-y-0.5">
                  <p className="flex items-center"><UserIconLucide size={14} className="mr-1.5 text-muted-foreground"/> <strong>{relevantReservation.renterName}</strong></p>
                  <p className="flex items-center text-xs"><CalendarDays size={13} className="mr-1.5 text-muted-foreground"/>
                    {format(new Date(relevantReservation.startTime), "dd/MM/yy", { locale: ptBR })} - {format(new Date(relevantReservation.endTime), "dd/MM/yy", { locale: ptBR })}
                  </p>
              </div>
            </div>
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
               statusToDisplay === 'fully_booked' ? (
                  relevantReservation && new Date() >= new Date(relevantReservation.startTime) && new Date() <= new Date(relevantReservation.endTime)
                  ? 'Ocupada Atualmente' 
                  : 'Totalmente Reservada'
                ) : 
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
