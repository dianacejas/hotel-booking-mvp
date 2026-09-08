import { useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice, toDateInputValue, todayLocal } from '../services/dates';

/**
 * Tarjeta de habitación mostrada en la página principal.
 * Permite elegir las fechas de entrada y salida directamente en la tarjeta,
 * calcula un importe estimado y enlaza al checkout con la selección en los
 * parámetros de la URL.
 */
export default function RoomCard({ room }) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [error, setError] = useState('');

  const minCheckIn = toDateInputValue(todayLocal());

  const nights =
    checkIn && checkOut && checkOut > checkIn
      ? Math.round((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
      : 0;

  const ready = checkIn && checkOut && checkOut > checkIn;

  const handleBookClick = () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      setError('Elige una fecha de entrada y una de salida válidas.');
      return;
    }
  };

  const checkoutUrl = ready
    ? `/checkout?room=${room._id}&in=${checkIn}&out=${checkOut}`
    : '';

  return (
    <article className="card">
      <img
        className="card-img"
        src={room.imageUrl || 'https://picsum.photos/seed/room/800/500'}
        alt={room.name}
        loading="lazy"
      />
      <div className="card-body">
        <div className="card-row">
          <h3 className="card-title">{room.name}</h3>
          <span className="price">
            {formatPrice(room.pricePerNight)}
            <small>/noche</small>
          </span>
        </div>
        <p className="card-sub">
          Para {room.capacity} {room.capacity === 1 ? 'persona' : 'personas'}
        </p>

        <div className="amenities">
          {(room.amenities || []).slice(0, 4).map((a) => (
            <span key={a} className="tag">
              {a}
            </span>
          ))}
        </div>

        <div className="booking-widget">
          <div className="field-group">
            <label className="field-label" htmlFor={`in-${room._id}`}>
              Entrada
            </label>
            <input
              id={`in-${room._id}`}
              type="date"
              min={minCheckIn}
              value={checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError('');
              }}
            />
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor={`out-${room._id}`}>
              Salida
            </label>
            <input
              id={`out-${room._id}`}
              type="date"
              min={checkIn || minCheckIn}
              value={checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError('');
              }}
            />
          </div>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="card-row card-actions">
          {nights > 0 && (
            <span className="estimate">
              Est. {nights} noche{nights > 1 ? 's' : ''} · {formatPrice(room.pricePerNight * nights)}
            </span>
          )}
          <Link
            to={checkoutUrl}
            onClick={handleBookClick}
            className={`btn btn-primary ${ready ? '' : 'btn-disabled'}`}
            aria-disabled={!ready}
          >
            Reservar
          </Link>
        </div>
      </div>
    </article>
  );
}