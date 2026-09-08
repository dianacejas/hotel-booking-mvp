/**
 * Cliente de API mínimo basado en fetch nativo.
 * Todas las peticiones pasan por el proxy de Vite (/api -> http://localhost:5000)
 * en desarrollo, o al mismo origen en producción.
 */

const JSON_HEADERS = { 'Content-Type': 'application/json' };

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

/**
 * Envuelve fetch y normaliza los errores:
 *  - estado no-2xx con cuerpo JSON  -> lanza ApiError(mensaje del servidor)
 *  - estado no-2xx sin cuerpo JSON  -> lanza ApiError(mensaje genérico)
 */
async function request(path, { method = 'GET', body, token } = {}) {
  const headers = { ...JSON_HEADERS };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiError('Error de red: ¿está el servidor en marcha?', 0);
  }

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    throw new ApiError(data?.message || `La petición falló con el estado ${res.status}`, res.status);
  }
  return data;
}

const getToken = () => localStorage.getItem('hb_token');

export const api = {
  // ---- Habitaciones (público) ----------------------------------------------
  async listRooms(maxGuests) {
    const qs = maxGuests ? `?maxGuests=${Number(maxGuests)}` : '';
    return request(`/api/rooms${qs}`);
  },
  async getRoom(id) {
    return request(`/api/rooms/${id}`);
  },

  // ---- Reservas (público) ---------------------------------------------------
  async createBooking(payload) {
    return request('/api/bookings', { method: 'POST', body: payload });
  },
  async lookupBooking(referenceCode, email) {
    return request(
      `/api/bookings/lookup/${encodeURIComponent(referenceCode)}?email=${encodeURIComponent(email)}`
    );
  },

  // ---- Auth de administración ------------------------------------------------
  async login(email, password) {
    return request('/api/auth/login', { method: 'POST', body: { email, password } });
  },
  async me() {
    return request('/api/auth/me', { token: getToken() });
  },

  // ---- Habitaciones (admin) --------------------------------------------------
  async listRoomsForAdmin() {
    return request('/api/rooms/manage', { token: getToken() });
  },
  async createRoom(payload) {
    return request('/api/rooms', { method: 'POST', body: payload, token: getToken() });
  },
  async updateRoom(id, payload) {
    return request(`/api/rooms/${id}`, { method: 'PUT', body: payload, token: getToken() });
  },
  async deleteRoom(id) {
    return request(`/api/rooms/${id}`, { method: 'DELETE', token: getToken() });
  },
};

export default api;