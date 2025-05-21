
"use client";

import type { Reservation, ParkingSpot, AvailabilitySlot } from "@/types";
import { getSpotById } from "./parking-spot-service"; 
import { startOfDay, endOfDay, isEqual, eachDayOfInterval, isWithinInterval, format } from "date-fns";

const RESERVATIONS_STORAGE_KEY = "vagaLivreReservations";

function saveReservations(reservations: Reservation[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(RESERVATIONS_STORAGE_KEY, JSON.stringify(reservations));
    } catch (error) {
      console.error("Falha ao salvar reservas no localStorage", error);
    }
  }
}

export function getAllReservations(): Reservation[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const storedReservations = localStorage.getItem(RESERVATIONS_STORAGE_KEY);
    if (storedReservations) {
      return JSON.parse(storedReservations).map((res: any) => ({
        ...res,
        startTime: new Date(res.startTime), 
        endTime: new Date(res.endTime),     
      }));
    }
    return [];
  } catch (error) {
    console.error("Falha ao carregar reservas do localStorage", error);
    return [];
  }
}

export function getReservationsBySpotId(spotId: string): Reservation[] {
  const allReservations = getAllReservations();
  return allReservations.filter(res => res.spotId === spotId);
}

// Helper function para verificar se a reserva está dentro de um slot de disponibilidade
function isWithinAvailabilitySlot(
  requestedReservationStart: Date,
  requestedReservationEnd: Date,
  availabilitySlots: AvailabilitySlot[]
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return false;
  }
  // Para reservas baseadas em dia, requestedReservationStart é startOfDay e requestedReservationEnd é endOfDay
  return availabilitySlots.some(slot => {
    const slotStart = startOfDay(new Date(slot.startTime));
    const slotEnd = endOfDay(new Date(slot.endTime)); // Assumindo que slot.endTime já é o fim do último dia
    
    // O período da reserva solicitada deve estar inteiramente contido em um slot de disponibilidade.
    return requestedReservationStart >= slotStart && requestedReservationEnd <= slotEnd;
  });
}

export async function addReservation(
  reservationData: Omit<Reservation, "id">
): Promise<{ success: boolean; message: string; reservation?: Reservation }> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay

  const spot = getSpotById(reservationData.spotId);
  if (!spot) {
    return { success: false, message: "Vaga não encontrada." };
  }

  if (!spot.availability || spot.availability.length === 0) {
    return { success: false, message: "Esta vaga não tem horários de disponibilidade definidos pelo proprietário." };
  }

  const requestedStart = startOfDay(new Date(reservationData.startTime));
  const requestedEnd = endOfDay(new Date(reservationData.endTime));

  if (requestedEnd < requestedStart) {
    return { success: false, message: "A data final da reserva não pode ser anterior à data inicial." };
  }
  
  if (!isWithinAvailabilitySlot(requestedStart, requestedEnd, spot.availability)) {
    return { success: false, message: "O período selecionado não está disponível conforme definido pelo proprietário." };
  }

  const existingReservationsForSpot = getReservationsBySpotId(reservationData.spotId);
  const hasConflict = existingReservationsForSpot.some(existingRes => {
    const existingStart = startOfDay(new Date(existingRes.startTime));
    const existingEnd = endOfDay(new Date(existingRes.endTime));
    // Conflito se: newStart < existingEnd AND newEnd > existingStart
    return requestedStart < existingEnd && requestedEnd > existingStart;
  });

  if (hasConflict) {
    return { success: false, message: "Este período já está reservado ou entra em conflito com uma reserva existente." };
  }

  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData,
    startTime: requestedStart, // Garantir que estamos salvando startOfDay
    endTime: requestedEnd,     // Garantir que estamos salvando endOfDay
  };

  const allReservations = getAllReservations();
  saveReservations([...allReservations, newReservation]);

  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}

export function isSpotFullyBooked(spot: ParkingSpot, reservationsForSpot: Reservation[]): boolean {
  if (!spot.availability || spot.availability.length === 0) {
    return false; // Não pode estar totalmente reservada se não há disponibilidade definida
  }

  const availableDaysSet = new Set<string>(); // Armazena os dias como strings 'yyyy-MM-dd'

  spot.availability.forEach(slot => {
    const daysInSlot = eachDayOfInterval({
      start: startOfDay(new Date(slot.startTime)),
      end: startOfDay(new Date(slot.endTime)), // eachDayOfInterval é inclusivo
    });
    daysInSlot.forEach(day => {
      availableDaysSet.add(format(day, 'yyyy-MM-dd'));
    });
  });

  if (availableDaysSet.size === 0) {
    return false; // Nenhum dia efetivamente disponível
  }

  for (const dayStr of availableDaysSet) {
    const dayToCover = startOfDay(new Date(dayStr)); 
    const isDayCoveredByReservation = reservationsForSpot.some(res => {
      const resStart = startOfDay(new Date(res.startTime));
      const resEnd = endOfDay(new Date(res.endTime)); // Usar endOfDay para a comparação de intervalo
      // Verifica se dayToCover está dentro do intervalo [resStart, resEnd]
      return dayToCover >= resStart && dayToCover <= resEnd;
    });

    if (!isDayCoveredByReservation) {
      return false; // Encontrou um dia disponível que não está reservado
    }
  }
  return true; // Todos os dias disponíveis estão cobertos por reservas
}
