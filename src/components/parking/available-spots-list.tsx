
"use client";

import * as React from "react";
import type { ParkingSpot, Reservation } from "@/types"; // Adicionado Reservation
import { ParkingSpotCard } from "./parking-spot-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { DateRange } from "react-day-picker";
import { addDays, format, startOfDay, endOfDay, isWithinInterval } from "date-fns"; // Adicionado startOfDay, endOfDay, isWithinInterval
import { ptBR } from 'date-fns/locale';
import { Search, ParkingSquare, CalendarIcon, Loader2 } from "lucide-react"; // Adicionado Loader2
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context"; // Adicionado useAuth
import { addReservation, getAllReservations, getReservationsBySpotId } from "@/lib/reservation-service"; // Adicionado reservation-service
import { getParkingSpots } from "@/lib/parking-spot-service";


interface AvailableSpotsListProps {
  spots: ParkingSpot[]; // Spots iniciais, podem ser atualizados
  onReserveSpot?: (spotId: string, details: ReservationDetails) => void; // Tornar opcional, pois o handleReserve será interno
}

export interface ReservationDetails {
  dateRange: DateRange;
  // Adicione outros detalhes se necessário, como horário específico dentro do dia
}

function DateRangePicker({
  className,
  date,
  onDateChange,
}: React.HTMLAttributes<HTMLDivElement> & { date: DateRange | undefined; onDateChange: (date: DateRange | undefined) => void }) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "PPP", { locale: ptBR })} -{" "}
                  {format(date.to, "PPP", { locale: ptBR })}
                </>
              ) : (
                format(date.from, "PPP", { locale: ptBR })
              )
            ) : (
              <span>Escolha um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
            disabled={(day) => day < startOfDay(new Date())} // Desabilita dias anteriores ao dia de hoje
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function AvailableSpotsList({ spots: initialSpots }: AvailableSpotsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [spots, setSpots] = React.useState<ParkingSpot[]>(initialSpots);
  const [allReservations, setAllReservations] = React.useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterType, setFilterType] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>({
    from: startOfDay(new Date()),
    to: startOfDay(addDays(new Date(), 0)),
  });
  const [isSubmittingReservation, setIsSubmittingReservation] = React.useState<string | null>(null);


  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      // Não precisamos buscar spots aqui se eles são passados como prop e atualizados externamente
      // Mas se quisermos buscar aqui, podemos:
      // const fetchedSpots = getParkingSpots();
      // setSpots(fetchedSpots);
      setSpots(initialSpots); // Usar os spots passados inicialmente ou atualizados pela página pai

      const fetchedReservations = getAllReservations();
      setAllReservations(fetchedReservations);
      setIsLoading(false);
    };
    fetchData();
  }, [initialSpots]); // Re-fetch se os initialSpots mudarem (após reserva na página pai)


  const isSpotBookableForSelectedRange = React.useCallback((spot: ParkingSpot, selectedRange: DateRange | undefined): boolean => {
    if (!selectedRange?.from || !user) return false;
    if (!spot.isAvailable) return false; // Vaga mestre desabilitada
    if (!spot.availability || spot.availability.length === 0) return false; // Sem slots de disponibilidade

    const reqStartTime = startOfDay(selectedRange.from);
    // Para 'to', se for o mesmo dia, usamos endOfDay para cobrir o dia inteiro na verificação de conflito.
    // Se for um range, o endTime da reserva será o fim do último dia.
    const reqEndTime = selectedRange.to ? endOfDay(selectedRange.to) : endOfDay(selectedRange.from);

    // 1. Verificar se algum AvailabilitySlot cobre o período desejado
    const hasCoveringSlot = spot.availability.some(slot => {
      const slotStart = startOfDay(new Date(slot.startTime));
      const slotEnd = endOfDay(new Date(slot.endTime)); // Assume que o slot de disponibilidade cobre dias inteiros
      
      // O período selecionado [reqStartTime, reqEndTime]
      // O período do slot [slotStart, slotEnd]
      // Verifica se há sobreposição e se o slot cobre o período requisitado
      // Esta é uma verificação simplificada. A lógica exata está no addReservation.
      return reqStartTime <= slotEnd && reqEndTime >= slotStart;
    });

    if (!hasCoveringSlot) return false;

    // 2. Verificar se já existem reservas que conflitam TOTALMENTE com o período selecionado
    // Esta lógica é para a UI. A verificação fina de conflito ocorre no backend/serviço.
    const spotReservations = allReservations.filter(r => r.spotId === spot.id);
    const isBookedSolid = spotReservations.some(res => {
        const resStart = new Date(res.startTime);
        const resEnd = new Date(res.endTime);
        // Se a reserva existente cobre completamente o período desejado
        return resStart <= reqStartTime && resEnd >= reqEndTime;
    });

    return !isBookedSolid; // É bookable se não estiver solidamente reservado
  }, [user, allReservations]);


  const filteredSpots = React.useMemo(() => {
    return spots.filter(spot => {
      const matchesSearch = spot.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            spot.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || spot.type === filterType;
      
      // Só incluir na lista se a vaga estiver marcada como disponível e tiver slots de disponibilidade
      if (!spot.isAvailable || !spot.availability || spot.availability.length === 0) {
        return false;
      }
      return matchesSearch && matchesType;
    });
  }, [spots, searchTerm, filterType]);

  const handleReserve = async (spotId: string) => {
    if (!user) {
      toast({ title: "Erro", description: "Você precisa estar logado para reservar.", variant: "destructive" });
      return;
    }
    if (!dateRange || !dateRange.from) {
      toast({ title: "Selecione o Período", description: "Por favor, selecione um período para sua reserva.", variant: "destructive" });
      return;
    }
    
    setIsSubmittingReservation(spotId);

    const reservationData = {
      spotId,
      userId: user.id,
      startTime: dateRange.from,
      endTime: dateRange.to || dateRange.from, // Se 'to' não estiver definido, é um dia único
      // vehiclePlate: "ABC-123" // Poderia ser coletado em um modal mais complexo
    };

    const result = await addReservation(reservationData);

    if (result.success) {
      toast({
        title: "Reserva Confirmada!",
        description: result.message,
      });
      // Atualizar estado para refletir a nova reserva e potencial mudança de disponibilidade das vagas
      const updatedSpots = getParkingSpots(); // Rebuscar spots
      setSpots(updatedSpots);
      const updatedReservations = getAllReservations(); // Rebuscar reservas
      setAllReservations(updatedReservations);
    } else {
      toast({
        title: "Falha na Reserva",
        description: result.message || "Não foi possível reservar a vaga para este período.",
        variant: "destructive",
      });
    }
    setIsSubmittingReservation(null);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
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
        <DateRangePicker date={dateRange} onDateChange={setDateRange} />
      </div>

      {filteredSpots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSpots.map((spot) => {
            const isBookable = isSpotBookableForSelectedRange(spot, dateRange);
            return (
              <ParkingSpotCard 
                key={spot.id} 
                spot={spot} 
                showActions 
                onReserve={isBookable ? () => handleReserve(spot.id) : undefined}
                isBookable={isBookable}
                isReserving={isSubmittingReservation === spot.id}
              />
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10 border rounded-md bg-card">
          <ParkingSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Nenhuma vaga disponível corresponde aos seus critérios.</p>
          <p className="text-sm text-muted-foreground">Tente ajustar sua busca, filtros ou período selecionado.</p>
        </div>
      )}
    </div>
  );
}
