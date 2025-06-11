
"use client";

import type { ParkingSpot, User } from "@/types";
import { getReservationsBySpotId } from "./reservation-service"; // Importar serviço de reserva

const PARKING_SPOTS_STORAGE_KEY = "vagaLivreParkingSpots";

function saveParkingSpots(spots: ParkingSpot[]): void {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(PARKING_SPOTS_STORAGE_KEY, JSON.stringify(spots));
    } catch (error) {
      console.error("Falha ao salvar vagas no localStorage", error);
    }
  }
}

export function getParkingSpots(): ParkingSpot[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const storedSpots = localStorage.getItem(PARKING_SPOTS_STORAGE_KEY);
    if (storedSpots) {
      return JSON.parse(storedSpots).map((spot: any) => ({
        ...spot,
        availability: spot.availability?.map((slot: any) => ({
          ...slot,
          startTime: new Date(slot.startTime),
          endTime: new Date(slot.endTime),
        })),
      }));
    }
    return [];
  } catch (error) {
    console.error("Falha ao carregar vagas do localStorage", error);
    return [];
  }
}

export function addParkingSpot(
  spotData: Omit<ParkingSpot, "id" | "isAvailable" | "availability" | "currentReservationId"> & { ownerId: string; ownerName: string; }
): ParkingSpot {
  const spots = getParkingSpots();
  const newSpot: ParkingSpot = {
    id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    number: spotData.number,
    type: spotData.type,
    location: spotData.location,
    description: spotData.description,
    isAvailable: true, 
    ownerId: spotData.ownerId,
    ownerName: spotData.ownerName, 
    currentReservationId: null,
    availability: [], 
  };
  const updatedSpots = [...spots, newSpot];
  saveParkingSpots(updatedSpots);
  return newSpot;
}

export function getSpotById(spotId: string): ParkingSpot | undefined {
  const spots = getParkingSpots();
  return spots.find(spot => spot.id === spotId);
}

export function updateSpot(spotId: string, updatedData: Partial<ParkingSpot>): ParkingSpot | undefined {
  let spots = getParkingSpots();
  const spotIndex = spots.findIndex(spot => spot.id === spotId);
  if (spotIndex !== -1) {
    spots[spotIndex] = { ...spots[spotIndex], ...updatedData };
    saveParkingSpots(spots);
    return spots[spotIndex];
  }
  return undefined;
}

export async function deleteParkingSpot(spotId: string, currentUserId: string, currentUserRole: User['role']): Promise<{ success: boolean; message: string }> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simular chamada de API

  let spots = getParkingSpots();
  const spotIndex = spots.findIndex(spot => spot.id === spotId);

  if (spotIndex === -1) {
    return { success: false, message: "Vaga não encontrada." };
  }

  const spotToDelete = spots[spotIndex];

  // Verificar permissão
  if (currentUserRole !== 'manager' && spotToDelete.ownerId !== currentUserId) {
    return { success: false, message: "Você não tem permissão para excluir esta vaga." };
  }

  // Verificar reservas existentes
  const reservationsForSpot = getReservationsBySpotId(spotId);
  if (reservationsForSpot.length > 0) {
    return { success: false, message: "Esta vaga não pode ser excluída pois possui reservas associadas. Cancele as reservas primeiro." };
  }

  // Excluir a vaga
  spots.splice(spotIndex, 1);
  saveParkingSpots(spots);

  return { success: true, message: "Vaga excluída com sucesso." };
}
