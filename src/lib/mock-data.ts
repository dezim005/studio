
import type { ParkingSpot, User, Reservation } from '@/types';

export const mockUsers: User[] = [
  { id: 'user1', name: 'Alice Smith', email: 'alice@example.com', role: 'resident', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'user2', name: 'Bob Johnson', email: 'bob@example.com', role: 'resident', avatarUrl: 'https://placehold.co/40x40.png' },
  { id: 'manager1', name: 'Carol White', email: 'carol@example.com', role: 'manager', avatarUrl: 'https://placehold.co/40x40.png' },
];

export const mockParkingSpots: ParkingSpot[] = [
  { id: 'spot1', number: 'A01', type: 'compact', location: 'Level 1, Near Elevator', isAvailable: true, ownerId: 'user1' },
  { id: 'spot2', number: 'A02', type: 'standard', location: 'Level 1, Central', isAvailable: false, ownerId: 'user2', currentReservationId: 'res1' },
  { id: 'spot3', number: 'B05', type: 'suv', location: 'Level 2, Wide Area', isAvailable: true },
  { id: 'spot4', number: 'M01', type: 'motorcycle', location: 'Level 1, Bike Rack', isAvailable: true, ownerId: 'user1' },
  { id: 'spot5', number: 'C12', type: 'standard', location: 'Level 3, Far End', isAvailable: false, currentReservationId: 'res2' },
  { id: 'spot6', number: 'A03', type: 'standard', location: 'Level 1, Near Exit', isAvailable: true },
];

export const mockReservations: Reservation[] = [
  { id: 'res1', spotId: 'spot2', userId: 'user1', startTime: new Date(Date.now() - 3600 * 1000 * 2), endTime: new Date(Date.now() + 3600 * 1000 * 3), vehiclePlate: 'ABC-1234' },
  { id: 'res2', spotId: 'spot5', userId: 'user2', startTime: new Date(Date.now() - 3600 * 1000 * 1), endTime: new Date(Date.now() + 3600 * 1000 * 5), vehiclePlate: 'XYZ-5678' },
];

export const getSpotById = (id: string): ParkingSpot | undefined => mockParkingSpots.find(spot => spot.id === id);
export const getUserById = (id: string): User | undefined => mockUsers.find(user => user.id === id);
