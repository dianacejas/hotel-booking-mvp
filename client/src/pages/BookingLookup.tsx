import { useState } from 'react';
import type { Booking } from '../types';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';
import { payMethodLabel } from '../components/CheckoutModal';
import { formatPrice, formatDate, nightsBetween } from '../services/dates';

/**
 * Consulta pública de reservas.
 * Los huéspedes recuperan su reserva mediante el código de referencia
 * (RES-XXXXX) y el correo usado al reservar.
 */
export default function BookingLookup() {
  const [reference, setReference] = useState('');
  const [email, setEmail] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setBooking(null);
    setLoading(true);
    try {
      const data = await api.lookupBooking(reference.trim(), email.trim());
      setBooking(data.booking);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo consultar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page page-narrow">
      <h1>Encontrá tu reserva</h1>
      <p className="muted">
        Introduce el código de referencia de tu confirmación y el correo con el que reservaste.
      </p>

      <form onSubmit={handleSearch} className="card card-pad lookup-form">
        <label className="field-label" htmlFor="ref">
          Código de referencia
        </label>
        <input
          id="ref"
          type="text"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="RES-XXXXX"
        />
        <label className="field-label" htmlFor="email">
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Buscando…' : 'Buscar'}
        </button>
      </form>

      {error && <Alert type="error">{error}</Alert>}

      {booking && (
        <section className="card card-pad">
          <div className="card-row">
            <h2 className="section-title">{booking.referenceCode}</h2>
            <StatusBadge status={booking.status} />
          </div>
          <ul className="summary-list">
            <li>
              <span>Habitación</span>
              <strong>
                {booking.room?.number ? `N° ${booking.room.number} · ` : ''}
                {booking.room?.name || '—'}
              </strong>
            </li>
            <li>
              <span>Entrada</span>
              <strong>{formatDate(booking.checkIn)}</strong>
            </li>
            <li>
              <span>Salida</span>
              <strong>{formatDate(booking.checkOut)}</strong>
            </li>
            <li>
              <span>Noches</span>
              <strong>{nightsBetween(booking.checkIn, booking.checkOut)}</strong>
            </li>
            <li>
              <span>Método de pago</span>
              <strong>{payMethodLabel(booking.metodoPago)}</strong>
            </li>
            {(booking.extrasSeleccionados || []).map((extra) => (
              <li key={extra.name}>
                <span>{extra.name}</span>
                <strong>{formatPrice(extra.price)}</strong>
              </li>
            ))}
            <li>
              <span>Total</span>
              <strong>{formatPrice(booking.totalPrice)}</strong>
            </li>
          </ul>
        </section>
      )}
    </div>
  );
}