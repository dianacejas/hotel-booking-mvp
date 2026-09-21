import { useMemo, useState } from 'react';
import { ApiError } from '../services/api';
import Alert from './Alert';
import StatusBadge from './StatusBadge';
import { payMethodLabel } from './CheckoutModal';
import { formatPrice, formatDate, nightsBetween } from '../services/dates';
import { useAdminBookingsQuery, useUpdateBookingStatusMutation } from '../hooks/useBookings';

/** Filtros disponibles para el desplegable de estados. */
const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'cancelled', label: 'Canceladas' },
];

/**
 * Vista de "Reservas realizadas" del panel de administración.
 * Los datos vienen de TanStack Query (useAdminBookingsQuery); las acciones de
 * confirmar / reactivar / cancelar usan useUpdateBookingStatusMutation, que
 * invalida la caché al terminar para que la tabla se refresque sola.
 */
export default function AdminBookings() {
  const bookingsQuery = useAdminBookingsQuery();
  const statusMutation = useUpdateBookingStatusMutation();
  const bookings = bookingsQuery.data ?? [];

  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const changeStatus = (id: string, status: string) => {
    setError('');
    statusMutation.mutate(
      { id, status },
      {
        onError: (err) =>
          setError(err instanceof ApiError ? err.message : 'No se pudo actualizar la reserva'),
      }
    );
  };

  // Deshabilita las acciones solo de la fila cuya reserva se está actualizando.
  const busyId = statusMutation.isPending ? statusMutation.variables?.id : null;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      if (!matchStatus) return false;
      if (!normalized) return true;
      return (
        b.guest?.fullName?.toLowerCase().includes(normalized) ||
        b.referenceCode?.toLowerCase().includes(normalized)
      );
    });
  }, [bookings, query, statusFilter]);

  const queryError = bookingsQuery.isError
    ? bookingsQuery.error instanceof ApiError
      ? bookingsQuery.error.message
      : 'No se pudieron cargar las reservas'
    : '';

  return (
    <div className="admin-bookings">
      <div className="admin-bookings-head">
        <div className="filter-row">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por huésped o código RES-…"
            aria-label="Buscar reservas"
            className="bookings-search"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filtrar por estado"
            className="bookings-status-filter"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <p className="muted small">
          {filtered.length} de {bookings.length} reservas
        </p>
      </div>

      {(queryError || error) && <Alert type="error">{queryError || error}</Alert>}

      {bookingsQuery.isPending ? (
        <p className="muted">Cargando reservas…</p>
      ) : filtered.length === 0 ? (
        <Alert type="info">No hay reservas que coincidan con la búsqueda o el filtro.</Alert>
      ) : (
        <div className="table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Huésped</th>
                <th>Habitación</th>
                <th>Fechas</th>
                <th>Pago</th>
                <th>Estado</th>
                <th className="th-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((booking) => {
                const nights = nightsBetween(booking.checkIn, booking.checkOut);
                const extras = booking.extrasSeleccionados || [];
                const busy = busyId === booking._id;
                const isCancelled = booking.status === 'cancelled';
                return (
                  <tr key={booking._id} className={isCancelled ? 'row-cancelled' : ''}>
                    <td className="nowrap">
                      <strong className="mono">{booking.referenceCode}</strong>
                    </td>
                    <td>
                      <strong>{booking.guest?.fullName}</strong>
                      <span className="muted small block">{booking.guest?.email}</span>
                      <span className="muted small block">{booking.guest?.phone}</span>
                    </td>
                    <td>
                      {booking.room?.number && (
                        <span className="tag">N° {booking.room.number}</span>
                      )}{' '}
                      {booking.room?.name || '—'}
                    </td>
                    <td className="nowrap">
                      {formatDate(booking.checkIn)}
                      <br />
                      <span className="muted small">
                        → {formatDate(booking.checkOut)} · {nights} noche{nights > 1 ? 's' : ''}
                      </span>
                    </td>
                    <td>
                      <strong>{formatPrice(booking.totalPrice)}</strong>
                      <span className="muted small block">{payMethodLabel(booking.metodoPago)}</span>
                      <span className="muted small block">
                        {extras.length > 0 ? extras.map((extra) => extra.name).join(', ') : 'Sin extras'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="td-actions">
                      {booking.status === 'pending' && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={busy}
                          onClick={() => changeStatus(booking._id, 'confirmed')}
                          title="Confirmar reserva"
                        >
                          Confirmar
                        </button>
                      )}
                      {isCancelled && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => changeStatus(booking._id, 'confirmed')}
                          title="Reactivar reserva"
                        >
                          Reactivar
                        </button>
                      )}
                      {!isCancelled && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busy}
                          onClick={() => changeStatus(booking._id, 'cancelled')}
                          title="Cancelar reserva y liberar fechas"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}