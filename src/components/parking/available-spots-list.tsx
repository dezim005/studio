
"use client";

import * as React from "react";
import type { ParkingSpot, Reservation } from "@/types";
import { ParkingSpotCard } from "./parking-spot-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ParkingSquare, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { addReservation, getAllReservations } from "@/lib/reservation-service";
import { getParkingSpots } from "@/lib/parking-spot-service";
import { SpotReservationDialog } from "./spot-reservation-dialog"; 
import type { DateRange } from "react-day-picker";
import { startOfDay, endOfDay } from "date-fns";


interface AvailableSpotsListProps {
  spots: ParkingSpot[]; // Initial spots passed from parent page
}

export function AvailableSpotsList({ spots: initialSpots }: AvailableSpotsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [spots, setSpots] = React.useState<ParkingSpot[]>(initialSpots);
  const [allReservations, setAllReservations] = React.useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");

  const [selectedSpotForDialog, setSelectedSpotForDialog] = React.useState<ParkingSpot | null>(null);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = React.useState(false);
  const [isSubmittingReservation, setIsSubmittingReservation] = React.useState(false);


  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setSpots(initialSpots); // Use initialSpots from props
      const fetchedReservations = getAllReservations();
      setAllReservations(fetchedReservations);
      setIsLoading(false);
    };
    fetchData();
  }, [initialSpots]); // Depend on initialSpots

  const filteredSpots = React.useMemo(() => {
    return spots.filter(spot => {
      const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            spot.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || spot.type === filterType;
      
      // Show spots that are owner-available and have some availability configured
      // The detailed booking status (fully_booked etc) will be handled by ParkingSpotCard
      return spot.isAvailable && spot.availability && spot.availability.length > 0 && matchesSearch && matchesType;
    });
  }, [spots, searchTerm, filterType]);

  const handleOpenReservationDialog = (spot: ParkingSpot) => {
    setSelectedSpotForDialog(spot);
    setIsReservationDialogOpen(true);
  };

  const handleConfirmReservation = async (spotId: string, dateRange: DateRange) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para reservar.", variant: "destructive" });
      return;
    }
    if (!dateRange.from) {
      toast({ title: "Selecione o Período", description: "Por favor, selecione um período para sua reserva.", variant: "destructive" });
      return;
    }
    
    setIsSubmittingReservation(true);

    const reservationData = {
      spotId,
      userId: user.id,
      startTime: startOfDay(dateRange.from),
      endTime: dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from),
    };

    const result = await addReservation(reservationData);

    if (result.success) {
      toast({
        title: "Reserva Confirmada!",
        description: result.message,
      });
      // Re-fetch data to update UI, including reservations to update card statuses
      const updatedSpots = getParkingSpots(); // Re-fetch spots
      setSpots(updatedSpots);
      const updatedReservations = getAllReservations(); // Re-fetch all reservations
      setAllReservations(updatedReservations);
      setIsReservationDialogOpen(false); 
    } else {
      toast({
        title: "Falha na Reserva",
        description: result.message || "Não foi possível reservar a vaga para este período.",
        variant: "destructive",
      });
    }
    setIsSubmittingReservation(false);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando vagas disponíveis...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-2.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por número da vaga ou localização..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="compact">Compacto</SelectItem>
            <SelectItem value="standard">Padrão</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="motorcycle">Moto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSpots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => {
            const reservationsForThisSpot = allReservations.filter(res => res.spotId === spot.id);
            return (
              <ParkingSpotCard
                key={spot.id}
                spot={spot}
                reservationsForSpot={reservationsForThisSpot} // Pass reservations for this spot
                showActions
                onBookSpotClick={() => handleOpenReservationDialog(spot)}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Nenhuma vaga disponível que corresponda aos seus critérios.</p>
          <p className="text-sm text-muted-foreground">Verifique se há vagas com disponibilidade definida ou ajuste seus filtros.</p>
        </div>
      )}

      {selectedSpotForDialog && (
        <SpotReservationDialog
          spot={selectedSpotForDialog}
          allReservations={allReservations.filter(res => res.spotId === selectedSpotForDialog.id)} // Pass only relevant reservations
          isOpen={isReservationDialogOpen}
          onOpenChange={setIsReservationDialogOpen}
          onConfirmReservation={handleConfirmReservation}
          isSubmitting={isSubmittingReservation}
        />
      )}
    </div>
  );
}
