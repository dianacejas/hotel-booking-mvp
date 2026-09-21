import type {
  Booking,
  CreateBookingPayload,
  MpPreference,
  Room,
  User,
} from '../types';

/**
 * Cliente de API mínimo basado en fetch nativo.
 * Todas las peticiones pasan por el proxy de Vite (/api -> http://localhost:5000)
 * en desarrollo, o al mismo origen en producción.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { ...JSON_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError('Error de red: ¿está el servidor en marcha?', 0);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      data && typeof data.message === 'string'
        ? data.message
        : `La petición falló con el estado ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

const getToken = (): string | null => localStorage.getItem('hb_token');

export const api = {
  // ---- Habitaciones (público) ----------------------------------------------
  listRooms(params?: {
    maxGuests?: string | number | null;
    checkIn?: string | null;
    checkOut?: string | null;
  }): Promise<{ rooms: Room[] }> {
    const qs = new URLSearchParams();
    if (params?.maxGuests) qs.set('maxGuests', String(params.maxGuests));
    if (params?.checkIn) qs.set('checkIn', params.checkIn);
    if (params?.checkOut) qs.set('checkOut', params.checkOut);
    const query = qs.toString();
    return request(`/api/rooms${query ? `?${query}` : ''}`);
  },
  getRoom(id: string): Promise<{ room: Room }> {
    return request(`/api/rooms/${id}`);
  },

  // ---- Reservas (público) ---------------------------------------------------
  createBooking(payload: CreateBookingPayload): Promise<{ booking: Booking; message?: string }> {
    return request('/api/bookings', { method: 'POST', body: payload });
  },
  lookupBooking(referenceCode: string, email: string): Promise<{ booking: Booking }> {
    return request(
      `/api/bookings/lookup/${encodeURIComponent(referenceCode)}?email=${encodeURIComponent(email)}`
    );
  },

  // ---- Pagos (Mercado Pago sandbox) ------------------------------------------
  createMpPreference(payload: CreateBookingPayload): Promise<MpPreference> {
    return request('/api/pagos/crear-preferencia', { method: 'POST', body: payload });
  },

  // ---- Reservas (admin) ------------------------------------------------------
  listAdminBookings(): Promise<{ bookings: Booking[] }> {
    return request('/api/admin/reservas', { token: getToken() });
  },
  updateAdminBookingStatus(id: string, status: string): Promise<{ booking: Booking }> {
    return request(`/api/admin/reservas/${id}`, {
      method: 'PATCH',
      body: { status },
      token: getToken(),
    });
  },

  // ---- Auth de administración ------------------------------------------------
  login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  me(): Promise<{ user: User }> {
    return request('/api/auth/me', { token: getToken() });
  },

  // ---- Habitaciones (admin) --------------------------------------------------
  listRoomsForAdmin(): Promise<{ rooms: Room[] }> {
    return request('/api/rooms/manage', { token: getToken() });
  },
  createRoom(payload: Partial<Room>): Promise<{ room: Room }> {
    return request('/api/rooms', { method: 'POST', body: payload, token: getToken() });
  },
  updateRoomAdmin(id: string, payload: Partial<Room>): Promise<{ room: Room }> {
    return request(`/api/admin/habitaciones/${id}`, {
      method: 'PATCH',
      body: payload,
      token: getToken(),
    });
  },
  deleteRoom(id: string): Promise<{ message: string; roomId: string }> {
    return request(`/api/rooms/${id}`, { method: 'DELETE', token: getToken() });
  },
};

export default api;