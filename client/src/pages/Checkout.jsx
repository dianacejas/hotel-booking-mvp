import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import BookingCheckout from '../components/BookingCheckout';
import {
  nightsBetween,
  parseDateInput,
  todayLocal,
} from '../services/dates';

/**
 * Página pública de checkout.
 * Lee ?room=&in=&out= de la URL, carga la habitación y delega el flujo
 * interactivo (extras, método de pago, confirmación con spinner) en el
 * componente BookingCheckout.
 */
export default function Checkout() {
  const [params] = useSearchParams();

  const roomId = params.get('room');
  const checkIn = parseDateInput(params.get('in'));
  const checkOut = parseDateInput(params.get('out'));

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRoom(roomId)
      .then((data) => setRoom(data.room))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la habitación'))
      .finally(() => setLoading(false));
  }, [roomId]);

  const datesValid = checkIn && checkOut && checkOut > checkIn && checkIn >= todayLocal();
  const nights = datesValid ? nightsBetween(checkIn, checkOut) : 0;

  if (loading) return <p className="muted">Cargando…</p>;
  if (!room) return <Alert type="error">{error || 'Habitación no encontrada.'}</Alert>;
  if (!datesValid) {
    return <Alert type="error">Elegí unas fechas válidas antes de continuar.</Alert>;
  }

  return (
    <div className="page page-narrow">
      <h1>Completá tu reserva</h1>
      <p className="muted">
        {nights} {nights === 1 ? 'noche' : 'noches'} de estancia
      </p>
      <BookingCheckout room={room} checkIn={checkIn} checkOut={checkOut} nights={nights} />
    </div>
  );
}