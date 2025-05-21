
"use client";

import type { Reservation, ParkingSpot, AvailabilitySlot } from "@/types";
import { getSpotById } from "./parking-spot-service"; // Assumindo que já existe

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

// Função auxiliar para verificar se um período de reserva está contido em algum slot de disponibilidade
function isWithinAvailabilitySlot(
  requestedStartTime: Date,
  requestedEndTime: Date,
  availabilitySlots: AvailabilitySlot[] | undefined
): boolean {
  if (!availabilitySlots || availabilitySlots.length === 0) {
    return false; // Não há slots, então não pode estar disponível
  }

  // Normaliza as datas da reserva para ignorar segundos/milissegundos na comparação de tempo, mas mantém a data.
  const reqStart = new Date(requestedStartTime);
  reqStart.setSeconds(0, 0);
  const reqEnd = new Date(requestedEndTime);
  reqEnd.setSeconds(0, 0);


  return availabilitySlots.some(slot => {
    const slotStart = new Date(slot.startTime);
    slotStart.setSeconds(0,0);
    const slotEnd = new Date(slot.endTime);
    slotEnd.setSeconds(0,0);

    // TODO: Adicionar lógica para recorrência se necessário.
    // Por enquanto, assume que o slot é para as datas exatas.
    // Compara as datas primeiro
    const reqStartDateOnly = new Date(reqStart.getFullYear(), reqStart.getMonth(), reqStart.getDate());
    const slotStartDateOnly = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate());
    const reqEndDateOnly = new Date(reqEnd.getFullYear(), reqEnd.getMonth(), reqEnd.getDate());
    const slotEndDateOnly = new Date(slotEnd.getFullYear(), slotEnd.getMonth(), slotEnd.getDate());

    // A reserva deve começar no mesmo dia ou depois do início do slot E terminar no mesmo dia ou antes do fim do slot
    const dateMatch = reqStartDateOnly >= slotStartDateOnly && reqEndDateOnly <= slotEndDateOnly;
    if (!dateMatch) return false;
    
    // Se as datas correspondem, verifica as horas
    // O horário de início da reserva deve ser igual ou posterior ao horário de início do slot (no mesmo dia)
    // O horário de término da reserva deve ser igual ou anterior ao horário de término do slot (no mesmo dia)
    // Esta é uma simplificação. Uma reserva pode abranger múltiplos dias de um slot.
    // Para esta simplificação, vamos assumir que a reserva é dentro de um único dia contido no slot.

    // Para reservas que abrangem o mesmo dia:
    if (reqStartDateOnly.getTime() === slotStartDateOnly.getTime() && reqEndDateOnly.getTime() === slotEndDateOnly.getTime()) {
      return reqStart.getTime() >= slotStart.getTime() && reqEnd.getTime() <= slotEnd.getTime();
    }
    // Para reservas que começam no dia de início do slot mas terminam antes do fim do slot
    if (reqStartDateOnly.getTime() === slotStartDateOnly.getTime() && reqEndDateOnly < slotEndDateOnly) {
         return reqStart.getTime() >= slotStart.getTime(); // Início deve ser válido
    }
    // Para reservas que começam depois do início do slot mas terminam no dia de fim do slot
    if (reqStartDateOnly > slotStartDateOnly && reqEndDateOnly.getTime() === slotEndDateOnly.getTime()) {
        return reqEnd.getTime() <= slotEnd.getTime(); // Fim deve ser válido
    }
    // Para reservas que estão completamente entre o início e o fim do slot (multi-dias)
    if (reqStartDateOnly > slotStartDateOnly && reqEndDateOnly < slotEndDateOnly) {
        return true; // Totalmente contido
    }
    
    // Casos mais complexos de multi-dias com horários específicos precisariam de lógica mais detalhada
    // Por ora, se a data está no range do slot, vamos considerar o horário válido se startTime e endTime do slot são 00:00 e 23:59 (dia inteiro)
    // ou se a lógica acima cobrir.
    // Esta é uma área que pode precisar de refinamento para slots com horários específicos em dias diferentes.

    // Simplificação: se o slot é para o dia inteiro (00:00 a 23:59), e a data da reserva está dentro, é valido.
    // Esta lógica é uma simplificação e pode não cobrir todos os cenários de slots de disponibilidade complexos.
    // O ideal é que o `AvailabilitySlot` defina um range de datas E um range de horas dentro desses dias.
    // Se a reserva está dentro do range de datas do slot e os horários de início/fim do slot abrangem o dia inteiro.
    const slotStartsAtMidnight = slotStart.getHours() === 0 && slotStart.getMinutes() === 0;
    const slotEndsAtAlmostMidnight = slotEnd.getHours() === 23 && slotEnd.getMinutes() === 59;

    if (slotStartsAtMidnight && slotEndsAtAlmostMidnight) {
        return reqStart >= slotStart && reqEnd <= slotEnd;
    }
    
    // Se não é dia inteiro, a lógica anterior de mesmo dia é a mais precisa.
    // Se a reserva é de um dia apenas e está dentro do slot.
    if(reqStart.toDateString() === reqEnd.toDateString() && reqStart.toDateString() === slotStart.toDateString() && reqEnd.toDateString() === slotEnd.toDateString()){
        return reqStart >= slotStart && reqEnd <= slotEnd;
    }


    return false; // Default: não encontrou um slot compatível com esta lógica simplificada
  });
}


