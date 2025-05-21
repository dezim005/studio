
"use client";

import type { ParkingSpot } from "@/types";

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
      // Precisamos desserializar as datas que foram armazenadas como strings
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
  spotData: Omit<ParkingSpot, "id" | "isAvailable" | "availability" | "currentReservationId"> & { ownerId: string }
): ParkingSpot {
  const spots = getParkingSpots();
  const newSpot: ParkingSpot = {
    id: `spot-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    number: spotData.number,
    type: spotData.type,
    location: spotData.location,
    description: spotData.description,
    isAvailable: true, // Vagas novas são disponíveis por padrão
    ownerId: spotData.ownerId,
    currentReservationId: null,
    availability: [], // Disponibilidade vazia por padrão
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
