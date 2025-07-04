
"use client";

import type { Reservation, ParkingSpot, AvailabilitySlot } from "@/types";
import { getSpotById } from "./parking-spot-service"; 
import { getUserById } from "./user-service"; // Importar getUserById
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
    const slotStart = startOfDay(new Date(slot.startTime)); 
    const slotEnd = endOfDay(new Date(slot.endTime));     
    
    return requestedReservationStart >= slotStart && requestedReservationEnd <= slotEnd;
  });
}

export async function addReservation(
  reservationData: Omit<Reservation, "id" | "renterName"> // renterName será adicionado aqui
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
    // Conflito se o novo período se sobrepõe a um existente
    return requestedStart <= existingEnd && requestedEnd >= existingStart;
  });

  if (hasConflict) {
    return { success: false, message: "Este período já está reservado ou entra em conflito com uma reserva existente." };
  }

  const renter = getUserById(reservationData.userId);

  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData,
    startTime: requestedStart, 
    endTime: requestedEnd,
    renterName: renter?.name, // Adiciona o nome do locatário
  };

  const allReservations = getAllReservations();
  saveReservations([...allReservations, newReservation]);

  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}

export async function cancelReservation(reservationId: string, currentUserId: string): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300)); 
  
  let allReservations = getAllReservations();
  const reservationIndex = allReservations.findIndex(res => res.id === reservationId);

  if (reservationIndex === -1) {
    return { success: false, message: "Reserva não encontrada." };
  }

  const reservationToCancel = allReservations[reservationIndex];

  if (reservationToCancel.userId !== currentUserId) {
    return { success: false, message: "Você não tem permissão para cancelar esta reserva." };
  }

  // Opcional: Verificar se a reserva já passou
  if (new Date() > new Date(reservationToCancel.endTime)) {
    // return { success: false, message: "Não é possível cancelar uma reserva que já terminou." };
  }
  
  allReservations.splice(reservationIndex, 1);
  saveReservations(allReservations);

  return { success: true, message: "Reserva cancelada com sucesso." };
}


export function isSpotFullyBooked(spot: ParkingSpot, reservationsForSpot: Reservation[]): boolean {
  if (!spot.availability || spot.availability.length === 0) {
    return false; 
  }

  const availableDaysSet = new Set<string>(); 

  spot.availability.forEach(slot => {
    const daysInSlot = eachDayOfInterval({
      start: startOfDay(new Date(slot.startTime)), 
      end: startOfDay(new Date(slot.endTime)),     
    });
    daysInSlot.forEach(day => {
      const [year, month, dayNum] = format(day, 'yyyy-MM-dd').split('-').map(Number);
      availableDaysSet.add(format(new Date(year, month - 1, dayNum), 'yyyy-MM-dd'));
    });
  });

  if (availableDaysSet.size === 0) {
    return false; 
  }

  for (const dayStr of availableDaysSet) {
    const [year, month, dayNum] = dayStr.split('-').map(Number);
    const dayToCover = startOfDay(new Date(year, month - 1, dayNum));
    
    const isDayCoveredByReservation = reservationsForSpot.some(res => {
      const resStart = startOfDay(new Date(res.startTime)); 
      const resEnd = endOfDay(new Date(res.endTime));       
      return dayToCover >= resStart && dayToCover <= resEnd;
    });

    if (!isDayCoveredByReservation) {
      return false; 
    }
  }
  return true; 
}
