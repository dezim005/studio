
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
  requestedReservationStart: Date, // Deve ser startOfDay
  requestedReservationEnd: Date,   // Deve ser endOfDay
  availabilitySlots: AvailabilitySlot[]
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return false;
  }
  return availabilitySlots.some(slot => {
    const slotStart = startOfDay(new Date(slot.startTime)); // Slot startTime é startOfDay
    const slotEnd = endOfDay(new Date(slot.endTime));     // Slot endTime é endOfDay
    
    return requestedReservationStart >= slotStart && requestedReservationEnd <= slotEnd;
  });
}

export async function addReservation(
  reservationData: Omit<Reservation, "id">
): Promise<{ success: boolean; message: string; reservation?: Reservation }> {
  await new Promise(resolve => setTimeout(resolve, 300)); 

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
    return requestedStart <= existingEnd && requestedEnd >= existingStart; // Corrected conflict logic
  });

  if (hasConflict) {
    return { success: false, message: "Este período já está reservado ou entra em conflito com uma reserva existente." };
  }

  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData,
    startTime: requestedStart, 
    endTime: requestedEnd,     
  };

  const allReservations = getAllReservations();
  saveReservations([...allReservations, newReservation]);

  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}

export function isSpotFullyBooked(spot: ParkingSpot, reservationsForSpot: Reservation[]): boolean {
  if (!spot.availability || spot.availability.length === 0) {
    return false; 
  }

  const availableDaysSet = new Set<string>(); 

  spot.availability.forEach(slot => {
    const daysInSlot = eachDayOfInterval({
      start: startOfDay(new Date(slot.startTime)), // startTime do slot é startOfDay
      end: startOfDay(new Date(slot.endTime)),     // endTime do slot é endOfDay, então usamos startOfDay aqui para eachDayOfInterval
    });
    daysInSlot.forEach(day => {
      availableDaysSet.add(format(day, 'yyyy-MM-dd'));
    });
  });

  if (availableDaysSet.size === 0) {
    return false; 
  }

  for (const dayStr of availableDaysSet) {
    // Robust date reconstruction from yyyy-MM-dd string
    const [year, month, dayNum] = dayStr.split('-').map(Number);
    const dayToCover = startOfDay(new Date(year, month - 1, dayNum));
    
    const isDayCoveredByReservation = reservationsForSpot.some(res => {
      const resStart = startOfDay(new Date(res.startTime)); // Reservation startTime é startOfDay
      const resEnd = endOfDay(new Date(res.endTime));       // Reservation endTime é endOfDay
      return dayToCover >= resStart && dayToCover <= resEnd;
    });

    if (!isDayCoveredByReservation) {
      return false; 
    }
  }
  return true; 
}
