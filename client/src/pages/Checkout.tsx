import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Room } from '../types';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import CheckoutModal from '../components/CheckoutModal';
import {
  nightsBetween,
  parseDateInput,
  todayLocal,
} from '../services/dates';

/**
 * Página pública de checkout.
 * Lee ?room=&in=&out= de la URL, carga la habitación y delega el flujo
 * interactivo (extras, método de pago, confirmación) en CheckoutModal.
 */
export default function Checkout() {
  const [params] = useSearchParams();

  const roomId = params.get('room');
  const checkIn = parseDateInput(params.get('in'));
  const checkOut = parseDateInput(params.get('out'));

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .getRoom(roomId as string)
      .then((data) => setRoom(data.room))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la habitación'))
      .finally(() => setLoading(false));
  }, [roomId]);

  const datesValid = Boolean(
    checkIn && checkOut && checkOut > checkIn && checkIn >= todayLocal()
  );
  const nights = datesValid ? nightsBetween(checkIn as Date, checkOut as Date) : 0;

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
      <CheckoutModal room={room} checkIn={checkIn as Date} checkOut={checkOut as Date} nights={nights} />
    </div>
  );
}