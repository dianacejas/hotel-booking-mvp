import { Link, Navigate, useLocation } from 'react-router-dom';
import VoucherConfirmation from '../components/VoucherConfirmation';

/**
 * Pantalla de confirmación posterior a la reserva.
 * Recibe la reserva recién creada desde la página de checkout a través del
 * estado del router y muestra el comprobante imprimible.
 */
export default function BookingConfirmation() {
  const location = useLocation();
  const booking = location.state?.booking;

  // Si la página se recarga o se abre directamente no hay nada que mostrar:
  // se dirige al huésped a la consulta pública de reservas.
  if (!booking) return <Navigate to="/lookup" replace />;

  return (
    <div className="page page-narrow">
      <VoucherConfirmation booking={booking} />
      <div className="actions-row no-print">
        <Link to="/" className="btn btn-primary">
          Ver más habitaciones
        </Link>
      </div>
    </div>
  );
}