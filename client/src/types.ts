/**
 * Tipos compartidos del frontend para los modelos centrales del dominio.
 * Estos contratos reflejan la forma que devuelve la API de Express/Mongoose.
 */

/** Formas de pago ofrecidas en el checkout. 'mercadopago' abre Checkout Pro. */
export type PaymentMethodId = 'tarjeta' | 'transferencia' | 'checkin' | 'mercadopago';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

/** Tipo del servicio adicional ("por noche" o "única vez"). */
export type ExtraOptionType = 'perNight' | 'oneTime';

/** Catálogo de servicios adicionales vendidos en el checkout. */
export interface ExtraOption {
  id: string;
  name: string;
  price: number;
  type: ExtraOptionType;
  desc?: string;
  /** Importe TOTAL del extra (los por-noche ya vienen multiplicados por noches). */
  total?: number;
}

/** Habitación/unidad reservable del alojamiento. */
export interface Room {
  _id: string;
  number?: string;
  name: string;
  description?: string;
  capacity: number;
  pricePerNight: number;
  amenities?: string[];
  imageUrl?: string;
  active?: boolean;
}

/** Datos del huésped titular de una reserva. */
export interface Guest {
  fullName: string;
  email: string;
  phone: string;
}

/** Servicio adicional ya contratado (persistido en la reserva). */
export interface BookingExtra {
  name: string;
  price: number;
}

/** Reserva tal como la devuelve la API (fechas como cadenas ISO/String). */
export interface Booking {
  _id: string;
  referenceCode: string;
  room?: Pick<Room, '_id' | 'name' | 'number' | 'imageUrl' | 'pricePerNight'> | null;
  guest: Guest;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  extrasSeleccionados?: BookingExtra[];
  metodoPago: PaymentMethodId;
  status: BookingStatus;
  createdAt?: string;
  updatedAt?: string;
}

/** Identidad del administrador autenticado. */
export interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
}

/** Payload mínimo para crear una reserva. */
export interface CreateBookingPayload {
  room: string;
  guest: Guest;
  checkIn: string;
  checkOut: string;
  extrasSeleccionados: BookingExtra[];
  metodoPago: PaymentMethodId;
  origin?: string;
}

/** Preferencia de Checkout Pro creada en el backend (modo sandbox/test). */
export interface MpPreference {
  preferenceId?: string;
  initPoint?: string;
  total: number;
}

/** Fechas elegidas en el buscador del hero y pre-cargadas en las tarjetas. */
export interface SearchDates {
  checkIn: string;
  checkOut: string;
}

/** Resultado del buscador del hero (incluye la cantidad de huéspedes). */
export interface SearchSubmit {
  checkIn: string;
  checkOut: string;
  guests: string;
}