import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import { PAYMENT_METHODS } from './BookingCheckout';
import { formatPrice, formatDate, nightsBetween } from '../services/dates';

const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label]));

function payMethodLabel(id) {
  return METHOD_LABEL[id] || 'Pagar al llegar (Check-in)';
}

/** Filtros disponibles para el desplegable de estados. */
const STATUS_FILTERS = [
  { value: 'all', label: 'Todas' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'cancelled', label: 'Canceladas' },
];

/**
 * Vista de "Reservas realizadas" del panel de administración.
 * Tabla responsive con búsqueda por huésped/código, filtro por estado y
 * acciones rápidas para confirmar o cancelar cada reserva.
 */
export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .listAdminBookings()
      .then((data) => setBookings(data.bookings || []))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las reservas'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (id, status) => {
    setBusyId(id);
    setError('');
    try {
      await api.updateAdminBookingStatus(id, status);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar la reserva');
    } finally {
      setBusyId(null);
    }
  };

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

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
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
                      {extras.length > 0 && (
                        <span className="muted small block">
                          {extras.map((extra) => extra.name).join(', ')}
                        </span>
                      )}
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