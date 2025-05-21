
"use client";

import * as React from "react";
import type { ParkingSpot, Reservation, AvailabilitySlot } from "@/types";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle, CalendarDays, MapPin } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay, eachDayOfInterval, isEqual, isWithinInterval } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";

interface SpotReservationDialogProps {
  spot: ParkingSpot | null;
  allReservations: Reservation[]; // Todas as reservas do sistema, para verificar conflitos desta vaga
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmReservation: (spotId: string, dateRange: DateRange) => Promise<void>;
  isSubmitting: boolean;
}

export function SpotReservationDialog({
  spot,
  allReservations,
  isOpen,
  onOpenChange,
  onConfirmReservation,
  isSubmitting,
}: SpotReservationDialogProps) {
  const [selectedDateRange, setSelectedDateRange] = React.useState<DateRange | undefined>(undefined);
  const { toast } = useToast();

  React.useEffect(() => {
    // Reset date range when dialog opens for a new spot or closes
    if (isOpen) {
      setSelectedDateRange(undefined);
    }
  }, [isOpen, spot]);

  if (!spot) {
    return null;
  }

  const spotReservations = allReservations.filter(res => res.spotId === spot.id);

  const isDayBooked = (day: Date): boolean => {
    const dayStart = startOfDay(day);
    return spotReservations.some(res => {
      const resStart = startOfDay(new Date(res.startTime));
      const resEnd = endOfDay(new Date(res.endTime));
      return dayStart >= resStart && dayStart <= resEnd;
    });
  };

  const isDayWithinAvailability = (day: Date, availabilitySlots: AvailabilitySlot[]): boolean => {
    const targetDayStart = startOfDay(day);
    return availabilitySlots.some(slot => {
      const slotStart = startOfDay(new Date(slot.startTime));
      const slotEnd = endOfDay(new Date(slot.endTime));
      // O dia deve estar completamente contido no intervalo de disponibilidade
      return targetDayStart >= slotStart && targetDayStart <= slotEnd;
    });
  };
  
  const disabledDaysFunc = (day: Date): boolean => {
    if (day < startOfDay(new Date())) return true; // Dias passados
    if (!spot.availability || spot.availability.length === 0) return true; // Sem disponibilidade definida

    const dayIsAvailable = isDayWithinAvailability(day, spot.availability);
    if (!dayIsAvailable) return true; // Fora dos slots de disponibilidade do proprietário
    
    return isDayBooked(day); // Já reservado
  };

  const handleConfirmClick = async () => {
    if (!selectedDateRange || !selectedDateRange.from) {
      toast({
        title: "Seleção Inválida",
        description: "Por favor, selecione um período no calendário.",
        variant: "destructive",
      });
      return;
    }
    // Validar se todos os dias no intervalo selecionado são realmente reserváveis
    // (embora o calendário já deva prevenir isso visualmente com `disabledDaysFunc`)
    const range = eachDayOfInterval({
        start: selectedDateRange.from,
        end: selectedDateRange.to || selectedDateRange.from,
    });

    for (const day of range) {
        if (disabledDaysFunc(day)) {
             toast({
                title: "Período Inválido",
                description: `O dia ${format(day, "PPP", { locale: ptBR})} no intervalo selecionado não está disponível.`,
                variant: "destructive",
            });
            return;
        }
    }
    
    await onConfirmReservation(spot.id, selectedDateRange);
  };

  const spotTypeTranslations: Record<ParkingSpot['type'], string> = {
    compact: 'Compacto',
    standard: 'Padrão',
    suv: 'SUV',
    motorcycle: 'Moto'
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg md:max-w-2xl lg:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Reservar Vaga: {spot.number}</DialogTitle>
          <DialogDescription>
            <span className="flex items-center"><MapPin size={16} className="mr-1" /> {spot.location} - Tipo: {spotTypeTranslations[spot.type]}</span>
            Selecione o período desejado no calendário abaixo. Apenas os dias disponíveis para esta vaga são mostrados.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-1 pr-2">
            {!spot.availability || spot.availability.length === 0 ? (
                 <Card className="my-4 border-destructive bg-destructive/10">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center">
                            <AlertTriangle className="mr-2" /> Indisponível
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-destructive-foreground">
                            O proprietário ainda não definiu os períodos de disponibilidade para esta vaga.
                        </p>
                    </CardContent>
                 </Card>
            ) : (
                <div className="flex flex-col items-center">
                     <Calendar
                        mode="range"
                        selected={selectedDateRange}
                        onSelect={setSelectedDateRange}
                        disabled={disabledDaysFunc}
                        locale={ptBR}
                        numberOfMonths={typeof window !== 'undefined' && window.innerWidth >= 768 ? 2 : 1} // 2 meses em telas maiores
                        className="rounded-md border"
                        fromDate={startOfDay(new Date())} // Não mostrar dias anteriores ao atual no início
                     />
                     {selectedDateRange?.from && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Período selecionado: {format(selectedDateRange.from, "PPP", { locale: ptBR })}
                            {selectedDateRange.to && !isEqual(startOfDay(selectedDateRange.from), startOfDay(selectedDateRange.to)) 
                                ? ` - ${format(selectedDateRange.to, "PPP", { locale: ptBR })}`
                                : ""}
                        </p>
                     )}
                </div>
            )}
        </div>

        <DialogFooter className="pt-4 border-t">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button 
            type="button" 
            onClick={handleConfirmClick} 
            disabled={isSubmitting || !selectedDateRange?.from || (!spot.availability || spot.availability.length === 0)}
            className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Reserva
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
