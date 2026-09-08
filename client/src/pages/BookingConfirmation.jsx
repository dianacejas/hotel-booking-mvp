import { Link, Navigate, useLocation } from 'react-router-dom';
import { formatPrice, formatDate, nightsBetween } from '../services/dates';

/**
 * Pantalla de confirmación posterior a la reserva.
 * Recibe la reserva recién creada desde la página de checkout a través del
 * estado del router y muestra la referencia única (RES-XXXXX).
 */
export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  // Si la página se recarga o se abre directamente no hay nada que mostrar:
  // se dirige al huésped a la consulta pública de reservas.
  if (!booking) return <Navigate to="/lookup" replace />;

  const nights = nightsBetween(booking.checkIn, booking.checkOut);

  return (
    <div className="page page-narrow">
      <div className="alert alert-success confirmation">
        <h1>Reserva confirmada ✓</h1>
        <p className="muted">
          Tu estancia en {booking.room?.name || 'nuestro alojamiento'} está confirmada. Este es tu
          código de referencia: guárdalo en un lugar seguro.
        </p>
      </div>

      <div className="ref-box">
        <span className="muted small">Código de referencia</span>
        <strong className="ref-code">{booking.referenceCode}</strong>
      </div>

      <section className="card card-pad">
        <h2 className="section-title">Resumen</h2>
        <ul className="summary-list">
          <li>
            <span>Huésped</span>
            <strong>{booking.guest.fullName}</strong>
          </li>
          <li>
            <span>Correo</span>
            <strong>{booking.guest.email}</strong>
          </li>
          <li>
            <span>Habitación</span>
            <strong>{booking.room?.name || '—'}</strong>
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
            <strong>{nights}</strong>
          </li>
          <li>
            <span>Total</span>
            <strong>{formatPrice(booking.totalPrice)}</strong>
          </li>
        </ul>
      </section>

      <div className="actions-row">
        <Link to="/" className="btn btn-primary">
          Ver más habitaciones
        </Link>
        <Link to="/lookup" className="btn btn-ghost">
          Consultar una reserva
        </Link>
      </div>
    </div>
  );
}