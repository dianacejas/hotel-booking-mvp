import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api, { ApiError } from '../services/api';
import Alert from '../components/Alert';
import {
  formatPrice,
  formatDate,
  nightsBetween,
  parseDateInput,
  todayLocal,
} from '../services/dates';

/**
 * Página pública de checkout.
 * Lee ?room=&in=&out= de la URL, muestra un resumen de la estancia, recoge
 * los datos de contacto del huésped y envía la reserva. Al completarse, el
 * huésped pasa a la pantalla de confirmación con la reserva creada.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const roomId = params.get('room');
  const checkIn = parseDateInput(params.get('in'));
  const checkOut = parseDateInput(params.get('out'));

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', email: '', phone: '' });

  useEffect(() => {
    api
      .getRoom(roomId)
      .then((data) => setRoom(data.room))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'No se pudo cargar la habitación'))
      .finally(() => setLoading(false));
  }, [roomId]);

  const datesValid = checkIn && checkOut && checkOut > checkIn && checkIn >= todayLocal();
  const nights = datesValid ? nightsBetween(checkIn, checkOut) : 0;
  const total = datesValid && room ? Math.round(nights * room.pricePerNight * 100) / 100 : null;

  const isFormValid =
    form.fullName.trim().length > 1 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.phone.trim().length >= 6;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const data = await api.createBooking({
        room: roomId,
        guest: form,
        checkIn: params.get('in'),
        checkOut: params.get('out'),
      });
      navigate('/confirmation', { state: { booking: data.booking } });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Algo salió mal. Inténtalo de nuevo.');
      setSubmitting(false);
    }
  };

  if (loading) return <p className="muted">Cargando…</p>;
  if (!room) return <Alert type="error">{error || 'Habitación no encontrada.'}</Alert>;
  if (!params.get('in') || !params.get('out') || !datesValid) {
    return <Alert type="error">Elige unas fechas válidas antes de continuar.</Alert>;
  }

  return (
    <div className="page page-narrow">
      <h1>Completa tu reserva</h1>

      {error && <Alert type="error">{error}</Alert>}

      <div className="two-col">
        {/* Resumen */}
        <section className="summary">
          <h2 className="section-title">Tu estancia</h2>
          <p className="summary-room">{room.name}</p>
          <ul className="summary-list">
            <li>
              <span>Entrada</span>
              <strong>{formatDate(checkIn)}</strong>
            </li>
            <li>
              <span>Salida</span>
              <strong>{formatDate(checkOut)}</strong>
            </li>
            <li>
              <span>Noches</span>
              <strong>{nights}</strong>
            </li>
            <li>
              <span>Tarifa</span>
              <strong>{formatPrice(room.pricePerNight)} / noche</strong>
            </li>
          </ul>
          <div className="total-row">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>
          <p className="muted small">Pagas en el alojamiento: no se cobra nada por adelantado.</p>
        </section>

        {/* Datos del huésped */}
        <section className="card card-pad">
          <h2 className="section-title">Datos del huésped</h2>
          <form onSubmit={handleSubmit}>
            <label className="field-label" htmlFor="fullName">
              Nombre completo
            </label>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="María García"
              required
            />

            <label className="field-label" htmlFor="email">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="maria@ejemplo.com"
              required
            />

            <label className="field-label" htmlFor="phone">
              Teléfono
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="+34 600 000 000"
              required
            />

            <button type="submit" className="btn btn-primary btn-block" disabled={!isFormValid || submitting}>
              {submitting ? 'Reservando…' : 'Confirmar reserva'}
            </button>
            <Link to="/">← Volver a las habitaciones</Link>
          </form>
        </section>
      </div>
    </div>
  );
}