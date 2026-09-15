import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { PAYMENT_METHODS } from './BookingCheckout';
import { formatPrice, formatDate, nightsBetween } from '../services/dates';

const METHOD_LABEL = Object.fromEntries(PAYMENT_METHODS.map((m) => [m.id, m.label]));

function payMethodLabel(id) {
  return METHOD_LABEL[id] || 'Pagar al llegar (Check-in)';
}

/**
 * Pantalla de confirmación con comprobante imprimible.
 * Muestra el banner de email simulado, un resumen completo con código de
 * reserva, huésped, habitación, extras y método de pago, y un botón de
 * "Imprimir / Guardar Voucher PDF" que emite window.print() con estilos
 * que ocultan el resto de la interfaz.
 */
export default function VoucherConfirmation({ booking }) {
  if (!booking) return null;

  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const roomName = booking.room?.name;
  const roomNumber = booking.room?.number;
  const extras = booking.extrasSeleccionados || [];
  const extrasTotal = extras.reduce((acc, e) => acc + (e.price || 0), 0);
  const roomSubtotal = Math.max(
    0,
    Math.round((booking.totalPrice - extrasTotal) * 100) / 100
  );

  return (
    <div className="voucher-page">
      {/* Banner de correo simulado */}
      <div className="alert alert-success no-print" role="status">
        <strong>✉ Comprobante de reserva enviado a {booking.guest.email}</strong>
        <p className="muted small">
          (Simulación) Si no lo ves en unos minutos, revisá tu carpeta de spam.
        </p>
      </div>

      <div className="actions-row no-print">
        <button type="button" className="btn btn-primary" onClick={() => window.print()}>
          Imprimir / Guardar Voucher PDF
        </button>
        <Link to="/lookup" className="btn btn-ghost">
          Consultar otra reserva
        </Link>
      </div>

      {/* Comprobante imprimible */}
      <article className="card voucher-card" id="voucher">
        <header className="voucher-head">
          <div>
            <p className="voucher-eyebrow">Comprobante de reserva</p>
            <h1 className="voucher-title">Reserva Confirmada</h1>
          </div>
          <StatusBadge status={booking.status} />
        </header>

        <div className="voucher-ref">
          <span className="muted small">Código de reserva</span>
          <strong className="voucher-code">{booking.referenceCode}</strong>
        </div>

        <div className="voucher-stay">
          <div>
            <span className="voucher-label">Check-in</span>
            <strong>{formatDate(booking.checkIn)}</strong>
          </div>
          <div>
            <span className="voucher-label">Check-out</span>
            <strong>{formatDate(booking.checkOut)}</strong>
          </div>
          <div>
            <span className="voucher-label">Noches</span>
            <strong>{nights}</strong>
          </div>
        </div>

        <ul className="voucher-list">
          <li>
            <span className="voucher-label">Huésped</span>
            <strong>{booking.guest.fullName}</strong>
          </li>
          <li>
            <span className="voucher-label">Correo</span>
            <strong>{booking.guest.email}</strong>
          </li>
          <li>
            <span className="voucher-label">Teléfono</span>
            <strong>{booking.guest.phone}</strong>
          </li>
          <li>
            <span className="voucher-label">Habitación</span>
            <strong>{[roomNumber && `N° ${roomNumber}`, roomName].filter(Boolean).join(' · ')}</strong>
          </li>
          <li>
            <span className="voucher-label">Método de pago</span>
            <strong>{payMethodLabel(booking.metodoPago)}</strong>
          </li>
        </ul>

        <table className="voucher-totals">
          <tbody>
            <tr>
              <td>Subtotal habitación ({nights} noches)</td>
              <td>{formatPrice(roomSubtotal)}</td>
            </tr>
            {extras.map((extra) => (
              <tr key={extra.name}>
                <td>{extra.name}</td>
                <td>+ {formatPrice(extra.price)}</td>
              </tr>
            ))}
            {extras.length === 0 && (
              <tr>
                <td>Servicios adicionales</td>
                <td>—</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <th>Total final</th>
              <th>{formatPrice(booking.totalPrice)}</th>
            </tr>
          </tfoot>
        </table>

        <footer className="voucher-foot muted small">
          <p>
            Boutique Carajito · Reserva directa. Presentá este comprobante en el check-in junto con
            un documento de identidad.
          </p>
          <p>Este es un voucher de demostración generado por el sistema de reservas.</p>
        </footer>
      </article>
    </div>
  );
}