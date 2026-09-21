import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Room } from '../types';
import api from '../services/api';

/**
 * Hooks de TanStack Query para el catálogo de habitaciones.
 * Centraliza las claves de caché, la carga inicial y la invalidación:
 * cualquier mutación que afecte a habitaciones (alta, edición, reserva)
 * invalida la raíz `['rooms']` y refresca todas las vistas a la vez.
 */

export const roomsKeys = {
  all: ['rooms'] as const,
  list: (params: { maxGuests?: string | number | null; checkIn?: string | null; checkOut?: string | null }) =>
    ['rooms', 'list', params] as const,
  detail: (id: string) => ['rooms', 'detail', id] as const,
  admin: ['rooms', 'admin'] as const,
};

export type RoomsQueryParams = {
  maxGuests?: string | number | null;
  checkIn?: string | null;
  checkOut?: string | null;
};

/** Catálogo público de habitaciones activas, con filtros opcionales. */
export function useRoomsQuery(params: RoomsQueryParams = {}) {
  return useQuery({
    queryKey: roomsKeys.list(params),
    queryFn: () => api.listRooms(params),
    select: (data) => data.rooms,
  });
}

/** Detalle de una única habitación pública. */
export function useRoomQuery(id: string | undefined | null) {
  return useQuery({
    queryKey: roomsKeys.detail(id ?? ''),
    queryFn: () => api.getRoom(id as string),
    select: (data) => data.room,
    enabled: Boolean(id),
  });
}

/** Habitaciones del panel admin (incluye las inactivas). */
export function useAdminRoomsQuery() {
  return useQuery({
    queryKey: roomsKeys.admin,
    queryFn: () => api.listRoomsForAdmin(),
    select: (data) => data.rooms ?? [],
  });
}

/** Alta de una habitación nueva desde el panel admin. */
export function useCreateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Room>) => api.createRoom(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}

/**
 * PATCH /api/admin/habitaciones/:id.
 * Al guardar se actualiza la habitación en la caché al instante (sin recarga)
 * y se invalidan las consultas de habitaciones para refrescar el catálogo.
 */
export function useUpdateRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Room> }) =>
      api.updateRoomAdmin(id, payload),
    onSuccess: (data) => {
      queryClient.setQueryData<Room[]>(roomsKeys.admin, (current = []) =>
        current.map((room) => (room._id === data.room._id ? data.room : room))
      );
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}