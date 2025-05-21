
export interface Condominium {
  id: string;
  name: string;
  address: string;
}

export interface ParkingSpot {
  id: string;
  number: string;
  type: 'compact' | 'standard' | 'suv' | 'motorcycle';
  location: string;
  isAvailable: boolean;
  ownerId?: string; // ID do residente que cadastra/possui a vaga
  currentReservationId?: string | null;
  availability?: AvailabilitySlot[];
  description?: string; // Para as "Observações Adicionais"
}

export interface AvailabilitySlot {
  id: string;
  spotId: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly'; // simplified
}

export interface Reservation {
  id:string;
  spotId: string;
  userId: string; // ID of the resident reserving the spot
  startTime: Date;
  endTime: Date;
  vehiclePlate?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'resident' | 'manager';
  avatarUrl?: string;
  dateOfBirth?: string;
  apartment?: string;
  cpf?: string;
  phone?: string;
  description?: string;
  condominiumId?: string; // ID do condomínio ao qual o usuário pertence
}
