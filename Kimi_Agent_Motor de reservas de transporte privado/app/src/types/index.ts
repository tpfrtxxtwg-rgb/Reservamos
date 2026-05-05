export interface Booking {
  id: number;
  code: string;
  serviceId: number;
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
