
"use client";

import type { Reservation, ParkingSpot, AvailabilitySlot } from "@/types";
import { getSpotById } from "./parking-spot-service"; 
import { startOfDay, endOfDay, isEqual } from "date-fns"; // Adicionado isEqual

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
        startTime: new Date(res.startTime), // Já devem ser startOfDay
        endTime: new Date(res.endTime),     // Já devem ser endOfDay
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

// Verifica se o período de reserva solicitado (dias inteiros) está completamente contido
// dentro de um dos slots de disponibilidade (que agora também representam dias inteiros).
function isWithinAvailabilitySlot(
  requestedReservationStart: Date, // startOfDay do primeiro dia da reserva
  requestedReservationEnd: Date,   // endOfDay do último dia da reserva
  availabilitySlots: AvailabilitySlot[] | undefined
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return false; 
  }

  return availabilitySlots.some(slot => {
    // startTime e endTime do slot já são startOfDay e endOfDay do período de disponibilidade
    const slotStart = new Date(slot.startTime); 
    const slotEnd = new Date(slot.endTime);     

    // A disponibilidade do slot deve cobrir completamente o período da reserva.
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
    return { success: false, message: "Esta vaga não possui dias de disponibilidade cadastrados." };
  }
  
  // As datas da reserva já vêm como startOfDay e endOfDay do SpotReservationDialog/AvailableSpotsList
  const requestedStartTime = new Date(reservationData.startTime);
  const requestedEndTime = new Date(reservationData.endTime);

  if (isNaN(requestedStartTime.getTime()) || isNaN(requestedEndTime.getTime())) {
    return { success: false, message: "Datas da reserva inválidas." };
  }
   // Para reserva de um único dia, startTime (startOfDay) será menor que endTime (endOfDay)
   // Para múltiplos dias, startTime será menor. Se forem iguais, algo está errado, mas a UI deve prevenir.
   if (requestedEndTime < requestedStartTime) { 
    return { success: false, message: "A data final da reserva deve ser posterior ou igual à data inicial." };
  }

  if (!isWithinAvailabilitySlot(requestedStartTime, requestedEndTime, spot.availability)) {
    return { success: false, message: "O período solicitado não está disponível nos dias cadastrados para esta vaga." };
  }

  const existingReservationsForSpot = getReservationsBySpotId(reservationData.spotId);
  const conflict = existingReservationsForSpot.some(existingRes => {
    const existingStartTime = new Date(existingRes.startTime); // é startOfDay
    const existingEndTime = new Date(existingRes.endTime);     // é endOfDay
    // Conflito se os intervalos de dias se sobrepõem
    return requestedStartTime <= existingEndTime && requestedEndTime >= existingStartTime;
  });

  if (conflict) {
    return { success: false, message: "Este período (ou parte dele) já está reservado para esta vaga." };
  }

  const allReservations = getAllReservations();
  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData, 
  };

  saveReservations([...allReservations, newReservation]);
  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}

    