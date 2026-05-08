export interface Booking {
  id: number;
  code: string;
  serviceId: number;
  zoneId: number;
  destinationId: number;
  tripType: 'one_way' | 'round_trip';
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  vehicleId: number;
  passengerName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone: string | null;
  passengerNotes: string | null;
  flightNumber: string | null;
  airline: string | null;
  departureDate: string | null;
  departureTime: string | null;
  paymentMethod: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  price: string;
  tax: string;
  total: string;
  createdAt: Date;
}

export interface Service {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface Vehicle {
  id: string;
  name: string;
  image: string;
  capacityMin: number;
  capacityMax: number;
  features: string[];
  price: string;
}

export interface Zone {
  id: number;
  name: string;
  active: boolean;
}

export interface Destination {
  id: number;
  name: string;
  zoneId: number;
  active: boolean;
}

export interface BookingData {
  tripType: 'one_way' | 'round_trip' | null;
  serviceId: string | null;
  destinationId: string | null;
  origin: string;
  date: string;
  time: string;
  passengers: number;
  vehicleId: string | null;
  passengerName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerNotes: string;
  selectedOptionalServices: number[];
  luggage: 'standard' | 'oversized' | 'extra';
  paymentOption: 'full' | 'deposit';
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureTime: string;
  paymentMethod: 'card' | 'paypal' | 'cash';
}

export interface BookingStep {
  id: number;
  label: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'inactive';
  widgetConfig: WidgetConfig;
}

export interface WidgetConfig {
  clientId: string;
  primaryColor: string;
  services: string[];
  vehicles: string[];
  paymentMethods: string[];
  theme: 'light' | 'dark';
}

export interface Reservation {
  id: string;
  code: string;
  clientName: string;
  clientEmail: string;
  service: string;
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  vehicle: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}
