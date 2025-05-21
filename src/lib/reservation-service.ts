
"use client";

import type { Reservation, ParkingSpot, AvailabilitySlot } from "@/types";
import { getSpotById } from "./parking-spot-service"; 
import { startOfDay, endOfDay } from "date-fns";

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

function isWithinAvailabilitySlot(
  requestedReservationStart: Date, // Espera-se startOfDay
  requestedReservationEnd: Date,   // Espera-se endOfDay
  availabilitySlots: AvailabilitySlot[] | undefined
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return false; 
  }

  return availabilitySlots.some(slot => {
    const slotStart = new Date(slot.startTime); // Hora exata do slot
    const slotEnd = new Date(slot.endTime);     // Hora exata do slot

    // O slot de disponibilidade deve cobrir completamente o período da reserva (dias inteiros).
    return slotStart <= requestedReservationStart && slotEnd >= requestedReservationEnd;
  });
}


export async function addReservation(
  reservationData: Omit<Reservation, 'id'>
): Promise<{success: boolean, message: string, reservation?: Reservation}> {
  await new Promise(resolve => setTimeout(resolve, 300)); 

  const spot = getSpotById(reservationData.spotId);

  if (!spot) {
    return { success: false, message: "Vaga não encontrada." };
  }

  if (!spot.availability || spot.availability.length === 0) {
    return { success: false, message: "Esta vaga não possui horários de disponibilidade cadastrados." };
  }
  
  // As datas da reserva já devem vir como startOfDay e endOfDay do AvailableSpotsList
  const requestedStartTime = new Date(reservationData.startTime);
  const requestedEndTime = new Date(reservationData.endTime);

  if (isNaN(requestedStartTime.getTime()) || isNaN(requestedEndTime.getTime())) {
    return { success: false, message: "Datas da reserva inválidas." };
  }
   if (requestedEndTime < requestedStartTime) { // Deve ser <= para um único dia, mas o endOfDay já cuida disso
    return { success: false, message: "A data final da reserva deve ser posterior ou igual à data inicial." };
  }

  if (!isWithinAvailabilitySlot(requestedStartTime, requestedEndTime, spot.availability)) {
    return { success: false, message: "O período solicitado não está disponível nos horários cadastrados para esta vaga. O slot de disponibilidade deve cobrir o dia inteiro." };
  }

  const existingReservationsForSpot = getReservationsBySpotId(reservationData.spotId);
  const conflict = existingReservationsForSpot.some(existingRes => {
    const existingStartTime = new Date(existingRes.startTime);
    const existingEndTime = new Date(existingRes.endTime);
    return requestedStartTime < existingEndTime && requestedEndTime > existingStartTime;
  });

  if (conflict) {
    return { success: false, message: "Este período já está reservado para esta vaga." };
  }

  const allReservations = getAllReservations();
  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData, // startTime e endTime aqui já são os objetos Date corretos
  };

  saveReservations([...allReservations, newReservation]);
  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}