export async function addReservation(
  reservationData: Omit<Reservation, 'id'>
): Promise<{success: boolean, message: string, reservation?: Reservation}> {
  await new Promise(resolve => setTimeout(resolve, 300)); // Simular delay

  const spot = getSpotById(reservationData.spotId);

  if (!spot) {
    return { success: false, message: "Vaga não encontrada." };
  }

  if (!spot.availability || spot.availability.length === 0) {
    return { success: false, message: "Esta vaga não possui horários de disponibilidade cadastrados." };
  }
  
  // Garante que startTime e endTime são objetos Date válidos
  const requestedStartTime = new Date(reservationData.startTime);
  const requestedEndTime = new Date(reservationData.endTime);

  if (isNaN(requestedStartTime.getTime()) || isNaN(requestedEndTime.getTime())) {
    return { success: false, message: "Datas da reserva inválidas." };
  }
   if (requestedEndTime <= requestedStartTime) {
    return { success: false, message: "A data final da reserva deve ser posterior à data inicial." };
  }


  // 1. Verificar se o período da reserva está dentro de algum AvailabilitySlot da vaga
  if (!isWithinAvailabilitySlot(requestedStartTime, requestedEndTime, spot.availability)) {
    return { success: false, message: "O período solicitado não está disponível nos horários cadastrados para esta vaga." };
  }

  // 2. Verificar conflitos com reservas existentes para esta vaga
  const existingReservationsForSpot = getReservationsBySpotId(reservationData.spotId);
  const conflict = existingReservationsForSpot.some(existingRes => {
    const existingStartTime = new Date(existingRes.startTime);
    const existingEndTime = new Date(existingRes.endTime);
    // Conflito se: novo início < fim existente E novo fim > início existente
    return requestedStartTime < existingEndTime && requestedEndTime > existingStartTime;
  });

  if (conflict) {
    return { success: false, message: "Este período já está reservado para esta vaga." };
  }

  // Se passou em todas as verificações, cria e salva a reserva
  const allReservations = getAllReservations();
  const newReservation: Reservation = {
    id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...reservationData,
    startTime: requestedStartTime, // Garante que são objetos Date
    endTime: requestedEndTime,
  };

  saveReservations([...allReservations, newReservation]);
  return { success: true, message: "Vaga reservada com sucesso!", reservation: newReservation };
}
