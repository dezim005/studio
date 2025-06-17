
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
  ownerId?: string; 
  ownerName?: string; 
  currentReservationId?: string | null;
  availability?: AvailabilitySlot[];
  description?: string; 
}

export interface AvailabilitySlot {
  id: string;
  spotId: string;
  startTime: Date;
  endTime: Date;
  isRecurring: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly'; 
}

export interface Reservation {
  id:string;
  spotId: string;
  userId: string; 
  startTime: Date;
  endTime: Date;
  vehiclePlate?: string;
  renterName?: string; // Nome do usuário que fez a reserva
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'resident' | 'manager';
  status: 'pending' | 'approved' | 'denied'; 
  registrationDate?: string; 
  avatarUrl?: string;
  dateOfBirth?: string;
  apartment?: string;
  cpf?: string;
  phone?: string;
  description?: string;
  condominiumId?: string; 
}

