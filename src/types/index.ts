export interface Service {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface Vehicle {
  id: string;
  name: string;
  image: string;
  capacity: string;
  minPassengers: number;
  maxPassengers: number;
  features: string[];
  basePrice: number;
}

export interface BookingData {
  serviceId: string | null;
  origin: string;
  destination: string;
  date: string;
  time: string;
  passengers: number;
  vehicleId: string | null;
  passengerName: string;
  passengerLastName: string;
  passengerEmail: string;
  passengerPhone: string;
  passengerNotes: string;
<<<<<<< HEAD
=======
  selectedOptionalServices: number[];
  luggage: 'standard' | 'oversized' | 'extra';
  paymentOption: 'full' | 'deposit';
  flightNumber: string;
  airline: string;
  departureDate: string;
  departureTime: string;
  departureAirline: string;
  departureFlightNumber: string;
  hotelPickupTime: string;
>>>>>>> 6688a34e810e9ce150c1cc87b0709d5780c1b305
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
