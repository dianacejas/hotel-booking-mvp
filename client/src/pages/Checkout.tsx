import { useSearchParams } from 'react-router-dom';
import { ApiError } from '../services/api';
import { useRoomQuery } from '../hooks/useRooms';
import Alert from '../components/Alert';
import CheckoutModal from '../components/CheckoutModal';
import {
  nightsBetween,
  parseDateInput,
  todayLocal,
} from '../services/dates';

/**
 * Página pública de checkout.
 * Lee ?room=&in=&out= de la URL, carga la habitación (TanStack Query) y
 * delega el flujo interactivo (extras, método de pago, confirmación) en
 * CheckoutModal.
 */
export default function Checkout() {
  const [params] = useSearchParams();

  const roomId = params.get('room');
  const checkIn = parseDateInput(params.get('in'));
  const checkOut = parseDateInput(params.get('out'));

  const roomQuery = useRoomQuery(roomId);
  const room = roomQuery.data;

  const datesValid = Boolean(
    checkIn && checkOut && checkOut > checkIn && checkIn >= todayLocal()
  );
  const nights = datesValid ? nightsBetween(checkIn as Date, checkOut as Date) : 0;

  if (roomQuery.isPending) return <p className="muted">Cargando…</p>;
  if (roomQuery.isError)
    return (
      <Alert type="error">
        {roomQuery.error instanceof ApiError
          ? roomQuery.error.message
          : 'No se pudo cargar la habitación'}
      </Alert>
    );
  if (!room) return <Alert type="error">Habitación no encontrada.</Alert>;
  if (!datesValid) {
    return <Alert type="error">Elegí unas fechas válidas antes de continuar.</Alert>;
  }

  return (
    <div className="page page-narrow">
      <h1>Completá tu reserva</h1>
      <p className="muted">
        {nights} {nights === 1 ? 'noche' : 'noches'} de estancia
      </p>
      <CheckoutModal room={room} checkIn={checkIn as Date} checkOut={checkOut as Date} nights={nights} />
    </div>
  );
}