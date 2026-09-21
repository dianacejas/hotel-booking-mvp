import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Booking, BookingStatus, CreateBookingPayload } from '../types';
import api from '../services/api';
import { roomsKeys } from './useRooms';

/**
 * Hooks de TanStack Query para el ciclo de vida de las reservas.
 * Las claves `['bookings']` separan la vista pública de la de administración;
 * al crear/actualizar una reserva también se invalidan las habitaciones,
 * porque su disponibilidad depende de las ocupaciones existentes.
 */

export const bookingsKeys = {
  all: ['bookings'] as const,
  admin: ['bookings', 'admin'] as const,
};

/** Todas las reservas para el panel de administración. */
export function useAdminBookingsQuery() {
  return useQuery({
    queryKey: bookingsKeys.admin,
    queryFn: () => api.listAdminBookings(),
    select: (data) => data.bookings ?? [],
  });
}

/**
 * POST /api/bookings (público).
 * Al confirmar una reserva se invalida el catálogo de habitaciones para que
 * las fechas ocupadas dejen de ofrecerse en cuanto se recargue la vista.
 */
export function useCreateBookingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBookingPayload) => api.createBooking(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
      queryClient.invalidateQueries({ queryKey: bookingsKeys.admin });
    },
  });
}

/**
 * PATCH /api/admin/reservas/:id.
 * Actualiza el estado (confirmar / reactivar / cancelar) e invalida tanto la
 * lista de reservas del panel como la disponibilidad de las habitaciones.
 */
export function useUpdateBookingStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus | string }) =>
      api.updateAdminBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingsKeys.admin });
      queryClient.invalidateQueries({ queryKey: roomsKeys.all });
    },
  });
}

export type { Booking };