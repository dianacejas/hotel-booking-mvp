import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useSearchParams } from 'react-router-dom';
import type { Booking } from '../types';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import VoucherConfirmation from '../components/VoucherConfirmation';

type MpStatus = 'success' | 'pending' | 'failure';

const MP_MESSAGES: Record<MpStatus, { text: string; type: 'success' | 'info' | 'error' }> = {
  success: {
    text: 'Pago aprobado por Mercado Pago: tu reserva quedó registrada y confirmada.',
    type: 'success',
  },
  pending: {
    text: 'Mercado Pago quedó con el pago pendiente de aprobación. Podés volver a tu reserva desde "Mi reserva" más adelante.',
    type: 'info',
  },
  failure: {
    text: 'El pago con Mercado Pago no se completó, pero tu reserva quedó registrada como pendiente. Podés pagar al llegar o reintentar el pago.',
    type: 'error',
  },
};

/**
 * Pantalla de confirmación posterior a la reserva.
 * Dos vías de entrada:
 *  - Flujo normal: recepción de la reserva recién creada vía location.state.
 *  - Retorno de Mercado Pago: ?mp=success|pending|failure + referencia de la
 *    reserva guardada en sessionStorage (se recupera con la API pública de lookup).
 */
export default function BookingConfirmation() {
  const location = useLocation();
  const [params] = useSearchParams();
  const mpStatus = (params.get('mp') as MpStatus | null) || null;

  const [booking, setBooking] = useState<Booking | null>(
    () => (location.state?.booking as Booking | undefined) || null
  );
  const [mpError, setMpError] = useState('');
  const mpFallback = Boolean(location.state?.mpFallback);

  useEffect(() => {
    if (!mpStatus || booking) return;

    let raw: string | null = null;
    try {
      raw = sessionStorage.getItem('hb_mp_reference');
    } catch {
      raw = null;
    }

    if (!raw) {
      setMpError('No pudimos recuperar el comprobante de forma automática.');
      return;
    }

    let ref = '';
    let email = '';
    try {
      const parsed = JSON.parse(raw) as { ref?: string; email?: string };
      ref = parsed.ref || '';
      email = parsed.email || '';
    } catch {
      ref = '';
      email = '';
    }

    if (!ref || !email) {
      setMpError('No pudimos recuperar el comprobante de forma automática.');
      return;
    }

    api
      .lookupBooking(ref, email)
      .then((data) => setBooking(data.booking))
      .catch((e) =>
        setMpError(
          e instanceof ApiError ? e.message : 'No se pudo recuperar el comprobante de la reserva.'
        )
      );
  }, [mpStatus, booking]);

  // Vía inexistente: ni hay reserva en memoria ni venimos de Mercado Pago.
  if (!booking && !mpStatus) return <Navigate to="/lookup" replace />;

  return (
    <div className="page page-narrow">
      {mpStatus && !mpError && <Alert type={MP_MESSAGES[mpStatus].type}>{MP_MESSAGES[mpStatus].text}</Alert>}
      {mpFallback && !mpError && (
        <Alert type="info">
          No se pudo iniciar el pago online, pero tu reserva quedó registrada como{' '}
          <strong>pendiente</strong>. Podés coordinarlo desde "Mi reserva" o al llegar al alojamiento.
        </Alert>
      )}
      {mpError && <Alert type="error">{mpError}</Alert>}
      {mpError && (
        <p className="muted">
          Usá el formulario de <Link to="/lookup">"Mi reserva"</Link> con tu código de referencia
          (RES-XXXXX) y tu correo para volver a ver el comprobante.
        </p>
      )}

      {booking ? (
        <>
          <VoucherConfirmation booking={booking} />
          <div className="actions-row no-print">
            <Link to="/" className="btn btn-primary">
              Ver más habitaciones
            </Link>
          </div>
        </>
      ) : (
        !mpError && <p className="muted">Recuperando el comprobante de tu reserva…</p>
      )}
    </div>
  );
}